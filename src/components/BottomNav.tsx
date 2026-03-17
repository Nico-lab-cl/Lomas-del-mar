"use client";

import { Users, Calendar, UserCircle, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "LEADS", icon: Users, href: "/dashboard" },
    { label: "VISITAS", icon: LayoutGrid, href: "/dashboard?menu=visits" },
    { label: "PERFIL", icon: UserCircle, href: "/dashboard?menu=profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-slate-100 flex justify-around items-end py-2 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.label === "LEADS" && pathname === "/dashboard" && !window.location.search.includes("menu=profile"));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all rounded-xl p-2",
              isActive ? "text-primary scale-110" : "text-slate-400 opacity-60"
            )}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
