import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  
  const source = searchParams.get("source");
  const search = searchParams.get("q");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build where clause
  let where: any = {};
  
  if (source && source !== "TODOS") {
    where.source = source;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count({ where })
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message,
      code: error.code // Prisma error code if any
    }, { status: 500 });
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
