'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDown, Shield } from 'lucide-react';

interface HeroProps {
    onExploreClick: () => void;
}

export const Hero = ({ onExploreClick }: HeroProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const whatsappUrl = "https://wa.me/56973077128?text=" + encodeURIComponent(
        "Hola, quiero información sobre los terrenos en Lomas del Mar"
    );

    // Set video to start at 7 seconds
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = 7;
        }
    }, []);

    return (
        <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
            {/* Video Background */}
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                poster="/hero-poster.jpg"
            >
                <source src="/hero-drone.mp4" type="video/mp4" />
            </video>

            {/* Overlay Gradient - Optimized for better scroll indicator visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 animate-in fade-in-up duration-1000">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium animate-in fade-in-up duration-700">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        Compra Segura con Rol Propio
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight animate-in fade-in-up duration-1000 delay-100">
                        Tu Proyecto de Vida
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                            Comienza Frente al Mar
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed animate-in fade-in-up duration-1000 delay-200">
                        Terrenos 100% urbanizados a 8 min de la playa.
                        <br className="hidden sm:block" />
                        Sin bancos, sin intereses y con financiamiento directo.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-in fade-in-up duration-1000 delay-300">
                        <Button
                            onClick={onExploreClick}
                            size="lg"
                            className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
                        >
                            Ver Disponibilidad
                        </Button>

                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105"
                        >
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                Hablar con Asesor
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Scroll Indicator - Enhanced visibility */}
                <button
                    onClick={onExploreClick}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white transition-all duration-300 hover:scale-110 animate-bounce"
                    aria-label="Scroll to explore"
                >
                    <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                        <span className="text-sm font-bold text-white">Explorar</span>
                    </div>
                    <ChevronDown className="w-6 h-6 text-white" />
                </button>
            </div>
        </section>
    );
};
