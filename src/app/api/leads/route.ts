import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { syncExternalLeads } from "@/lib/syncLeads";

export const dynamic = "force-dynamic";

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
  const status = searchParams.get("status");
  const visited = searchParams.get("visited");
  const rating = searchParams.get("rating");
  const search = searchParams.get("q");
  const unassigned = searchParams.get("unassigned") === "true";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // --- TRIGGER SYNC if source is web aliminspa.cl ---
  if (source === "web aliminspa.cl") {
    try {
      console.log("Triggering on-demand sync for external leads...");
      await syncExternalLeads();
    } catch (syncErr) {
      console.error("Sync failed, continuing with existing local data", syncErr);
    }
  }

  // Build where clause
  let where: any = {};
  
  if (source && source !== "TODOS") {
    where.source = source;
  }

  if (status && status !== "TODOS") {
    where.status = status;
  }

  if (rating && rating !== "TODOS") {
    where.rating = rating;
  }

  if (visited === "true") {
    where.visited = true;
  }

  if (search) {
    const tokens = search.trim().split(/\s+/);
    if (tokens.length > 0) {
      where.AND = tokens.map(token => ({
        OR: [
          { firstName: { contains: token, mode: 'insensitive' } },
          { lastName: { contains: token, mode: 'insensitive' } },
          { phone: { contains: token } },
          { email: { contains: token, mode: 'insensitive' } },
        ]
      }));
    }
  }

  if (startDate || endDate) {
    where.createdAt = {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined,
    };
  }

  // Role-based filtering and specialized 'unassigned' view
  const userSession = session as any;
  if (userSession?.user) {
    if (userSession.user.role === "ADMIN") {
      if (unassigned) {
        where.assignedToId = null;
      }
    } else {
      // Non-admins only see theirs
      where.assignedToId = userSession.user.id;
    }
  }

  try {
    const [leads, total] = await Promise.all([
      (prisma as any).lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      }),
      (prisma as any).lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Leads API Error:", error);
    return NextResponse.json({ 
      error: "Error al obtener los leads", 
      details: error.message 
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
    
    let leadData: any = {
      contactId: data.contactId || data.lead_id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email?.toLowerCase(),
      businessName: data.businessName,
      city: data.city,
      source: data.source || "WEB",
      tags: data.tags,
      lastActivity: data.lastActivity,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmContent: data.utmContent,
      utmTerm: data.utmTerm,
      adId: data.adId || data.ad_id,
      adName: data.adName || data.ad_name,
      formId: data.formId || data.form_id,
      interests: data.interests,
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
          case "email": leadData.email = value.toLowerCase(); break;
          case "phone_number": leadData.phone = value; break;
          case "proyecto": 
          case "interes":
          case "proyecto_de_interes":
            leadData.interests = value;
            break;
        }
      });
    }

    // Check if lead exists to determine if we should auto-assign
    const existingLead = await (prisma as any).lead.findUnique({
      where: { email: leadData.email },
      select: { id: true, assignedToId: true }
    });

    let assignedToId = null;
    const userSession = session as any;

    if (userSession?.user?.id && userSession.user.role === "ASESOR") {
      // If an advisor is creating the lead, assign it to them directly
      assignedToId = userSession.user.id;
      leadData.assignedToId = assignedToId;
    } else if (!existingLead) {
      // New lead from external or admin! Auto-assign using Round Robin
      const { getNextAdvisorId } = await import("@/lib/assignment");
      assignedToId = await getNextAdvisorId();
      leadData.assignedToId = assignedToId;
    }

    const lead = await (prisma as any).lead.upsert({
      where: { email: leadData.email },
      update: {
        ...leadData,
        createdAt: new Date(), // Arrival time!
      },
      create: leadData,
    });
    
    // Trigger notification if it's a new assignment
    if (!existingLead && assignedToId) {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        userId: assignedToId,
        title: "Nuevo Lead Asignado (Auto) 🤖",
        body: `Se te ha asignado un nuevo lead de ${leadData.source}: ${leadData.firstName} ${leadData.lastName || ''}`,
        leadId: lead.id,
        type: "ASSIGNMENT",
      });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error?.message || String(error),
      meta: error?.meta
    }, { status: 500 });
  }
}
