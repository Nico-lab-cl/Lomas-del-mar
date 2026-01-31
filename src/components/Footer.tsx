import { MapPin, Phone, ExternalLink, Instagram, Facebook, Music } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[hsl(var(--header-bg))] text-[hsl(var(--header-foreground))] mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">Lomas Del Mar</h3>
            <p className="text-sm text-muted-foreground">
              Tu inversión está segura en Alimin. Terrenos con Rol propio, completamente urbanizados a 8 minutos de la playa en auto.
            </p>
            <a 
              href="https://aliminspa.cl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Visita aliminspa.cl
            </a>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>El Tabo, Valparaíso, Chile</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>+56 9 4882 2607</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Enlaces</h3>
            <div className="space-y-2 text-sm">
              <a 
                href="https://aliminspa.cl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Página Principal
              </a>
              <a 
                href="https://aliminspa.cl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Términos y Condiciones
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Redes Sociales</h3>
            <div className="space-y-3 text-sm">
              <a
                href="https://www.instagram.com/inmobiliaria.alimin/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-4 h-4 text-primary" />
                <span>Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/alimininmobiliaria"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4 text-primary" />
                <span>Facebook</span>
              </a>
              <a
                href="https://www.tiktok.com/@inmobiliaria.alimin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Music className="w-4 h-4 text-primary" />
                <span>TikTok</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-muted/20 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Alimin SpA. Todos los derechos reservados.
          </p>
          <a 
            href="https://aliminspa.cl" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            www.aliminspa.cl
          </a>
        </div>
      </div>
    </footer>
  );
};
