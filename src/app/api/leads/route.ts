import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions as any);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-crm-api-key");
  const isExternalRequest = apiKey === "lomas_del_mar_secret_2026";
  
  let session = null;
  if (!isExternalRequest) {
    session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const data = await req.json();
    
    // Parsing logic for Meta leads (n8n field_data)
    let leadData: any = {
      contactId: data.contactId || data.lead_id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      businessName: data.businessName,
      source: data.source || "WEB",
      tags: data.tags,
      lastActivity: data.lastActivity,
    };

    // If it comes from Meta field_data array
    if (data.field_data && Array.isArray(data.field_data)) {
      data.field_data.forEach((field: { name: string; values: string[] }) => {
        const value = field.values?.[0];
        if (!value) return;

        switch (field.name) {
          case "first_name": leadData.firstName = value; break;
          case "last_name": leadData.lastName = value; break;
          case "full_name": 
            const parts = value.split(" ");
            leadData.firstName = parts[0];
            leadData.lastName = parts.slice(1).join(" ");
            break;
          case "email": leadData.email = value; break;
          case "phone_number": leadData.phone = value; break;
        }
      });
    }

    const newLead = await prisma.lead.create({
      data: leadData,
    });
    
    return NextResponse.json(newLead);
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
