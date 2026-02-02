'use client';

import { Button } from '@/components/ui/button';
import { Map as MapIcon, ChevronLeft, Menu, X, Info } from 'lucide-react';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

interface NavigationSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onOpenPlano: () => void;
}

export const NavigationSidebar = ({ isOpen, setIsOpen, onOpenPlano }: NavigationSidebarProps) => {
    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-1/2 -translate-y-1/2 right-0 z-50 shadow-2xl transition-all duration-300 flex items-center gap-2 group border-y border-l border-white/20
          ${isOpen
                        ? 'translate-x-[0] right-[400px] bg-red-500 hover:bg-red-600 text-white rounded-l-2xl p-4'
                        : 'translate-x-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-l-xl py-6 pl-4 pr-2'
                    }`}
                aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
                {isOpen ? (
                    <>
                        <X className="w-8 h-8 md:w-6 md:h-6" />
                        <span className="font-bold text-sm hidden md:inline">CERRAR</span>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 animate-pulse-slow">
                        <Menu className="w-6 h-6 animate-bounce" />
                        <span className="writing-vertical text-xs font-black tracking-widest uppercase opacity-90 hidden md:block" style={{ writingMode: 'vertical-rl' }}>
                            INFO & MAPA
                        </span>
                    </div>
                )}
            </button>

            {/* Hint / Callout for user (Visible only when closed initially) */}
            {!isOpen && (
                <div className="fixed top-1/2 -translate-y-1/2 right-14 z-40 hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right-8 duration-1000 delay-1000 fill-mode-forwards">
                    <div className="bg-white text-emerald-900 px-4 py-2 rounded-xl shadow-xl border border-emerald-100 relative">
                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 border-r border-t border-emerald-100"></div>
                        <p className="text-sm font-bold whitespace-nowrap">¡Haz clic para ver detalles!</p>
                    </div>
                </div>
            )}

            {/* Backdrop (Mobile only) */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-[400px] max-w-[85vw] bg-card/95 backdrop-blur-md border-l border-border shadow-2xl z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto no-scrollbar pt-20 pb-24 md:pb-6 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-6 flex flex-col gap-6">
                    {/* Header / Close (Mobile) */}
                    <div className="flex items-center justify-between md:hidden">
                        <h3 className="text-lg font-bold">Menú</h3>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Ver Plano Button */}
                    <div>
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Navegación</h3>
                        <div className="space-y-3">
                            <Button
                                onClick={() => {
                                    onOpenPlano();
                                    setIsOpen(false); // Auto close on mobile/desktop selection
                                }}
                                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                            >
                                <MapIcon className="w-5 h-5 mr-2" />
                                Ver Plano
                            </Button>

                            <GoogleMapsButton
                                variant="outline"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* How to Purchase - Instructions */}
                    <div className="pt-6 border-t border-border">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Cómo Comprar</h3>
                        <div className="space-y-3">
                            {[
                                { step: 1, title: 'Selecciona tu lote', desc: 'Haz clic en el terreno disponible (verde) en el mapa' },
                                { step: 2, title: 'Revisa los detalles', desc: 'Verifica precio, superficie y características' },
                                { step: 3, title: 'Completa tus datos', desc: 'Ingresa tu información personal en el formulario' },
                                { step: 4, title: 'Confirma tu reserva', desc: 'Presiona "Confirmar" para proceder al pago' },
                            ].map((item) => (
                                <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                                        {item.step}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Logos */}
                        <div className="mt-4 pt-4 border-t border-dashed border-border/50">
                            <p className="text-xs text-muted-foreground font-medium mb-2 text-center">Pagos Seguros vía WebPay</p>
                            <div className="flex justify-center items-center gap-3">
                                <img src="/Mastercard-logo.svg" alt="Mastercard" className="h-6 w-auto" />
                                <img src="/Diseño sin título (2).svg" alt="Visa" className="h-6 w-auto" />
                                <img src="/Diseño sin título (1).svg" alt="Payment" className="h-6 w-auto" />
                                <img src="/Diseño sin título (3).svg" alt="Redcompra" className="h-6 w-auto" />
                            </div>
                        </div>
                    </div>

                    {/* Legend Section */}
                    <div className="pt-6 border-t border-border">
                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Estado del Terreno</p>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/20" />
                                <span className="text-sm font-bold text-foreground">DISPONIBLE</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-amber-500 shadow-md shadow-amber-500/30 ring-2 ring-amber-500/20" />
                                <span className="text-sm font-bold text-foreground">RESERVADO</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-red-500 shadow-md shadow-red-500/30 ring-2 ring-red-500/20" />
                                <span className="text-sm font-bold text-foreground">VENDIDO</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-500 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20" />
                                <span className="text-sm font-bold text-foreground">TU SELECCIÓN</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
