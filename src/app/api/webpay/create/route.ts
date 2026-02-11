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
    marital_status: z.string().optional(),
    profession: z.string().optional(),
    nationality: z.string().optional(),
    address_street: z.string().optional(),
    address_number: z.string().optional(),
    address_commune: z.string().optional(),
    address_region: z.string().optional(),
});

// Constants moved inside handler to ensure runtime env vars are read correctly

export async function POST(req: NextRequest) {
    try {
        // Read env vars at runtime to avoid build-time inlining issues
        const LOT_LOCK_MINUTES = Number(process.env.LOT_LOCK_MINUTES) || 5;
        const RESERVATION_AMOUNT_CLP = Number(process.env.RESERVATION_AMOUNT_CLP) || 550000;

        const body = await req.json();
        const parsed = createSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
        }

        const {
            lotId, sessionId, name, email, phone, rut,
            marital_status, profession, nationality,
            address_street, address_number, address_commune, address_region
        } = parsed.data;

        const now = new Date();
        const expiresAt = new Date(now.getTime() + LOT_LOCK_MINUTES * 60 * 1000);

        // Generate IDs before transaction
        const reservationId = crypto.randomUUID();
        const folio = `BOL-${reservationId.slice(0, 8).toUpperCase()}`;
        const buyOrder = buildBuyOrder(lotId);

        let amount: number = RESERVATION_AMOUNT_CLP; // Default value
        let lot: any;

        // CRITICAL FIX: Move ALL validations inside transaction to prevent race conditions
        await prisma.$transaction(async (tx: any) => {
            // 1. Check Lot Status (INSIDE TRANSACTION)
            lot = await tx.lot.findUnique({
                where: { id: lotId },
            });

            if (!lot) {
                throw new Error('lot_not_found');
            }

            if (lot.status === 'sold') {
                throw new Error('lot_sold');
            }

            // 2. Check Locks (INSIDE TRANSACTION)
            const lock = await tx.lotLock.findUnique({
                where: { lot_id: lotId },
            });

            if (lock && lock.locked_until > now) {
                if (lock.locked_by !== sessionId) {
                    throw new Error('lot_reserved');
                }
            }

            // CRITICAL FIX: Use real amount from lot or environment variable
            amount = lot.reservation_amount_clp || RESERVATION_AMOUNT_CLP;

            // 3. Create Reservation
            await tx.reservation.create({
                data: {
                    id: reservationId,
                    lot_id: lotId,
                    name,
                    email,
                    phone,
                    rut,
                    marital_status,
                    profession,
                    nationality: nationality || 'Chilena',
                    address_street,
                    address_number,
                    address_commune,
                    address_region,
                    folio,
                    status: 'pending_payment',
                    expires_at: expiresAt,
                    session_id: sessionId
                }
            });

            // 4. Upsert Lock
            await tx.lotLock.upsert({
                where: { lot_id: lotId },
                update: { locked_by: sessionId, locked_until: expiresAt },
                create: { lot_id: lotId, locked_by: sessionId, locked_until: expiresAt }
            });

            // 5. Update Lot Status
            await tx.lot.update({
                where: { id: lotId },
                data: {
                    status: 'reserved',
                    reserved_until: expiresAt,
                    reserved_at: now,
                    reserved_by: sessionId,
                    order_id: buyOrder,
                    updated_at: now
                }
            });
        });

        // 6. Create Webpay Transaction (AFTER successful DB transaction)
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

        // 7. Create Webpay Transaction Record
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

        // Handle specific transaction errors
        if (error instanceof Error) {
            if (error.message === 'lot_not_found') {
                return NextResponse.json({ ok: false, error: 'lot_not_found' }, { status: 404 });
            }
            if (error.message === 'lot_sold') {
                return NextResponse.json({ ok: false, error: 'lot_sold' }, { status: 409 });
            }
            if (error.message === 'lot_reserved') {
                return NextResponse.json({ ok: false, error: 'lot_reserved' }, { status: 409 });
            }
        }

        return NextResponse.json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: String(error)
        }, { status: 500 });
    }
}
