"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, Save, CheckCircle2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function VisitRegistrationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [visited, setVisited] = useState(true);
  const [selectedLand, setSelectedLand] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${params.id}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          visited, 
          interests: selectedLand,
          notes: visited ? `Visita confirmada al terreno: ${selectedLand}` : "Visita no concretada"
        }),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/leads/${params.id}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Error registering visit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-[#f6f8f8] text-slate-900 min-h-screen relative">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-lg mx-auto bg-white shadow-xl">
        <header className="flex items-center p-4 border-b border-primary/10 justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <button 
            onClick={() => router.back()}
            className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-slate-900 text-lg font-black leading-tight tracking-tight flex-1 text-center uppercase">Registrar Visita</h2>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 p-6 space-y-8">
          {/* Section 1: Confirmation */}
          <section className="space-y-4">
            <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1 block opacity-70">1. Confirmación de Visita</label>
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-center justify-between gap-4">
              <span className="text-slate-700 font-bold text-lg leading-tight uppercase tracking-tight">¿El lead visitó el terreno?</span>
              <button 
                onClick={() => setVisited(!visited)}
                className={clsx(
                  "w-14 h-8 rounded-full p-1 transition-all duration-300 relative",
                  visited ? "bg-[#32CD32]" : "bg-slate-200"
                )}
              >
                <div className={clsx(
                  "w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300",
                  visited ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
          </section>

          {/* Section 2: Ubicación */}
          <section className={clsx("space-y-4 transition-all", !visited && "opacity-40 pointer-events-none")}>
            <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1 block opacity-70">2. Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <select 
                value={selectedLand}
                onChange={(e) => setSelectedLand(e.target.value)}
                className="w-full pl-12 pr-12 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-slate-700 font-bold text-lg appearance-none outline-none"
              >
                <option value="">Seleccionar terreno visitado</option>
                <option value="Lote 45 - Valle Escondido">Lote 45 - Valle Escondido</option>
                <option value="Sector Norte - Finca La Paz">Sector Norte - Finca La Paz</option>
                <option value="Predio Industrial Santa Fe">Predio Industrial Santa Fe</option>
                <option value="Terreno Residencial Mirador">Terreno Residencial Mirador</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </section>

          {/* GPS Verification Simulation */}
          <div className={clsx(
            "bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3 transition-all",
             visited ? "opacity-100" : "opacity-0"
          )}>
            <div className="bg-[#32CD32] text-white rounded-full p-1.5 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-green-800 text-sm font-bold uppercase tracking-tight">Ubicación GPS verificada correctamente.</p>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSubmit}
              disabled={loading || (visited && !selectedLand)}
              className="w-full bg-[#32CD32] hover:brightness-95 text-white font-black text-xl py-6 rounded-2xl shadow-xl shadow-green-500/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
            >
              {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={24} />}
              GUARDAR REGISTRO
            </button>
            <p className="text-center text-slate-400 text-[10px] pt-6 uppercase tracking-[0.2em] font-black">
              Conexión encriptada SSL
            </p>
          </div>
        </main>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed inset-x-0 bottom-10 px-4 flex justify-center z-[100] animate-bounce">
          <div className="bg-slate-900 shadow-2xl text-white px-8 py-4 rounded-full flex items-center gap-3 border border-white/10">
            <CheckCircle2 className="text-green-400" size={24} />
            <span className="font-black uppercase text-sm tracking-widest">¡Registro guardado con éxito!</span>
          </div>
        </div>
      )}
    </div>
  );
}
