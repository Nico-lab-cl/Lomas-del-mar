"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
const logo = '/Diseño sin título.svg';

interface HeaderProps {
  projectName: string;
}

export const Header = ({ projectName }: HeaderProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling past the hero (viewport height)
      const scrolled = window.scrollY > window.innerHeight - 100;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`bg-card/95 backdrop-blur-md border-b border-border fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      style={{ height: 'var(--header-height)' }}
    >
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <a
            href="/"
            className="flex items-center gap-4 min-w-0 hover:opacity-90 transition-opacity"
            aria-label="Ir al inicio"
          >
            <img src={logo} alt="Logo" className="w-14 h-14 object-contain" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {projectName} - <span className="text-primary">Lanzamiento</span>
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wide truncate">
                Compra tu terreno en El Tabo
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2 md:gap-4">
            <a href="#plano" className="hidden md:inline-flex">
              <Button variant="outline">Plano</Button>
            </a>
            <div className="hidden md:flex">
              <ThemeToggle />
            </div>
            <a href="https://aliminspa.cl" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Portal Alimin</Button>
            </a>

            <a href="#plano" className="md:hidden inline-flex">
              <Button variant="outline" size="sm">Plano</Button>
            </a>
            <div className="md:hidden flex">
              <ThemeToggle />
            </div>
            <a href="https://aliminspa.cl" target="_blank" rel="noopener noreferrer" className="md:hidden inline-flex">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">Portal</Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
