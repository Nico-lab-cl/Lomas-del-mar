"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronRight, HelpCircle, ShieldCheck, Lock } from "lucide-react";
import Image from "next/image";

interface DBUser {
  username: string;
  name: string;
  role: string;
}

export default function LoginPage() {
  const { status } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Fetch users for the profile selector
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setDbUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users for login", err);
      }
    };
    fetchUsers();
  }, []);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setLoading(true);
    setError("");
    
    const result = await signIn("credentials", {
      username: selectedUser,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Contraseña incorrecta. Por favor intente de nuevo.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  if (selectedUser) {
    const userProfile = dbUsers.find(p => p.username === selectedUser);
    return (
      <div className="p-8 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => { setSelectedUser(null); setError(""); setPassword(""); }}
          className="text-primary font-bold flex items-center gap-2 mb-10"
        >
          <ChevronRight className="rotate-180 w-5 h-5" />
          Volver a perfiles
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Hola, {userProfile?.name?.split(' ')[0] || 'Asesor'}</h1>
          <p className="text-slate-500 font-medium whitespace-nowrap">Ingresa tu contraseña para entrar</p>
        </div>

        <form onSubmit={executeLogin} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-stitch pl-12 text-lg tracking-widest"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold px-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-stitch-primary w-full py-4 text-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Ingresar al CRM"
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col h-full animate-in fade-in duration-700">
      {/* Brand Header with Logo */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative w-20 h-20 mb-4 drop-shadow-sm">
          <Image 
            src="/logo-alimin.png" 
            alt="Alimin Logo" 
            fill 
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-800">
          CRM <span className="text-primary">ALIMIN</span>
        </h1>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Bienvenido Asesor</h2>
        <p className="text-slate-500 font-medium">Selecciona tu perfil para ingresar</p>
      </div>

      <div className="space-y-4 mb-12">
        {dbUsers.map((profile) => (
          <button
            key={profile.username}
            onClick={() => setSelectedUser(profile.username)}
            className="card-stitch w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 leading-tight">{profile.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{profile.role}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors h-5 w-5" />
          </button>
        ))}

        {dbUsers.length === 0 && (
          <div className="flex flex-col items-center py-10 opacity-50">
             <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-xs font-bold text-slate-400">CARGANDO ASESORES...</p>
          </div>
        )}
      </div>

      <div className="mt-auto text-center space-y-4">
        <p className="text-sm text-slate-400 font-medium">
          ¿No estás en la lista? <button className="text-primary font-bold hover:underline">Contactar soporte</button>
        </p>
        
        <div className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 rounded-2xl text-[10px] text-slate-400 font-black uppercase tracking-widest">
          <ShieldCheck size={14} className="text-slate-300" />
          Acceso Restringido Pro
        </div>
      </div>
    </div>
  );
}
