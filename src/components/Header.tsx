import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
const logo = '/logo.png';

interface HeaderProps {
  projectName: string;
}

export const Header = ({ projectName }: HeaderProps) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50" style={{ height: 'var(--header-height)' }}>
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
                Oportunidad única de adquirir tu terreno
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
