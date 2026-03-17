"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, Phone, Mail, User, Search, Filter, 
  LayoutDashboard, TrendingUp, Users, Calendar,
  ExternalLink, MessageSquare, Bell
} from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex pb-10">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-72 flex-col glass border-r border-slate-800/50 sticky top-0 h-screen p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ALIMIN <span className="text-teal-400">CRM</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500/10 text-teal-400 rounded-xl font-semibold transition-all">
            <Users className="w-5 h-5" />
            <span>Mis Leads</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl font-medium transition-all group">
            <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Estadísticas</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-xl font-medium transition-all group">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Agenda</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">Asesor Comercial</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Panel de <span className="text-gradient">Leads</span></h1>
            <p className="text-slate-400 font-medium">Gestiona y contacta a tus clientes potenciales</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-3 glass rounded-xl text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all relative group">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-slate-900" />
            </button>
            <button className="btn-premium flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <span>Filtrar</span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {[
            { label: 'Total Leads', value: leads.length, color: 'text-blue-400', icon: Users },
            { label: 'Nuevos (24h)', value: filteredLeads.filter(l => l.status === 'NEW').length, color: 'text-teal-400', icon: MessageSquare },
            { label: 'Contactados', value: leads.filter(l => l.status !== 'NEW').length, color: 'text-purple-400', icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 border-l-4 border-l-teal-500/50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={clsx("w-5 h-5", stat.color)} />
              </div>
              <div className="text-3xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search & List */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 outline-none transition-all shadow-xl"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((lead, index) => (
              <div
                key={lead.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="glass-card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-teal-500/5 hover:border-teal-500/20 group animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl premium-gradient opacity-80 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-teal-400 transition-colors">{lead.firstName} {lead.lastName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-sm mt-1">
                      <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> {lead.source || 'Directo'}</span>
                      <span className="flex items-center gap-1.5 underline decoration-slate-700 underline-offset-4">{lead.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold transition-all border border-emerald-500/10"
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-xl font-bold transition-all border border-teal-500/10"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                </div>
              </div>
            ))}

            {filteredLeads.length === 0 && (
              <div className="text-center py-20 glass-card">
                <Search className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                <h3 className="text-slate-400 font-bold mb-1">No se encontraron leads</h3>
                <p className="text-slate-600">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
