"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getLotSpec, getStageLotSpec } from '@/services/lotSpecs';

type ReceiptData = {
    lot?: {
        id?: unknown;
        number?: unknown;
        stage?: unknown;
        area_m2?: unknown;
        area?: unknown;
        price_total_clp?: unknown;
    };
    reservation?: Record<string, unknown>;
    payment?: Record<string, unknown>;
};

const safeText = (v: unknown): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v.length ? v : '—';
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    return String(v);
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === 'object' ? (v as Record<string, unknown>) : null;

function PagoExitoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [receiptError, setReceiptError] = useState<'pending_confirmation' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const lotId = useMemo(() => {
        const raw = searchParams.get('lotId');
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [searchParams]);

    const reservationId = useMemo(() => {
        const raw = searchParams.get('reservationId');
        return raw ? String(raw) : null;
    }, [searchParams]);

    const receiptLotId = useMemo(() => {
        const raw = receipt?.lot?.id;
        return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
    }, [receipt]);

    const receiptStage = useMemo(() => {
        const raw = receipt?.lot?.stage;
        return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
    }, [receipt]);

    const receiptMetraje = useMemo(() => {
        const rawA = receipt?.lot?.area_m2;
        if (typeof rawA === 'number' && Number.isFinite(rawA) && rawA > 0) return rawA;
        const rawB = receipt?.lot?.area;
        if (typeof rawB === 'number' && Number.isFinite(rawB) && rawB > 0) return rawB;
        return null;
    }, [receipt]);

    const lotSpecMetraje = useMemo(() => {
        if (receiptLotId == null) return null;
        const stageFromReceipt = receiptStage;

        const numberRaw = receipt?.lot?.number;
        const parsedNumber = Number.parseInt(String(numberRaw), 10);
        const stageLotNumber = Number.isFinite(parsedNumber) ? parsedNumber : null;

        const spec =
            stageFromReceipt != null && stageLotNumber != null
                ? getStageLotSpec(stageFromReceipt, stageLotNumber)
                : getLotSpec(receiptLotId);

        const area = spec?.area_m2;
        return typeof area === 'number' && Number.isFinite(area) && area > 0 ? area : null;
    }, [receipt, receiptLotId, receiptStage]);

    const lotMetrajeToShow = receiptMetraje ?? lotSpecMetraje;

    const summaryLotLabel = useMemo(() => {
        const receiptNumberRaw = receipt?.lot?.number;
        if (receiptNumberRaw != null) return `L-${safeText(receiptNumberRaw)}`;
        if (lotId == null) return 'Sin información';

        const spec = getLotSpec(lotId);
        if (spec?.stageLotNumber != null) return `L-${spec.stageLotNumber}`;
        return `#${lotId}`;
    }, [lotId, receipt]);

    const summaryStageLabel = useMemo(() => {
        if (receiptStage != null) return `Etapa ${receiptStage}`;
        if (lotId == null) return null;
        const spec = getLotSpec(lotId);
        return spec?.stage != null ? `Etapa ${spec.stage}` : null;
    }, [lotId, receiptStage]);

    useEffect(() => {
        if (!reservationId) return;
        let cancelled = false;

        setReceipt(null);
        setReceiptError(null);

        const run = async () => {
            setIsLoading(true);

            const MAX_ATTEMPTS = 10;
            const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

            try {
                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
                    if (cancelled) return;

                    try {
                        const res = await fetch(`/api/receipt/${encodeURIComponent(reservationId)}`);
                        const jsonUnknown: unknown = await res.json().catch(() => null);
                        const json =
                            jsonUnknown && typeof jsonUnknown === 'object' ? (jsonUnknown as Record<string, unknown>) : null;

                        const ok = Boolean(json && json['ok']);
                        if (!res.ok || !ok) {
                            throw new Error('receipt_not_ready');
                        }

                        const data = json?.['data'] as unknown;
                        if (!cancelled) {
                            setReceipt((data ?? null) as ReceiptData | null);
                            setReceiptError(null);
                        }
                        return;
                    } catch {
                        if (attempt >= MAX_ATTEMPTS) {
                            if (!cancelled) setReceiptError('pending_confirmation');
                            return;
                        }
                        await delay(1000);
                    }
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [reservationId]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="min-h-screen bg-background relative z-10">
            <style>{`
        @media print {
          @page { margin: 12mm; }
          html, body { background: #fff !important; }
          header, footer { display: none !important; }
          .no-print { display: none !important; }
          main { padding: 0 !important; }
          .print-container { max-width: none !important; margin: 0 !important; }
          .print-area { border: 0 !important; background: #fff !important; padding: 0 !important; }
          .print-area * { box-shadow: none !important; }
          .print-area a[href]:after { content: "" !important; }
        }
      `}</style>
            <Header projectName="Lomas Del Mar" />

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto print-container">
                    <div className="text-center mb-8 no-print">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6 animate-scale-in">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            {receipt ? 'Pago confirmado' : 'Procesando confirmación...'}
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {receipt
                                ? 'Tu reserva fue procesada correctamente.'
                                : 'Estamos validando tu pago, por favor espera unos segundos.'}
                        </p>
                    </div>

                    <div className="status-card mb-6 print-area">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Resumen</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Estado</p>
                                <p className="text-xl font-semibold text-foreground">
                                    {receipt ? 'Aprobado' : isLoading ? 'Procesando confirmación...' : 'En verificación'}
                                </p>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Lote</p>
                                <p className="text-xl font-semibold text-foreground">{summaryLotLabel}</p>
                                {summaryStageLabel && (
                                    <p className="text-sm text-muted-foreground">{summaryStageLabel}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-xl font-bold text-foreground mb-4">Boleta / Comprobante</h3>

                            {isLoading && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Procesando confirmación...</p>
                                </div>
                            )}

                            {!isLoading && receiptError === 'pending_confirmation' && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Pago procesado, pero aún estamos confirmando la boleta. Refresca en 30 segundos.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2 break-all">
                                        reservationId: {safeText(reservationId)}
                                    </p>
                                </div>
                            )}

                            {!isLoading && !receiptError && receipt && (
                                <div className="rounded-lg border border-border bg-muted/20 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-background rounded-lg border border-border">
                                            <p className="text-sm text-muted-foreground mb-2">Comprador</p>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-foreground">{safeText(receipt.reservation?.name)}</p>
                                                <p className="text-sm text-muted-foreground">{safeText(receipt.reservation?.email)}</p>
                                                <p className="text-sm text-muted-foreground">{safeText(receipt.reservation?.phone)}</p>
                                                <p className="text-sm text-muted-foreground">{safeText(receipt.reservation?.rut)}</p>
                                                <p className="text-sm text-muted-foreground">{safeText(receipt.reservation?.address)}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-background rounded-lg border border-border">
                                            <p className="text-sm text-muted-foreground mb-2">Lote</p>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-foreground">
                                                    {receipt?.lot?.number != null ? `L-${safeText(receipt.lot.number)}` : lotId != null ? `#${lotId}` : '—'}
                                                </p>
                                                {receiptStage != null && (
                                                    <p className="text-sm text-muted-foreground">Etapa {receiptStage}</p>
                                                )}
                                                {lotMetrajeToShow != null && (
                                                    <p className="text-sm text-muted-foreground">Metraje {lotMetrajeToShow} m²</p>
                                                )}
                                                <p className="text-sm text-muted-foreground">{safeText(receipt.reservation?.folio)}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-background rounded-lg border border-border md:col-span-2">
                                            <p className="text-sm text-muted-foreground mb-2">Pago (Webpay)</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Orden</p>
                                                    <p className="text-sm font-semibold text-foreground break-all">{safeText(receipt.payment?.buy_order)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Monto</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {(() => {
                                                            const amount = asRecord(receipt.payment)?.amount_clp;
                                                            return typeof amount === 'number' && Number.isFinite(amount) ? formatCurrency(amount) : '—';
                                                        })()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Autorización</p>
                                                    <p className="text-sm font-semibold text-foreground">{safeText(receipt.payment?.authorization_code)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Estado</p>
                                                    <p className="text-sm font-semibold text-foreground">{safeText(receipt.payment?.status)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Código respuesta</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {asRecord(receipt.payment)?.response_code != null ? safeText(asRecord(receipt.payment)?.response_code) : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Cuotas</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {asRecord(receipt.payment)?.installments_number != null
                                                            ? safeText(asRecord(receipt.payment)?.installments_number)
                                                            : '—'}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-3">
                                                    <p className="text-xs text-muted-foreground">Token (referencia)</p>
                                                    <p className="text-sm text-muted-foreground break-all">{safeText(receipt.payment?.token)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end no-print">
                                        <Button variant="outline" onClick={() => window.print()} className="gap-2">
                                            <FileText className="w-4 h-4" />
                                            Descargar / Guardar PDF
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 no-print">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">Siguiente paso</p>
                                    <p className="text-sm text-emerald-800/90 dark:text-emerald-200/80">
                                        Guarda esta confirmación. Nuestro equipo se pondrá en contacto contigo para coordinar los siguientes pasos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
                        <Button size="lg" onClick={() => router.push('/')} className="gap-2">
                            <Home className="w-5 h-5" />
                            Volver al Inicio
                        </Button>

                        <Button size="lg" variant="outline" onClick={() => window.print()} className="gap-2">
                            <FileText className="w-5 h-5" />
                            Imprimir
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function PagoExitoPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PagoExitoContent />
        </Suspense>
    );
}
