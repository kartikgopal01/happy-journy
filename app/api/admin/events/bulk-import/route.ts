import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/admin";
import { getAdminDb } from "@/lib/firebaseAdmin";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  const { isAdmin, userEmail, userId } = await ensureAdmin();
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Excel file is empty or invalid" }, { status: 400 });
    }

    const db = getAdminDb();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        // Map Excel columns to event fields
        const title = row["Title"] || row["title"] || row["Event Title"] || "";
        const description = row["Description"] || row["description"] || "";
        const location = row["Location"] || row["location"] || row["Venue"] || "";
        const eventDate = row["Event Date"] || row["eventDate"] || row["Date"] || "";
        
        // Validate required fields
        if (!title || !description || !location || !eventDate) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields (Title, Description, Location, Event Date)`);
          continue;
        }

        // Parse date
        let eventDateTimestamp: number;
        try {
          const date = new Date(eventDate);
          if (isNaN(date.getTime())) {
            // Try parsing as Excel date number
            eventDateTimestamp = (new Date((eventDate - 25569) * 86400 * 1000)).getTime();
          } else {
            eventDateTimestamp = date.getTime();
          }
        } catch {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Invalid date format`);
          continue;
        }

        // Create event document
        const eventData = {
          title: String(title).trim(),
          description: String(description).trim(),
          location: String(location).trim(),
          city: row["City"] || row["city"] || null,
          state: row["State"] || row["state"] || null,
          eventDate: eventDateTimestamp,
          startTime: row["Start Time"] || row["startTime"] || row["StartTime"] || null,
          endTime: row["End Time"] || row["endTime"] || row["EndTime"] || null,
          category: row["Category"] || row["category"] || "General",
          price: row["Price"] || row["price"] ? Number(row["Price"] || row["price"]) : null,
          maxCapacity: row["Max Capacity"] || row["maxCapacity"] || row["MaxCapacity"] ? Number(row["Max Capacity"] || row["maxCapacity"] || row["MaxCapacity"]) : null,
          imageUrl: row["Image URL"] || row["imageUrl"] || row["ImageUrl"] || null,
          organizer: row["Organizer"] || row["organizer"] || null,
          contactEmail: row["Contact Email"] || row["contactEmail"] || row["ContactEmail"] || null,
          contactPhone: row["Contact Phone"] || row["contactPhone"] || row["ContactPhone"] || null,
          mapsUrl: row["Maps URL"] || row["mapsUrl"] || row["MapsUrl"] || null,
          website: row["Website"] || row["website"] || null,
          tags: row["Tags"] || row["tags"] ? String(row["Tags"] || row["tags"]).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          isActive: row["Is Active"] !== undefined ? (String(row["Is Active"]).toLowerCase() === "true" || row["Is Active"] === true) : true,
          createdAt: Date.now(),
          createdBy: userId,
        };

        await db.collection("events").add(eventData);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success} successful, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Failed to import events", details: error.message }, { status: 500 });
  }
}

