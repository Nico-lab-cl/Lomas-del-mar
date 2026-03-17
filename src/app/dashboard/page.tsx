"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Phone, Mail, User, Clock, Tag, Search } from "lucide-react";
import clsx from "clsx";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  source: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchLeads();
    }
  }, [status, router]);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Mis Leads
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden md:inline">Hola, {session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-lg"
          />
        </div>

        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="group bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all hover:shadow-xl hover:bg-slate-900 active:scale-[0.99] cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{lead.firstName} {lead.lastName}</h3>
                    <p className="text-slate-500 text-sm">{new Date(lead.createdAt).toLocaleDateString()} • {lead.source || 'Sin fuente'}</p>
                  </div>
                </div>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  lead.status === 'NEW' ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-400"
                )}>
                  {lead.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-green-600/10 hover:bg-green-600/20 text-green-500 rounded-xl font-medium transition-colors"
                >
                  <Phone size={18} />
                  WhatsApp
                </a>
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl font-medium transition-colors"
                >
                  <Mail size={18} />
                  Email
                </a>
              </div>
            </div>
          ))}

          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No se encontraron leads.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
