import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { filePath } = await req.json();

  if (!filePath) {
    return NextResponse.json({ error: "File path is required" }, { status: 400 });
  }

  const results: any[] = [];

  return new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const importedLeads = await Promise.all(
            results.map((row) => {
              // Map CSV columns to Lead model
              // Header: First Name, Last Name, Phone, Email, etc. (based on user's CSV)
              return prisma.lead.create({
                data: {
                  firstName: row["First Name"] || row["Nombre"],
                  lastName: row["Last Name"] || row["Apellido"],
                  phone: row["Phone"] || row["Teléfono"],
                  email: row["Email"] || row["Correo"],
                  source: "CSV Import",
                  status: "NEW",
                },
              });
            })
          );
          resolve(NextResponse.json({ message: `Imported ${importedLeads.length} leads` }));
        } catch (error) {
          console.error("Import error:", error);
          resolve(NextResponse.json({ error: "Import failed" }, { status: 500 }));
        }
      });
  });
}
