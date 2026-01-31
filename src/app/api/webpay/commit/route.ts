import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpayCommit, WEBPAY_CONFIG } from '@/lib/transbank';
import { computeLotDetailsFromId } from '@/lib/logic';

// N8N Webhook URL
const N8N_WEBHOOK_URL = 'https://n8n-n8n.yszha2.easypanel.host/webhook/7b928d3b-2850-462d-87df-f6a87fe4108a';

export const dynamic = 'force-dynamic';

async function handleCommitRequest(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    let token = searchParams.get('token_ws') || searchParams.get('TBK_TOKEN');

    // Handle POST body if needed (Transbank sometimes posts)
    if (!token && req.method === 'POST') {
        try {
            const formData = await req.formData();
            token = formData.get('token_ws') as string || formData.get('TBK_TOKEN') as string;
        } catch (e) {
            // ignore
        }
    }

    // If user hit "Anular" on Webpay form
    const tbkOrdine = searchParams.get('TBK_ORDEN_COMPRA');
    if (!token && tbkOrdine) {
        // Aborted by user
        return NextResponse.redirect(`${WEBPAY_CONFIG.finalFailUrl}?reason=aborted_by_user`);
    }

    if (!token) {
        return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
    }

    try {
        // 1. Commit with Transbank
        const commitRes = await webpayCommit(token) as any;

        // 2. Find Transaction
        const txRow = await prisma.webpayTransaction.findUnique({
            where: { token },
            include: { reservation: true, lot: true }
        });

        if (!txRow) {
            return NextResponse.redirect(`${WEBPAY_CONFIG.finalFailUrl}?reason=tx_not_found`);
        }

        const now = new Date();
        // Update Transaction
        await prisma.webpayTransaction.update({
            where: { id: txRow.id },
            data: {
                status: commitRes.status,
                response_code: commitRes.response_code,
                authorization_code: commitRes.authorization_code,
                payment_type_code: commitRes.payment_type_code,
                installments_number: commitRes.installments_number,
                transaction_date: commitRes.transaction_date ? new Date(commitRes.transaction_date) : now,
                processed_at: now
            }
        });

        const isAuthorized = commitRes.response_code === 0 && (commitRes.status === 'AUTHORIZED' || commitRes.status === 'AUTHORIZED');

        if (isAuthorized) {
            // SUCCESS
            await prisma.reservation.update({
                where: { id: txRow.reservation_id },
                data: { status: 'paid' }
            });

            await prisma.lot.update({
                where: { id: txRow.lot_id },
                data: {
                    status: 'sold',
                    updated_at: now
                }
            });

            // Delete other locks for this lot? (Assuming locks are handled by key, but logic says delete all locks for this lot)
            await prisma.lotLock.deleteMany({
                where: { lot_id: txRow.lot_id }
            });

            // Construct detailed payload for N8N
            const lotDetails = computeLotDetailsFromId(txRow.lot_id);
            const payload = {
                contact_name: txRow.reservation.name,
                contact_email: txRow.reservation.email,
                contact_phone: txRow.reservation.phone,
                contact_rut: txRow.reservation.rut,
                contact_address: txRow.reservation.address,

                lot_number: lotDetails.number,
                lot_id: String(txRow.lot_id),
                lot_stage: lotDetails.stage,
                lot_area_m2: lotDetails.area_m2,
                lot_total_price: lotDetails.price_total_clp,

                amount_paid: String(txRow.amount_clp),
                transbank_order_id: txRow.buy_order,
                authorization_code: String(commitRes.authorization_code),
                payment_status: 'approved',
                timestamp: now.toISOString(),

                reservation_id: txRow.reservation_id,
                folio: txRow.reservation.folio,
                token_ws: token,
                webpay_status: String(commitRes.status),
                response_code: String(commitRes.response_code),
                payment_type_code: String(commitRes.payment_type_code),
                installments_number: String(commitRes.installments_number),

                lot_price_label: lotDetails.price_total_clp ? '' : 'Consultar',
            };

            // Trigger N8N (Non-blocking)
            fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error('N8N Trigger Failed', err));

            return NextResponse.redirect(`${WEBPAY_CONFIG.finalOkUrl}?lotId=${txRow.lot_id}&reservationId=${txRow.reservation_id}`);

        } else {
            // FAILED
            await prisma.reservation.update({
                where: { id: txRow.reservation_id },
                data: { status: 'canceled' }
            });

            await prisma.lotLock.deleteMany({
                where: { lot_id: txRow.lot_id, locked_by: txRow.reservation.session_id || '' }
            });

            return NextResponse.redirect(`${WEBPAY_CONFIG.finalFailUrl}?reason=start_error`); // 'start_error' mimics original code logic for general failure
        }

    } catch (error) {
        console.error('Commit Error', error);
        return NextResponse.redirect(`${WEBPAY_CONFIG.finalFailUrl}?reason=exception`);
    }
}

export async function GET(req: NextRequest) {
    return handleCommitRequest(req);
}

export async function POST(req: NextRequest) {
    return handleCommitRequest(req);
}
