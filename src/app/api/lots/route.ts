import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    await headers(); // Force dynamic
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
