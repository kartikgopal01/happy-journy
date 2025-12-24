import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/admin";
import * as XLSX from "xlsx";

export async function GET() {
  const { isAdmin } = await ensureAdmin();
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Create template data
    const templateData = [
      {
        "Title": "Example Event Name",
        "Description": "This is a sample event description",
        "Location": "Event Venue Address",
        "City": "Mumbai",
        "State": "Maharashtra",
        "Event Date": "2024-12-25",
        "Start Time": "10:00",
        "End Time": "18:00",
        "Category": "Cultural Festival",
        "Price": "500",
        "Max Capacity": "1000",
        "Image URL": "https://example.com/image.jpg",
        "Organizer": "Event Organizer Name",
        "Contact Email": "contact@example.com",
        "Contact Phone": "+91 1234567890",
        "Maps URL": "https://maps.google.com/...",
        "Website": "https://example.com",
        "Tags": "music, outdoor, family-friendly",
        "Is Active": "true"
      }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Events");

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as download
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=events-template.xlsx",
      },
    });
  } catch (error: any) {
    console.error("Template generation error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}

