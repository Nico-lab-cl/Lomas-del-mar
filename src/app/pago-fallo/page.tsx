"use client";

import { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Home, RefreshCcw, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getLotSpec } from '@/services/lotSpecs';

function PagoFalloContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const lotId = useMemo(() => {
        const raw = searchParams.get('lotId');
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [searchParams]);

    const reason = useMemo(() => {
        const r = searchParams.get('reason');
        return r ? String(r) : null;
    }, [searchParams]);

    const lotLabel = useMemo(() => {
        if (lotId == null) return 'Sin información';
        const spec = getLotSpec(lotId);
        const stage = spec?.stage;
        const stageLotNumber = spec?.stageLotNumber;
        if (stage != null && stageLotNumber != null) return `L-${stageLotNumber} (Etapa ${stage})`;
        return `#${lotId}`;
    }, [lotId]);

    return (
        <div className="min-h-screen bg-background relative z-10">
            <Header projectName="Lomas Del Mar" />

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6 animate-scale-in">
                            <AlertTriangle className="w-12 h-12 text-amber-700 dark:text-amber-300" />
                        </div>

                        <h1 className="text-4xl font-bold text-foreground mb-4">Pago no completado</h1>
                        <p className="text-lg text-muted-foreground">
                            No se pudo finalizar la transacción. Si fue un error temporal, puedes intentar nuevamente.
                        </p>
                    </div>

                    <div className="status-card mb-6">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Detalle</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Estado</p>
                                <p className="text-xl font-semibold text-foreground">Rechazado / Cancelado</p>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Lote</p>
                                <p className="text-xl font-semibold text-foreground">{lotLabel}</p>
                            </div>
                        </div>

                        {reason && (
                            <div className="mt-5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/20 p-4">
                                <div className="flex items-start gap-3">
                                    <LifeBuoy className="w-5 h-5 text-amber-800 dark:text-amber-200 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-amber-900 dark:text-amber-100">Motivo</p>
                                        <p className="text-sm text-amber-800/90 dark:text-amber-200/80">{reason}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={() => router.push('/')} className="gap-2">
                            <Home className="w-5 h-5" />
                            Volver al Inicio
                        </Button>

                        <Button size="lg" variant="outline" onClick={() => window.location.reload()} className="gap-2">
                            <RefreshCcw className="w-5 h-5" />
                            Reintentar
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function PagoFalloPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PagoFalloContent />
        </Suspense>
    );
}
