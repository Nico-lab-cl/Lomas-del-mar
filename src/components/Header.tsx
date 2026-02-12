"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Briefcase, Settings, LogOut, FileText, Map as MapIcon, PlusCircle } from 'lucide-react';

const logo = '/Diseño sin título.svg';

interface HeaderProps {
  projectName: string;
}

export const Header = ({ projectName }: HeaderProps) => {
  // const [isVisible, setIsVisible] = useState(false); // Removed for always-visible header
  const { data: session } = useSession();

  // useEffect(() => {
  //   const handleScroll = () => {
  //     // Show header after scrolling past the hero (viewport height)
  //     const scrolled = window.scrollY > window.innerHeight - 100;
  //     setIsVisible(scrolled);
  //   };

  //   window.addEventListener('scroll', handleScroll);
  //   handleScroll(); // Check initial state

  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header
      className="bg-card/95 backdrop-blur-md border-b border-border fixed top-0 left-0 right-0 z-50 transition-none"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <Link
            href="/"
            className="flex items-center gap-4 min-w-0 hover:opacity-90 transition-opacity"
            aria-label="Ir al inicio"
          >
            <img src={logo} alt="Logo" className="w-14 h-14 object-contain" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {projectName}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wide truncate">
                Compra tu terreno en El Tabo
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <a href="/#plano" className="hidden md:inline-flex">
              <Button variant="outline">Plano</Button>
            </a>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(session.user?.name || 'Usuario')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                      <p className="text-xs font-semibold text-primary mt-1">
                        {session.user?.role === 'ADMIN' ? 'Administrador' :
                          session.user?.role === 'SELLER' ? 'Vendedor' : 'Cliente'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* USER / CLIENTE OPTIONS */}
                  {session.user?.role === 'USER' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/user/plots" className="cursor-pointer">
                          <MapIcon className="mr-2 h-4 w-4" />
                          <span>Mis Terrenos</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/user/contracts" className="cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Mis Contratos</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* SELLER / VENDEDOR OPTIONS */}
                  {session.user?.role === 'SELLER' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard" className="cursor-pointer">
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>Mi Pipeline de Ventas</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/new-lead" className="cursor-pointer">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>Registrar Nuevo Cliente</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* ADMIN OPTIONS */}
                  {session.user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Panel de Administración</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/lots" className="cursor-pointer">
                          <MapIcon className="mr-2 h-4 w-4" />
                          <span>Gestión de Lotes</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  variant="default"
                  size="sm"
                  className="h-auto py-1 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all border-0 flex flex-col items-start gap-0.5"
                >
                  <span className="font-bold text-sm leading-none">Iniciar Sesión</span>
                  <span className="text-[10px] font-normal opacity-90 leading-none">Registrarse</span>
                </Button>
              </Link>
            )}

            <div className="hidden md:flex">
              <ThemeToggle />
            </div>

            <a href="https://aliminspa.cl" target="_blank" rel="noopener noreferrer" className="hidden xl:inline-flex">
              <Button variant="outline" className="text-xs">Portal Alimin</Button>
            </a>

            <div className="md:hidden flex">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
