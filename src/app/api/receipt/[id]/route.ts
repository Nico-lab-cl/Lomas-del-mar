import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                lot: true,
                transactions: {
                    where: { status: 'AUTHORIZED', response_code: 0 },
                    take: 1
                }
            }
        });

        if (!reservation) {
            return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
        }

        const tx = reservation.transactions[0];

        return NextResponse.json({
            ok: true,
            data: {
                reservation,
                lot: reservation.lot,
                payment: tx
            }
        });
    } catch (error) {
        return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
    }
}
