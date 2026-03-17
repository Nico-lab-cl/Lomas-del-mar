"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronRight, HelpCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { status } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleProfileLogin = async (username: string) => {
    setLoading(true);
    setError("");

    // In this Stitch design, we simulate a "Profile Selection" 
    // but we still need the password for the real Auth.
    // However, the user request is to "plasmar el diseño", 
    // so I will show the profile list first, and when clicked, 
    // it will ask for the password for that specific user.
    
    setSelectedUser(username);
  };

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setLoading(true);
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

  const profiles = [
    { name: "Barbara A", username: "barbara", role: "Asesor Inmobiliario" },
    { name: "Marcela E", username: "marcela", role: "Asesor Inmobiliario" },
    { name: "Orlando", username: "orlando", role: "Asesor Inmobiliario" },
    { name: "Admin", username: "nicolas", role: "Administrador" },
  ];

  if (selectedUser) {
    return (
      <div className="p-8 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => setSelectedUser(null)}
          className="text-primary font-bold flex items-center gap-2 mb-10"
        >
          <ChevronRight className="rotate-180 w-5 h-5" />
          Volver a perfiles
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Hola, {profiles.find(p => p.username === selectedUser)?.name}</h1>
          <p className="text-slate-500 font-medium">Ingresa tu contraseña para entrar</p>
        </div>

        <form onSubmit={executeLogin} className="space-y-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-stitch text-center text-xl tracking-widest"
            placeholder="••••••••"
            required
            autoFocus
          />

          {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-stitch-primary w-full py-4 text-lg"
          >
            {loading ? "Iniciando..." : "Ingresar al CRM"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col h-full animate-in fade-in duration-700">
      {/* Logo Header */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-primary">ALIMIN <span className="text-slate-800">CRM</span></h1>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Bienvenido Asesor</h2>
        <p className="text-slate-500 font-medium">Selecciona tu perfil para ingresar</p>
      </div>

      <div className="space-y-4 mb-12">
        {profiles.map((profile) => (
          <button
            key={profile.username}
            onClick={() => handleProfileLogin(profile.username)}
            className="card-stitch w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">{profile.name}</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{profile.role}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      <div className="mt-auto text-center space-y-4">
        <p className="text-sm text-slate-400 font-medium">
          ¿No estás en la lista? <button className="text-primary font-bold hover:underline">Contactar soporte</button>
        </p>
        
        <div className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest">
          <HelpCircle size={16} />
          Acceso Restringido
        </div>
      </div>
    </div>
  );
}
