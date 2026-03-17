"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Phone, MessageSquare, Mail, 
  Clock, Calendar, MapPin, User, ChevronRight,
  MoreVertical, Edit2, CheckCircle2, AlertCircle,
  ArrowRight, StickyNote, LayoutGrid
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  notes: string;
  visited: boolean;
  interests: string;
  createdAt: string;
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/leads/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setLead(data);
        } else {
          setError("No se pudo encontrar la información del lead.");
        }
      } catch (err) {
        setError("Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!lead || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLead({ ...lead, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleVisited = async () => {
    if (!lead || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visited: !lead.visited }),
      });
      if (res.ok) {
        setLead({ ...lead, visited: !lead.visited });
      }
    } catch (err) {
      console.error("Error updating visited status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2">¡Ups!</h2>
        <p className="text-slate-500 text-sm mb-6">{error || "Algo salió mal"}</p>
        <button 
          onClick={() => router.back()}
          className="bg-primary text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-primary/20"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-30 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Ficha del Lead</h1>
        <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Profile Header */}
      <section className="bg-white px-6 py-8 mb-4 border-b border-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-4">
            <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <User size={48} strokeWidth={1.5} />
            </div>
            {lead.visited && (
              <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                <CheckCircle2 size={16} />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1">
            {lead.firstName} {lead.lastName}
          </h2>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span className="text-primary/70">{lead.source}</span>
            <span>•</span>
            <span>Registrado {new Date(lead.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <a 
            href={`tel:${lead.phone}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-all">
              <Phone size={24} fill="currentColor" className="fill-blue-500/10" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Llamar</span>
          </a>
          <a 
            href={`https://wa.me/${lead.phone.replace(/\+/g, '')}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-all">
              <MessageSquare size={24} fill="currentColor" className="fill-green-500/10" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</span>
          </a>
          <a 
            href={`mailto:${lead.email}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-all">
              <Mail size={24} fill="currentColor" className="fill-red-500/10" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
          </a>
        </div>
      </section>

      {/* Details Sections */}
      <div className="px-6 space-y-4">
        {/* Status Tracker */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado del Lead</h3>
            <div className={clsx(
              "px-3 py-1 rounded-full text-[10px] font-black tracking-widest",
              lead.status === "MUY INTERESADO" ? "bg-green-100 text-green-600" :
              lead.status === "INTERES" ? "bg-orange-100 text-orange-600" :
              "bg-slate-100 text-slate-500"
            )}>
              {lead.status}
            </div>
          </div>
          
          <div className="flex justify-between items-center px-2">
            {["FRIO", "INTERES", "MUY INTERESADO"].map((s, idx) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                className={clsx(
                  "relative flex flex-col items-center gap-2 transition-all",
                  isUpdating && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={clsx(
                  "w-4 h-4 rounded-full border-2 transition-all",
                  lead.status === s ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/20" : "bg-white border-slate-200"
                )} />
                <span className={clsx(
                  "text-[8px] font-black uppercase tracking-tighter",
                  lead.status === s ? "text-primary" : "text-slate-300"
                )}>{s}</span>
              </button>
            ))}
            <div className="absolute left-[calc(1.5rem+3.5rem)] right-[calc(1.5rem+3.5rem)] h-[2px] bg-slate-100 -z-10 top-[calc(6.5rem)]" />
          </div>
        </div>

        {/* Visit Status */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                    <MapPin size={24} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-800">Visita a Terreno</h3>
                    <p className="text-[10px] font-bold text-slate-400">{lead.visited ? "Asistencia confirmada" : "Pendiente de visita"}</p>
                 </div>
              </div>
              <button 
                onClick={toggleVisited}
                className={clsx(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  lead.visited ? "bg-primary" : "bg-slate-200",
                  isUpdating && "opacity-50"
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                  lead.visited ? "left-7" : "left-1"
                )} />
              </button>
           </div>
        </div>

        {/* Interests & Projects */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Intereses y Proyecto</h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold border border-slate-100 flex items-center gap-2">
              <LayoutGrid size={14} className="text-primary" />
              {lead.source}
            </span>
            {lead.interests?.split(',').map((interest, idx) => (
              <span key={idx} className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-xs font-bold border border-primary/10">
                {interest.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Observaciones y Notas</h3>
             <button className="text-primary p-2 active:scale-90 transition-all">
                <Edit2 size={16} />
             </button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
             <div className="flex items-start gap-3">
                <StickyNote size={18} className="text-primary/50 mt-1" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                  "{lead.notes || "No hay observaciones registradas para este lead."}"
                </p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Floating Footer Action */}
      <div className="fixed bottom-6 left-6 right-6 z-40 max-w-[432px] mx-auto">
         <button className="w-full bg-primary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
            REGISTRAR ACTIVIDAD
            <ChevronRight size={20} />
         </button>
      </div>
    </div>
  );
}
