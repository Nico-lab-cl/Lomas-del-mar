import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
        }

        const lot = await prisma.lot.findUnique({
            where: { id: parseInt(id) },
        });

        if (!lot) {
            return NextResponse.json({ error: 'Lot not found', id }, { status: 404 });
        }

        // Return the raw lot data to see exactly what the DB has
        return NextResponse.json({
            success: true,
            data: lot,
            checked_at: new Date().toISOString(),
            env_db_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'undefined'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Database error', details: String(error) }, { status: 500 });
    }
}
