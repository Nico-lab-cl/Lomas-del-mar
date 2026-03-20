"use client";

import { useEffect, useState } from "react";
import { MessageSquare, User, Clock, ChevronRight, Facebook, Instagram, Search } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const leadName = conv.lead ? `${conv.lead.firstName} ${conv.lead.lastName}` : "Usuario Meta";
    return leadName.toLowerCase().includes(search.toLowerCase()) || conv.psid.includes(search);
  });

  return (
    <div className="flex flex-col h-screen bg-[#F5F7F9]">
      {/* Header */}
      <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bandeja de Entrada</h1>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o ID..." 
            className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            Cargando conversaciones...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-12 text-center opacity-40 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p className="font-medium">No hay conversaciones aún</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredConversations.map((conv) => (
              <Link 
                key={conv.id} 
                href={`/inbox/${conv.id}`}
                className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 transition-colors active:bg-slate-100"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                    {conv.lead?.image ? (
                        <img src={conv.lead.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={24} />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center ring-2 ring-white">
                    {conv.platform === "facebook" ? (
                        <Facebook size={12} className="text-[#1877F2]" fill="currentColor" />
                    ) : (
                        <Instagram size={12} className="text-[#E4405F]" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800 truncate">
                      {conv.lead ? `${conv.lead.firstName} ${conv.lead.lastName}` : `Usuario Meta (${conv.psid.slice(-4)})`}
                    </h3>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                      {conv.messages[0] ? formatDistanceToNow(new Date(conv.messages[0].createdAt), { addSuffix: true, locale: es }) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {conv.messages[0] ? conv.messages[0].text : "Sin mensajes"}
                  </p>
                </div>

                <ChevronRight size={18} className="text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
