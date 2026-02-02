import { Droplets, Zap, FileCheck, ShieldCheck, Car, Footprints, Sun, Trees } from "lucide-react";

const features = [
    {
        title: "Agua Certificada",
        desc: "Resolución Seremi de Salud",
        icon: Droplets
    },
    {
        title: "Luz Eléctrica",
        desc: "Red aérea instalada",
        icon: Zap
    },
    {
        title: "Rol Individual",
        desc: "Escritura inmediata",
        icon: FileCheck,
        highlight: true
    },
    {
        title: "Acceso Controlado",
        desc: "Portón automático",
        icon: ShieldCheck
    },
    {
        title: "Calles Compactadas",
        desc: "Maicillo de alto tránsito",
        icon: Car
    },
    {
        title: "Veredas y Soleras",
        desc: "Urbanización completa",
        icon: Footprints
    },
    {
        title: "Iluminación Solar",
        desc: "Luminarias en calles",
        icon: Sun
    },
    {
        title: "Áreas Verdes",
        desc: "Espacios comunes",
        icon: Trees
    }
];

export const ProjectFeatures = () => {
    return (
        <section className="bg-slate-50 py-16 md:py-24">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 font-heading">
                        Todo lo que incluye tu terreno
                    </h2>
                    <p className="text-lg md:text-xl text-gray-500 font-medium">
                        Urbanización de alto estándar pensada para tu comodidad y seguridad.
                    </p>
                </div>

                {/* Grid Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`
                group bg-white rounded-2xl p-6 
                border-2 transition-all duration-300
                hover:-translate-y-2 hover:shadow-xl
                ${feature.highlight
                                    ? 'border-emerald-500/30 shadow-emerald-100 ring-4 ring-emerald-500/5'
                                    : 'border-slate-100 shadow-sm hover:border-emerald-500/20'
                                }
              `}
                        >
                            <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center mb-6
                transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                ${feature.highlight ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-50 text-emerald-600'}
              `}>
                                <feature.icon className="w-7 h-7" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
