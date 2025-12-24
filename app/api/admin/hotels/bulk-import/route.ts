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
        // Map Excel columns to hotel fields
        const name = row["Name"] || row["name"] || row["Hotel Name"] || "";
        const city = row["City"] || row["city"] || "";
        
        // Validate required fields
        if (!name || !city) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields (Name, City)`);
          continue;
        }

        // Create hotel document
        const hotelData = {
          name: String(name).trim(),
          city: String(city).trim(),
          cityLower: String(city).trim().toLowerCase(),
          state: row["State"] || row["state"] || null,
          address: row["Address"] || row["address"] || null,
          location: { latitude: null, longitude: null },
          pricePerNightINR: row["Price Per Night"] || row["pricePerNight"] || row["PricePerNight"] ? Number(row["Price Per Night"] || row["pricePerNight"] || row["PricePerNight"]) : null,
          rating: row["Rating"] || row["rating"] ? Number(row["Rating"] || row["rating"]) : null,
          amenities: row["Amenities"] || row["amenities"] ? String(row["Amenities"] || row["amenities"]).split(",").map((a: string) => a.trim()).filter(Boolean) : [],
          mapsUrl: row["Maps URL"] || row["mapsUrl"] || row["MapsUrl"] || null,
          website: row["Website"] || row["website"] || null,
          contact: row["Contact"] || row["contact"] || null,
          createdAt: Date.now(),
          createdBy: userId,
        };

        await db.collection("partner_hotels").add(hotelData);
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
    return NextResponse.json({ error: "Failed to import hotels", details: error.message }, { status: 500 });
  }
}

