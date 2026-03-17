import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { queryExternal } from "@/lib/externalDb";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isExternal = searchParams.get("external") === "true";
  const email = searchParams.get("email");

  try {
    let lead: any = null;

    if (isExternal && email) {
      // 1. Fetch from External DB
      const res = await queryExternal(`
        SELECT id, nombre as "firstName", '' as "lastName", email, celular as phone, 
               proyecto as "source", ciudad, created_at, 'WEB' as label,
               utm_source, utm_medium, utm_campaign, utm_content, utm_term
        FROM leads WHERE LOWER(email) = LOWER($1)
        UNION ALL
        SELECT id, '' as "firstName", '' as "lastName", email, '' as phone, 
               'Newsletter' as "source", '' as ciudad, created_at, 'BOLETÍN' as label,
               null, null, null, null, null
        FROM newsletter_subscribers WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `, [email]);

      if (res.rows.length > 0) {
        const extLead = res.rows[0];
        // 2. Merge with local tracking
        const local = await (prisma as any).lead.findUnique({
          where: { email: email }
        });
        
        lead = {
          ...extLead,
          status: local?.status || "FRIO",
          notes: local?.notes || "",
          visited: local?.visited || false,
          interests: local?.interests || "",
          lastNoteAt: local?.lastNoteAt,
          isExternal: true
        };
      }
    } else {
      // Standard local lookup
      lead = await (prisma as any).lead.findUnique({
        where: { id: params.id },
        include: {
          assignedTo: {
            select: { name: true, image: true }
          }
        }
      });
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead detail:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const isExternal = data.isExternal;
    const email = data.email;
    
    let updatedLead;

    if (isExternal && email) {
      // Upsert local tracking data using email for external leads
      updatedLead = await (prisma as any).lead.upsert({
        where: { email: email },
        update: {
          status: data.status,
          notes: data.notes,
          visited: data.visited,
          interests: data.interests,
          lastNoteAt: data.notes ? new Date() : undefined,
        },
        create: {
          email: email,
          firstName: data.firstName || "Web Lead",
          lastName: data.lastName || "",
          phone: data.phone || "",
          source: data.source || "WEB",
          status: data.status || "FRIO",
          notes: data.notes,
          visited: data.visited || false,
          interests: data.interests,
          lastNoteAt: data.notes ? new Date() : undefined,
        }
      });
    } else {
      updatedLead = await (prisma as any).lead.update({
        where: { id: params.id },
        data: {
          status: data.status,
          notes: data.notes,
          visited: data.visited,
          interests: data.interests,
          lastNoteAt: data.notes ? new Date() : undefined,
        },
      });
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
