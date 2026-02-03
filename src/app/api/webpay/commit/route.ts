import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpayCommit, WEBPAY_CONFIG } from '@/lib/transbank';
import { computeLotDetailsFromId } from '@/lib/logic';

// N8N Webhook Configuration handled inside request to ensure runtime access

export const dynamic = 'force-dynamic';

async function handleCommitRequest(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    let token = searchParams.get('token_ws') || searchParams.get('TBK_TOKEN');

    // Read env vars at runtime to prevent build-time inlining
    // Read env vars or fallback to HARDCODED URL provided by user
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n-n8n.yszha2.easypanel.host/webhook/7b928d3b-2850-462d-87df-f6a87fe4108a';
    const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

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

            // Construct detailed payload for N8N using REAL DB data
            // We avoid computeLotDetailsFromId because DB IDs might not match hardcoded ranges
            const lot = txRow.lot;

            const payload = {
                contact_name: txRow.reservation.name,
                contact_email: txRow.reservation.email,
                contact_phone: txRow.reservation.phone,
                contact_rut: txRow.reservation.rut,
                contact_address: txRow.reservation.address,

                lot_number: lot.number,
                lot_id: String(lot.id),
                lot_stage: lot.stage,
                lot_area_m2: lot.area_m2,
                lot_total_price: lot.price_total_clp,

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

                lot_price_label: lot.price_total_clp ? '' : 'Consultar',
            };

            // Trigger N8N (Non-blocking)
            if (N8N_WEBHOOK_URL) {
                if (!N8N_WEBHOOK_SECRET) {
                    console.warn('[n8n] N8N_WEBHOOK_SECRET not configured, sending webhook without signature', { reservationId: txRow.reservation_id });
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(N8N_WEBHOOK_SECRET ? { 'X-Webhook-Secret': N8N_WEBHOOK_SECRET } : {})
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                })
                    .then(response => {
                        clearTimeout(timeoutId);
                        if (response.ok) {
                            console.log('[n8n] Webhook sent successfully', { reservationId: txRow.reservation_id, status: response.status });
                        } else {
                            console.warn('[n8n] Webhook returned non-OK status', { reservationId: txRow.reservation_id, status: response.status });
                        }
                    })
                    .catch(err => {
                        clearTimeout(timeoutId);
                        console.error('[n8n] Webhook failed', { reservationId: txRow.reservation_id, error: err instanceof Error ? err.message : String(err) });
                    });
            } else {
                console.warn('[n8n] N8N_WEBHOOK_URL not configured, skipping webhook', { reservationId: txRow.reservation_id });
            }

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
