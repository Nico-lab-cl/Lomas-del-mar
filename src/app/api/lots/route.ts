import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const lots = await prisma.lot.findMany({
            orderBy: { id: 'asc' },
        });

        return NextResponse.json({ ok: true, data: lots });
    } catch (error) {
        console.error('Error fetching lots:', error);
        return NextResponse.json({ ok: false, error: 'failed_to_fetch_lots' }, { status: 500 });
    }
}
