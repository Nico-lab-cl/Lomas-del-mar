"use client";

import { Users, UserCircle, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "LEADS", icon: Users, href: "/dashboard", side: "left" },
    { label: "VISITAS", icon: LayoutGrid, href: "/dashboard?menu=visits", side: "right" },
    { label: "PERFIL", icon: UserCircle, href: "/dashboard?menu=profile", side: "right" },
  ];

  return (
    <>
      {/* Center FAB - fixed independently to prevent clipping */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2"
        style={{ zIndex: 99991 }}
      >
        <Link
          href="/dashboard/leads/new"
          className="w-14 h-14 bg-primary text-white rounded-full shadow-[0_10px_25px_-5px_rgba(16,123,122,0.5)] flex items-center justify-center border-4 border-[#F5F7F9] active:scale-95 transition-all"
        >
          <Plus size={28} strokeWidth={3} />
        </Link>
      </div>

      <nav 
        className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-slate-100 py-2 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
        style={{ zIndex: 99990 }}
      >
        <div className="flex justify-between items-end">
          <div className="flex-1 flex justify-center">
            {navItems.filter(item => item.side === "left").map((item) => {
              const isActive = pathname === item.href || (item.label === "LEADS" && pathname === "/dashboard" && !window.location.search.includes("menu="));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex flex-col items-center gap-1 transition-all rounded-xl p-2",
                    isActive ? "text-[#D4AF37] scale-110" : "text-slate-400 opacity-60"
                  )}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="w-16 flex-shrink-0" /> {/* Spacer for FAB */}

          <div className="flex-1 flex justify-around">
            {navItems.filter(item => item.side === "right").map((item) => {
              const isActive = window.location.search.includes(`menu=${item.href.split('=')[1]}`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex flex-col items-center gap-1 transition-all rounded-xl p-2",
                    isActive ? "text-[#D4AF37] scale-110" : "text-slate-400 opacity-60"
                  )}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
