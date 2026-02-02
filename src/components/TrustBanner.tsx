import { Banknote, Key, TrendingUp } from "lucide-react";

export const TrustBanner = () => {
    return (
        <section className="bg-emerald-50 py-12 border-b border-emerald-100/50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Crédito Directo */}
                    <div className="flex flex-col items-center text-center gap-4 group hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                            <Banknote className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <span className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            Crédito Directo
                        </span>
                    </div>

                    {/* Entrega Inmediata */}
                    <div className="flex flex-col items-center text-center gap-4 group hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                            <Key className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <span className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            Entrega Inmediata
                        </span>
                    </div>

                    {/* Alta Plusvalía */}
                    <div className="flex flex-col items-center text-center gap-4 group hover:scale-105 transition-transform duration-300">
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                            <TrendingUp className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <span className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                            Alta Plusvalía
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};
