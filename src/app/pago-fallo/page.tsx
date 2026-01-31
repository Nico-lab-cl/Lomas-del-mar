import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCcw, Home } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

function FailureContent() {
    return (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                    <XCircle className="w-16 h-16 text-red-600" />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground">El pago no se concretó</h1>
                <p className="text-xl text-muted-foreground">
                    Hubo un problema al procesar tu transacción o ésta fue cancelada.
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
                <p className="text-muted-foreground">
                    No te preocupes, no se ha realizado ningún cargo a tu tarjeta.
                    El lote que intentaste reservar sigue bloqueado por unos minutos para que puedas volver a intentarlo.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button asChild variant="outline" size="lg" className="gap-2">
                        <Link href="/">
                            <RefreshCcw className="w-5 h-5" />
                            Reintentar Pago
                        </Link>
                    </Button>
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/">
                            <Home className="w-5 h-5" />
                            Volver al Mapa
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PagoFalloPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header projectName="Lomas Del Mar" />
            <main className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Cargando...</div>}>
                    <FailureContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
