import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackToSiteButton() {
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Link href="/">
                <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-lg hover:shadow-xl transition-all border border-border bg-background/80 backdrop-blur"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Volver al Sitio
                </Button>
            </Link>
        </div>
    );
}
