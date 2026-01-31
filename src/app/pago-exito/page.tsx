import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Home } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

function SuccessContent() {
    return (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 p-3">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground">¡Pago Exitoso!</h1>
                <p className="text-xl text-muted-foreground italic">
                    Tu terreno ha sido reservado correctamente.
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
                <p className="text-muted-foreground">
                    Hemos recibido tu pago y tu lote ya aparece como **Vendido** en nuestro plano.
                    Recibirás un correo de confirmación con los detalles de tu reserva en los próximos minutos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/">
                            <Home className="w-5 h-5" />
                            Volver al Inicio
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PagoExitoPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header projectName="Lomas Del Mar" />
            <main className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Cargando...</div>}>
                    <SuccessContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
