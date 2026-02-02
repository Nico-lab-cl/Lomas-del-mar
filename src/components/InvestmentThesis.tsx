'use client';

import { Wallet, Timer, ShieldCheck, TrendingUp } from 'lucide-react';
import Image from 'next/image';

const benefits = [
    {
        icon: Wallet,
        title: "Ingresos Pasivos",
        desc: "Flujo constante sin gestión activa"
    },
    {
        icon: Timer,
        title: "Retornos Inmediatos",
        desc: "Plusvalía desde el día uno"
    },
    {
        icon: ShieldCheck,
        title: "Seguridad y Transparencia",
        desc: "Modelo de negocio claro y legal"
    },
    {
        icon: TrendingUp,
        title: "Altos Retornos",
        desc: "Rentabilidad superior al mercado"
    }
];

export const InvestmentThesis = () => {
    return (
        <section className="relative w-full py-20 md:py-32 overflow-hidden">
            {/* 1. Imagen de Fondo */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/terreno-bg.JPG"
                    alt="Terreno de inversión"
                    fill
                    className="object-cover"
                />
                {/* Overlay Oscuro Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-900/30 mix-blend-multiply" />
            </div>

            {/* 2. Contenido */}
            <div className="relative z-10 container mx-auto px-4 text-center">

                {/* Logo */}
                <div className="mb-8 flex justify-center">
                    <div className="relative w-40 h-12 md:w-52 md:h-16">
                        <Image
                            src="/logo.png"
                            alt="Alimin Logo"
                            fill
                            className="object-contain brightness-0 invert"
                        />
                    </div>
                </div>

                {/* Texto Principal */}
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl mx-auto leading-tight mb-16 font-outfit">
                    "Somos una empresa productora de capital lo que nos permite generar
                    <span className="text-emerald-400"> retornos y rentabilidades de gran escala </span>
                    en corto/medio plazo (1 a 2 años)"
                </h2>

                {/* Grid de Bullets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-6xl mx-auto">
                    {benefits.map((item, index) => (
                        <div key={index} className="flex flex-col items-center group">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 backdrop-blur-sm group-hover:bg-emerald-500/20 transition-all duration-300 group-hover:scale-110">
                                <item.icon className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-white font-bold text-lg md:text-xl mb-1 font-outfit">
                                {item.title.split(' ')[0]} <br className="hidden md:block" />
                                {item.title.split(' ').slice(1).join(' ')}
                            </h3>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};
