import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getNextAdvisorId } from "@/lib/assignment";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    // 1. Fetch unassigned leads from Meta and Web
    const unassignedLeads = await (prisma as any).lead.findMany({
      where: {
        assignedToId: null,
        OR: [
          { source: { contains: 'META', mode: 'insensitive' } },
          { source: { contains: 'WEB', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'asc' } // Process oldest first
    });

    if (unassignedLeads.length === 0) {
      return NextResponse.json({ message: "No hay leads sin asignar." });
    }

    let processedCount = 0;
    const assignments = [];

    for (const lead of unassignedLeads) {
      // 2. Get next advisor using existing Round Robin logic
      const assignedToId = await getNextAdvisorId();

      // 3. Update lead
      const updatedLead = await (prisma as any).lead.update({
        where: { id: lead.id },
        data: { assignedToId }
      });

      // 4. Trigger notification
      await createNotification({
        userId: assignedToId,
        title: "Nuevo Lead Asignado (Móvil) 👤",
        body: `Se te ha asignado un lead pendiente de ${lead.source}: ${lead.firstName} ${lead.lastName || ''}`,
        leadId: lead.id,
        type: "ASSIGNMENT",
      });

      assignments.push({
        lead: `${lead.firstName} ${lead.lastName || ''}`,
        assignedToId,
        source: lead.source
      });
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      totalProcessed: processedCount,
      assignments
    });
  } catch (error: any) {
    console.error("Error in bulk assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
