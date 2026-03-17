import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { interests, notes } = await req.json();
    
    // In a real app we might create a separate Visit record, 
    // but for now we update the lead's status and tracking fields
    const updatedLead = await (prisma as any).lead.update({
      where: { id: params.id },
      data: {
        visited: true,
        interests: interests || undefined,
        notes: notes ? notes : undefined,
        lastActivity: "Visita registrada",
      } as any,
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    return NextResponse.json({ error: "Error registering visit" }, { status: 500 });
  }
}
