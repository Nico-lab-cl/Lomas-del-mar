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
  const [activeTab, setActiveTab] = useState<"all" | "facebook" | "instagram" | "comments">("all");

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
    const leadName = conv.lead ? `${conv.lead.firstName} ${conv.lead.lastName}` : (conv.metaName || "Usuario Meta");
    const matchesSearch = leadName.toLowerCase().includes(search.toLowerCase()) || conv.psid.includes(search);
    
    if (!matchesSearch) return false;
    
    const lastMsgType = conv.messages[0]?.sourceType || "DIRECT";

    if (activeTab === "all") return true;
    if (activeTab === "facebook") return conv.platform === "facebook" && lastMsgType === "DIRECT";
    if (activeTab === "instagram") return conv.platform === "instagram" && lastMsgType === "DIRECT";
    if (activeTab === "comments") return lastMsgType === "COMMENT";
    
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-[#F5F7F9]">
      {/* Header */}
      <header className="bg-white px-6 pt-6 pb-2 border-b border-slate-100 flex flex-col gap-4 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Bandeja de Entrada</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Vivo</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: "all", label: "Todos", icon: null },
            { id: "facebook", label: "FB", icon: <Facebook size={14} fill="currentColor" /> },
            { id: "instagram", label: "IG", icon: <Instagram size={14} /> },
            { id: "comments", label: "Publicaciones", icon: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2
                ${activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
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
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner font-black">
                    {conv.lead?.image || conv.metaImage ? (
                        <img src={conv.lead?.image || conv.metaImage} alt="Avatar" className="w-full h-full object-cover scale-110" />
                    ) : (
                        <div className="text-primary/20 scale-125"><User size={24} /></div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center ring-2 ring-white z-10">
                    {conv.platform === "facebook" ? (
                        <Facebook size={12} className="text-[#1877F2]" fill="currentColor" />
                    ) : (
                        <Instagram size={12} className="text-[#E4405F]" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-slate-800 truncate text-[15px]">
                      {conv.lead ? `${conv.lead.firstName} ${conv.lead.lastName}` : (conv.metaName || `Usuario Meta (${conv.psid.slice(-4)})`)}
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
