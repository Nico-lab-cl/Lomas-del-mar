import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { webpayCreate, WEBPAY_CONFIG } from '@/lib/transbank';
import { buildBuyOrder, isValidRut } from '@/lib/logic';
import { z } from 'zod';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
    lotId: z.number().int().positive(),
    sessionId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    rut: z
        .string()
        .regex(/^\d{1,3}\.\d{3}\.\d{3}-[0-9Kk]$/, 'invalid_rut_format')
        .refine((v) => isValidRut(v), 'invalid_rut_dv'),
    address: z.string().min(5),
});

const LOT_LOCK_MINUTES = 5;
const RESERVATION_AMOUNT_CLP = 550000;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = createSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
        }

        const { lotId, sessionId, name, email, phone, rut, address } = parsed.data;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + LOT_LOCK_MINUTES * 60 * 1000);

        // 1. Check Lot Status
        const lot = await prisma.lot.findUnique({
            where: { id: lotId },
        });

        if (!lot) {
            return NextResponse.json({ ok: false, error: 'lot_not_found' }, { status: 404 });
        }

        if (lot.status === 'sold') {
            return NextResponse.json({ ok: false, error: 'lot_sold' }, { status: 409 });
        }

        // 2. Check Locks
        const lock = await prisma.lotLock.findUnique({
            where: { lot_id: lotId },
        });

        if (lock && lock.locked_until > now) {
            if (lock.locked_by !== sessionId) {
                return NextResponse.json({ ok: false, error: 'lot_reserved' }, { status: 409 });
            }
        }

        // 3. Create Reservation (Pending)
        const reservationId = crypto.randomUUID();
        const folio = `BOL-${reservationId.slice(0, 8).toUpperCase()}`;

        // Transactional creation
        await prisma.$transaction(async (tx: any) => {
            await tx.reservation.create({
                data: {
                    id: reservationId,
                    lot_id: lotId,
                    name,
                    email,
                    phone,
                    rut,
                    address,
                    folio,
                    status: 'pending_payment',
                    expires_at: expiresAt,
                    session_id: sessionId
                }
            });

            await tx.lotLock.upsert({
                where: { lot_id: lotId },
                update: { locked_by: sessionId, locked_until: expiresAt },
                create: { lot_id: lotId, locked_by: sessionId, locked_until: expiresAt }
            });

            await tx.lot.update({
                where: { id: lotId },
                data: {
                    status: 'reserved',
                    reserved_until: expiresAt,
                    reserved_at: now,
                    reserved_by: sessionId,
                    updated_at: now
                }
            });
        });

        const buyOrder = buildBuyOrder(lotId);

        // TEMPORARY FOR PRODUCTION TEST: Force amount to $50 CLP for ALL lots
        const amount = 50;

        await prisma.lot.update({
            where: { id: lotId },
            data: { order_id: buyOrder }
        });

        const webpayRes = await webpayCreate({
            buyOrder,
            sessionId,
            amount,
            returnUrl: WEBPAY_CONFIG.returnUrl,
        });

        // @ts-ignore
        const token = webpayRes.token;
        // @ts-ignore
        const url = webpayRes.url;

        // 5. Create Webpay Transaction Record
        await prisma.webpayTransaction.create({
            data: {
                token,
                buy_order: buyOrder,
                amount_clp: amount,
                reservation_id: reservationId,
                lot_id: lotId,
                status: 'INITIALIZED'
            }
        });

        return NextResponse.json({ ok: true, token, url });

    } catch (error) {
        console.error('Webpay Create Error:', error);
        return NextResponse.json({ ok: false, error: 'internal_server_error' }, { status: 500 });
    }
}
