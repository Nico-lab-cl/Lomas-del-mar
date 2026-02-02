import { Banknote, Key, TrendingUp } from "lucide-react";

export const TrustBanner = () => {
    return (
        <section className="bg-emerald-50/80 py-12 border-b border-emerald-100 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Crédito Directo */}
                    <div className="flex flex-col items-center text-center gap-3 group hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white/80 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-emerald-100">
                            <Banknote className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                                Crédito Directo
                            </h3>
                            <p className="text-sm font-medium text-emerald-700/80">
                                Sin bancos, 0% interés
                            </p>
                        </div>
                    </div>

                    {/* Entrega Inmediata */}
                    <div className="flex flex-col items-center text-center gap-3 group hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white/80 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-emerald-100">
                            <Key className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                                Entrega Inmediata
                            </h3>
                            <p className="text-sm font-medium text-emerald-700/80">
                                Con Rol Propio individual
                            </p>
                        </div>
                    </div>

                    {/* Alta Plusvalía */}
                    <div className="flex flex-col items-center text-center gap-3 group hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white/80 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-emerald-100">
                            <TrendingUp className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                                Alta Plusvalía
                            </h3>
                            <p className="text-sm font-medium text-emerald-700/80">
                                Sector de gran crecimiento
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
