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
        "Name": "Example Hotel Name",
        "City": "Mumbai",
        "State": "Maharashtra",
        "Address": "Hotel Address, Street, Area",
        "Price Per Night": "3000",
        "Rating": "4",
        "Amenities": "WiFi, Pool, Restaurant, Parking",
        "Maps URL": "https://maps.google.com/...",
        "Website": "https://example.com",
        "Contact": "+91 1234567890"
      }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hotels");

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as download
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=hotels-template.xlsx",
      },
    });
  } catch (error: any) {
    console.error("Template generation error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}

