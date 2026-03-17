import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { queryExternal } from "@/lib/externalDb";

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
  const search = searchParams.get("q");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build where clause
  let where: any = {};
  
  if (source && source !== "TODOS") {
    where.source = source;
  }

  if (status && status !== "TODOS") {
    where.status = status;
  }

  if (visited === "true") {
    where.visited = true;
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

  // --- CONTEXT SWITCH: EXTERNAL DB (WEB ALIMINSPA.CL) ---
  if (source === "web aliminspa.cl") {
    try {
      // 1. Fetch leads from external DB
      let externalLeads: any[] = [];
      const offset = (page - 1) * limit;
      
      // Timezone adjustment for Chile (UTC-3)
      const chileOffset = "INTERVAL '3 hours'";
      
      // Filtering logic for external SQL
      let leadsQuery = `
        SELECT id, nombre as "firstName", '' as "lastName", email, celular as phone, 
               'WEB' as "label", created_at, proyecto as "source", ciudad
        FROM leads 
        WHERE 1=1
      `;
      let newsletterQuery = `
        SELECT id, '' as "firstName", '' as "lastName", email, '' as phone, 
               'BOLETÍN' as "label", created_at, 'Newsletter' as "source", '' as ciudad
        FROM newsletter_subscribers 
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIdx = 1;

      if (search) {
        const s = `%${search}%`;
        leadsQuery += ` AND (nombre ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR celular ILIKE $${paramIdx})`;
        newsletterQuery += ` AND (email ILIKE $${paramIdx})`;
        params.push(s);
        paramIdx++;
      }

      if (startDate) {
        leadsQuery += ` AND created_at >= $${paramIdx}`;
        newsletterQuery += ` AND created_at >= $${paramIdx}`;
        params.push(new Date(startDate));
        paramIdx++;
      }

      if (endDate) {
        leadsQuery += ` AND created_at <= $${paramIdx}`;
        newsletterQuery += ` AND created_at <= $${paramIdx}`;
        params.push(new Date(endDate));
        paramIdx++;
      }

      // Unified query combining both tables
      const combinedQuery = `
        (${leadsQuery}) UNION ALL (${newsletterQuery})
        ORDER BY created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `;
      params.push(limit, offset);

      const countQuery = `SELECT COUNT(*) FROM ((${leadsQuery}) UNION ALL (${newsletterQuery})) as combined`;
      const countParams = params.slice(0, paramIdx - 1);

      const [res, countRes] = await Promise.all([
        queryExternal(combinedQuery, params),
        queryExternal(countQuery, countParams)
      ]);

      const total = parseInt(countRes.rows[0].count);
      const rawExternalLeads = res.rows;

      // 2. Hybrid Merge: Fetch local notes/status from local CRM Prisma DB
      const emails = rawExternalLeads.map(l => l.email).filter(Boolean);
      const localData = await (prisma as any).lead.findMany({
        where: { email: { in: emails } },
        select: { email: true, status: true, notes: true, visited: true, interests: true }
      });

      // Map local data for quick lookup
      const localMap = new Map(localData.map((l: any) => [l.email, l]));

      const leads = rawExternalLeads.map(l => {
        const local = localMap.get(l.email) as any;
        return {
          ...l,
          status: local?.status || "FRIO",
          notes: local?.notes || "",
          visited: local?.visited || false,
          interests: local?.interests || "",
          isExternal: true
        };
      });

      return NextResponse.json({
        leads,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      });
    } catch (err: any) {
      console.error("External Fetch Error:", err);
      return NextResponse.json({ error: "Error de conexión con la base externa de Aliminspa", details: err.message }, { status: 500 });
    }
  }

  // --- LOCAL DB FLOW (Default) ---
  try {
    const [leads, total] = await Promise.all([
      (prisma as any).lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      (prisma as any).lead.count({ where })
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

    const newLead = await (prisma as any).lead.create({
      data: leadData,
    });
    
    return NextResponse.json(newLead);
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
