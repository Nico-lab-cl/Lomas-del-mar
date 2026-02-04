import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleMapsButtonProps {
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export const GoogleMapsButton = ({ className, variant = "default" }: GoogleMapsButtonProps) => {
    return (
        <a
            href="https://maps.app.goo.gl/pmYqgPqXJrBghfRR6"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block ${className}`}
        >
            <Button variant={variant} className="h-auto rounded-full px-6 py-2 w-full">
                <span className="flex items-center gap-2 justify-center">
                    <MapPin className="h-4 w-4" />
                    Ver ubicación en Google Maps
                </span>
            </Button>
        </a>
    );
};
