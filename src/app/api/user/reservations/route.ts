import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Determine user ID. If session has ID, use it. If not, lookup by email.
        let userId = session.user.id;

        if (!userId) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email }
            });
            if (user) {
                userId = user.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const reservations = await prisma.reservation.findMany({
            where: {
                buyer_id: userId,
            },
            include: {
                lot: true,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        return NextResponse.json(reservations);
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
