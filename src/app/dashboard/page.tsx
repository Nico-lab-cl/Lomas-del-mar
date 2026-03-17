"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Filter, Bell, User, 
  ChevronRight, Phone, MessageSquare, Clock,
  MoreVertical, Share2, Mail, ChevronLeft
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
  createdAt: string;
  source: string;
}

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("TODOS");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchLeads(currentPage);
    }
  }, [status, router, currentPage]);

  const fetchLeads = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (['CALIENTE', 'HOT', 'NEW'].includes(status)) return 'hot';
    if (['SEGUIMIENTO', 'WARM'].includes(status)) return 'warm';
    return 'cold';
  };

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F5F7F9]">
      {/* Dashboard Top Header */}
      <header className="bg-white px-6 pt-10 pb-6 border-b border-slate-100 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden">
              <Image 
                src="/logo-alimin.png" 
                alt="Alimin Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">CRM ALIMIN</p>
              <h1 className="text-lg font-black text-slate-800 leading-none truncate max-w-[150px]">
                Hola, {session?.user?.name?.split(' ')[0]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
              <Search size={22} />
            </button>
            <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
               <Bell size={22} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white" />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-primary">Mis Leads</h2>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-wider">
              {pagination?.total || 0} TOTAL
            </span>
          </div>
          <button className="text-slate-400 p-1">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Filter Chips */}
      <div className="overflow-x-auto no-scrollbar py-4 px-6 flex items-center gap-3">
        {["TODOS", "NUEVOS", "CALIENTES", "EN SEGUIMIENTO"].map((filter) => (
          <button
            key={filter}
            onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
            className={clsx(
              "whitespace-nowrap px-5 py-2.5 rounded-full text-[11px] font-black tracking-wider transition-all border shrink-0",
              activeFilter === filter 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-white text-slate-400 border-slate-200"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Leads List */}
      <main className="flex-1 px-6 space-y-4 pb-12 min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando leads...</p>
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
                    <User size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-black text-slate-800 truncate">{lead.firstName} {lead.lastName}</h3>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold">
                      <span className="flex items-center gap-1"><Clock size={10} />2h ago</span>
                      <span className="flex items-center gap-1 text-primary/70 uppercase tracking-tighter"><Share2 size={10} />{lead.source || 'WEB'}</span>
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
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin leads encontrados</p>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-6 pb-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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
      <button className="fixed bottom-24 right-8 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 active:scale-90 transition-all z-50 cursor-pointer group hover:rotate-90">
        <Plus size={32} strokeWidth={3} />
        <span className="absolute right-16 bg-slate-800 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-wider">
          NUEVO LEAD
        </span>
      </button>
    </div>
  );
}
