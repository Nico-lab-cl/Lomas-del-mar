import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleMapsButton } from "@/components/GoogleMapsButton";

const videos = [
    {
        src: "/hero-drone.mp4",
        title: "Vista Aérea General",
        span: "md:col-span-2 md:row-span-2",
    },
    {
        src: "/hero-drone-4.mp4",
        title: "Recorrido Panorámico",
        span: "md:col-span-1 md:row-span-1",
    },
    {
        src: "/hero-drone-2.mp4",
        title: "Vistas al Mar",
        span: "md:col-span-1 md:row-span-1",
    },
    {
        src: "/hero-drone-3.mp4",
        title: "Entorno Natural",
        span: "md:col-span-1 md:row-span-1",
    },
    {
        src: "/drone-video-1.mp4",
        title: "Avance de Obras",
        span: "md:col-span-1 md:row-span-1",
    },
];

interface VideoGalleryProps {
    onCtaClick?: () => void;
}

export const VideoGallery = ({ onCtaClick }: VideoGalleryProps) => {
    return (
        <section className="bg-background py-16 md:py-24 animate-in fade-in duration-700">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 mb-4 font-heading">
                        Galería de Terrenos
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Explora cada rincón de Lomas del Mar desde una perspectiva única.
                        Nuestra galería de videos te permite conocer el entorno y las vistas reales.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px] mb-12">
                    {videos.map((video, index) => (
                        <div
                            key={index}
                            className={`group relative rounded-3xl overflow-hidden bg-muted shadow-lg ${video.span}`}
                        >
                            <video
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                muted
                                loop
                                playsInline
                                controls
                                preload="metadata"
                            >
                                <source src={video.src} type="video/mp4" />
                                Tu navegador no soporta el elemento de video.
                            </video>

                            {/* Overlay Gradient (Optional for styling if controls act weird, but usually fine) */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="absolute bottom-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-white font-semibold text-lg drop-shadow-md flex items-center gap-2">
                                    <Play className="w-4 h-4 fill-white text-white" />
                                    {video.title}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Button
                        onClick={onCtaClick}
                        size="lg"
                        className="rounded-full text-lg h-14 px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105"
                    >
                        Adquiere tu terreno ahora
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <GoogleMapsButton variant="outline" className="h-14" />
                </div>
            </div>
        </section>
    );
};
