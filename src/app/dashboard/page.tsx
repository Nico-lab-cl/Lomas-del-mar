"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, Search, Filter, Bell, User as UserIcon, 
  ChevronRight, Phone, MessageSquare, Clock,
  MoreVertical, Share2, Mail, ChevronLeft, ChevronDown,
  LayoutGrid, Globe, Megaphone, Calendar
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import ProfileSlider from "@/components/ProfileSlider";

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

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProject, setActiveProject] = useState("TODOS");
  const [dateFilter, setDateFilter] = useState("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState("TODOS");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Helper to fetch leads with all current filters
  const fetchLeads = useCallback(async (page: number, q: string, project: string, dateRange: string, statusFilter: string) => {
    setLoading(true);
    try {
      // Optimizamos búsqueda: quitamos espacios extras y normalizamos
      const normalizedQuery = q.trim().replace(/\s+/g, ' ');

      let url = `/api/leads?page=${page}&limit=10`;
      if (normalizedQuery) url += `&q=${encodeURIComponent(normalizedQuery)}`;
      if (project !== "TODOS") url += `&source=${encodeURIComponent(project)}`;
      if (statusFilter !== "TODOS") url += `&status=${encodeURIComponent(statusFilter)}`;
      
      const { start, end } = getDateRange(dateRange);
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setPagination(data.pagination);
        setFetchError(null);
      } else {
        const errorData = await res.json();
        setFetchError(errorData.details || errorData.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Failed to fetch leads");
      setFetchError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("menu") === "profile") {
      setIsProfileOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const delayDebounceFn = setTimeout(() => {
        fetchLeads(currentPage, searchTerm, activeProject, dateFilter, activeStatus);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [status, router, currentPage, searchTerm, activeProject, dateFilter, activeStatus, fetchLeads]);

  const getDateRange = (filter: string) => {
    const now = new Date();
    let start: string | null = null;
    let end: string | null = null;

    if (filter === "HOY") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = today.toISOString();
    } else if (filter === "AYER") {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = yesterday.toISOString();
      end = endOfYesterday.toISOString();
    } else if (filter === "ESTA SEMANA") {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      start = startOfWeek.toISOString();
    } else if (filter === "30 DIAS") {
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      start = thirtyDaysAgo.toISOString();
    }

    return { start, end };
  };

  const getStatusColor = (status: string) => {
    if (['MUY INTERESADO', 'HOT'].includes(status)) return 'hot';
    if (['INTERESADO', 'INTERES', 'WARM'].includes(status)) return 'warm';
    if (['FRIO', 'COLD', 'NEW'].includes(status)) return 'cold';
    return 'cold';
  };

  const projects = [
    { id: "TODOS", name: "Todos los Proyectos", icon: LayoutGrid },
    { id: "CAMPANAS", name: "Campañas Meta", icon: Megaphone },
    { id: "web aliminspa.cl", name: "web aliminspa.cl", icon: Globe },
    { id: "lomasdelmar", name: "Lomas del Mar", icon: LayoutGrid },
  ];

  const dateFilters = [
    { id: "TODOS", name: "Todos los Periodos" },
    { id: "HOY", name: "Hoy" },
    { id: "AYER", name: "Ayer" },
    { id: "ESTA SEMANA", name: "Esta Semana" },
    { id: "30 DIAS", name: "Últimos 30 días" },
  ];

  const statusFilters = [
    { id: "TODOS", name: "Todos los Intereses", color: "bg-slate-400" },
    { id: "FRIO", name: "Frio", color: "bg-[#94A3B8]" }, // Azul grisáceo
    { id: "INTERES", name: "Interés", color: "bg-[#FB923C]" }, // Naranja
    { id: "MUY INTERESADO", name: "Muy Interesado", color: "bg-[#22C55E]" }, // Verde
  ];

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F5F7F9]">
      <ProfileSlider isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Dashboard Top Header */}
      <header className="bg-white px-6 pt-10 pb-6 border-b border-slate-100 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             {/* Profile Click Handler */}
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="relative w-10 h-10 overflow-hidden group active:scale-95 transition-all"
            >
              <Image 
                src="/logo-alimin.png" 
                alt="Alimin Logo" 
                fill 
                className="object-contain group-hover:scale-110 transition-transform"
              />
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">CRM ALIMIN</p>
              <h1 className="text-lg font-black text-slate-800 leading-none truncate max-w-[150px]">
                Hola, {session?.user?.name?.split(' ')[0]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
               <input 
                  type="text"
                  placeholder="Buscar lead..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-xs font-medium w-40 focus:w-56 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
               />
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
               <Bell size={22} />
               <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-primary">Mis Leads</h2>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                 {pagination?.total || 0} REGISTROS ENCONTRADOS
               </span>
            </div>
          </div>
          
          {/* Project Dropdown Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
            >
              {projects.find(p => p.id === activeProject)?.name || "Proyecto"}
              <ChevronDown size={14} className={clsx("transition-transform", isProjectDropdownOpen && "rotate-180")} />
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveProject(p.id); setIsProjectDropdownOpen(false); setCurrentPage(1); }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all",
                      activeProject === p.id ? "bg-primary/5 text-primary" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <p.icon size={16} />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dropdown Filters Row */}
      <div className="py-4 px-6 flex items-center gap-2 relative z-50">
        {/* Period Dropdown */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
              setIsStatusDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
          >
            <Calendar size={14} className="text-primary" />
            {dateFilters.find(f => f.id === dateFilter)?.name || "Periodo"}
            <ChevronDown size={14} className={clsx("transition-transform", isPeriodDropdownOpen && "rotate-180")} />
          </button>

          {isPeriodDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {dateFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setDateFilter(f.id); setIsPeriodDropdownOpen(false); setCurrentPage(1); }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[11px] font-bold transition-all",
                    dateFilter === f.id ? "bg-primary/5 text-primary" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interest Dropdown */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setIsStatusDropdownOpen(!isStatusDropdownOpen);
              setIsPeriodDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
          >
            <div className={clsx("w-2 h-2 rounded-full", statusFilters.find(f => f.id === activeStatus)?.color)} />
            {statusFilters.find(f => f.id === activeStatus)?.name || "Interés"}
            <ChevronDown size={14} className={clsx("transition-transform", isStatusDropdownOpen && "rotate-180")} />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {statusFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setActiveStatus(f.id); setIsStatusDropdownOpen(false); setCurrentPage(1); }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[11px] font-bold transition-all",
                    activeStatus === f.id ? "bg-primary/5 text-primary" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <div className={clsx("w-2 h-2 rounded-full", f.color)} />
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leads List */}
      <main className="flex-1 px-6 space-y-4 pb-12 min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizando lista...</p>
          </div>
        ) : fetchError ? (
          <div className="py-20 text-center px-6">
            <div className="bg-red-50 border border-red-100 rounded-3xl p-8 max-w-sm mx-auto shadow-xl shadow-red-500/5">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="text-red-500" size={32} />
              </div>
              <h3 className="text-red-900 font-black text-xs uppercase tracking-widest mb-2">Error de Sincronización</h3>
              <p className="text-red-600/70 text-xs font-bold leading-relaxed mb-6">
                Faltan columnas en la base de datos. Por favor, ejecuta el contenido del archivo <code className="bg-red-100 px-1 rounded">scripts/sync_db.sql</code> en tu base de datos para corregir esto.
              </p>
              <button 
                onClick={() => fetchLeads(currentPage, searchTerm, activeProject, dateFilter, activeStatus)}
                className="w-full bg-red-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 active:scale-95 transition-all mb-3"
              >
                Reintentar Después de Ejecutar SQL
              </button>
            </div>
          </div>
        ) : (
          <>
            {leads.map((lead, index) => {
              const statusType = getStatusColor(lead.status);
              return (
                <div
                  key={lead.id}
                  className={clsx(
                    "card-stitch flex items-center gap-4 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500",
                    statusType === 'hot' ? "status-edge-hot" : statusType === 'warm' ? "status-edge-warm" : "status-edge-cold"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 bg-slate-50 flex-shrink-0 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 group-hover:scale-110 transition-transform">
                    <UserIcon size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-black text-slate-800 truncate">{lead.firstName} {lead.lastName}</h3>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold">
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1 text-primary/70 uppercase tracking-tighter truncate max-w-[100px]">
                        <Share2 size={10} />{lead.source || 'WEB'}
                      </span>
                    </div>
                  </div>
                  
                  <button className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              );
            })}

            {leads.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay leads para estos filtros</p>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-6 pb-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Página <span className="text-primary">{currentPage}</span> de {pagination.pages}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <button 
        onClick={() => router.push("/dashboard/leads/new")}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white"
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
  );
}
