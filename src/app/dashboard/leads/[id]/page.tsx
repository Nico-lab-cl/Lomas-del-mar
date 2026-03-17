"use client";

import { useEffect, useState } from "react";
import { 
  ArrowLeft, MoreVertical, Phone, MessageSquare, 
  Mail, User as UserIcon, Smartphone, Map as MapIcon, 
  Edit3, Save, ChevronRight, Tent as Landscape
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  notes: string;
  interests: string;
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setLead(data);
        setNote(data.notes || "");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      if (res.ok) {
        // Show success state if needed
      }
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!lead) return <div>Lead not found</div>;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f6f8f8] overflow-x-hidden pb-24">
      {/* Header */}
      <div className="flex items-center bg-[#f6f8f8] p-4 border-b border-primary/10 justify-between sticky top-0 z-10">
        <button 
          onClick={() => router.back()}
          className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Detalle del Lead</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex items-center justify-center rounded-full size-10 bg-transparent text-slate-900">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex p-6">
        <div className="flex w-full flex-col gap-4 items-center">
          <div className="flex gap-4 flex-col items-center">
            <div className="relative w-32 h-32 rounded-full border-4 border-primary/20 shadow-lg overflow-hidden bg-white flex items-center justify-center">
              <UserIcon size={64} className="text-primary/20" />
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-slate-900 text-2xl font-bold leading-tight tracking-tight text-center">
                {lead.firstName} {lead.lastName}
              </p>
              <span className="mt-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                {lead.status === 'NEW' ? 'Nuevo Lead' : lead.status}
              </span>
              <p className="text-slate-500 text-sm mt-2 font-medium text-center italic">
                {lead.source || "Sin origen definido"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      <div className="grid grid-cols-1 gap-4 px-4 mb-6">
        <ContactButton 
          icon={Phone} 
          label="Llamar Ahora" 
          bgColor="bg-[#4CAF50]" 
          onClick={() => window.open(`tel:${lead.phone}`)}
        />
        <ContactButton 
          icon={MessageSquare} 
          label="WhatsApp" 
          bgColor="bg-[#25D366]" 
          onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g,'')}`)}
        />
        <ContactButton 
          icon={Mail} 
          label="Enviar Correo" 
          bgColor="bg-[#D4AF37]" 
          onClick={() => window.open(`mailto:${lead.email}`)}
        />
      </div>

      {/* Form Information */}
      <div className="px-4 py-2">
        <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-widest px-1 pb-3 opacity-40">Datos del Formulario</h3>
        <div className="bg-white rounded-2xl overflow-hidden border border-primary/5 shadow-sm">
          <InfoRow label="Nombre Completo" value={`${lead.firstName} ${lead.lastName}`} icon={UserIcon} />
          <InfoRow label="Teléfono" value={lead.phone} icon={Smartphone} />
          <InfoRow label="Terreno de interés" value={lead.interests || "General"} icon={Landscape} border={false} />
        </div>
      </div>

      {/* Notes Section */}
      <div className="px-4 py-6">
        <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-widest px-1 pb-3 opacity-40 flex items-center gap-2">
          <Edit3 size={12} /> Notas de Seguimiento
        </h3>
        <div className="relative group">
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-32 p-4 bg-white border border-primary/10 rounded-2xl text-slate-900 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-300 shadow-sm"
            placeholder="Escribe aquí observaciones sobre la llamada o el interés del cliente..."
          />
          <div className="absolute bottom-3 right-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
            <button 
              onClick={handleSaveNote}
              disabled={savingNote}
              className="bg-primary text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              {savingNote ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
              Guardar Nota
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions for Visita */}
      <div className="px-4 pb-8">
         <button 
           onClick={() => router.push(`/dashboard/leads/${lead.id}/visit`)}
           className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
         >
           <MapIcon size={20} />
           Registrar Visita al Terreno
         </button>
      </div>
    </div>
  );
}

function ContactButton({ icon: Icon, label, bgColor, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between w-full p-5 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all",
        bgColor
      )}
    >
      <div className="flex items-center gap-4">
        <Icon size={24} />
        <span className="text-base font-black uppercase tracking-wider">{label}</span>
      </div>
      <ChevronRight size={20} />
    </button>
  );
}

function InfoRow({ label, value, icon: Icon, border = true }: any) {
  return (
    <div className={clsx(
      "flex justify-between items-center p-4",
      border && "border-b border-primary/5"
    )}>
      <div className="flex flex-col">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <p className="text-slate-900 text-sm font-bold mt-0.5">{value || "---"}</p>
      </div>
      <Icon size={18} className="text-primary/20" />
    </div>
  );
}
