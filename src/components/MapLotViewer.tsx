'use client';

import React, { useState } from 'react';
import { MapContainer, Polygon, Tooltip, Marker, ImageOverlay, useMap } from 'react-leaflet';
import { Lot } from '@/types';
import lotPolygonsDataRaw from '@/services/lotPolygons.json';
import 'leaflet/dist/leaflet.css';
import L, { LatLngBoundsExpression } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Eye, Map as MapIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icons if needed (though we use polygons)
if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// === ESTILOS ===
const COLORS = {
    available: '#22c55e',
    reserved: '#f59e0b',
    sold: '#ef4444'
};

const LOT_BOUNDS: LatLngBoundsExpression = [
    [-33.462026275159296, -71.61636472279581], // SouthWest
    [-33.45944399269609, -71.61146701975917]   // NorthEast
];

const CENTER_POS: [number, number] = [-33.46073513392769, -71.6139158712775];

interface MapLotViewerProps {
    lots: Lot[];
    onSelectLot: (lot: Lot) => void;
    selectedLotId: number | null;
}

// Component to handle map bounds flying
const MapController = () => {
    const map = useMap();

    React.useEffect(() => {
        // Fit bounds with some padding on load
        map.fitBounds(LOT_BOUNDS, { padding: [20, 20], animate: false });

        // Restrict view roughly to the image area to prevent getting lost
        map.setMaxBounds([
            [-33.4630, -71.6180], // SouthWest padded
            [-33.4580, -71.6100]  // NorthEast padded
        ]);
        map.setMinZoom(16);
    }, [map]);

    return null;
}

export default function MapLotViewer({ lots, onSelectLot, selectedLotId }: MapLotViewerProps) {
    const polygons = lotPolygonsDataRaw;
    const [isMobile, setIsMobile] = useState(false);
    const [viewMode, setViewMode] = useState<'real' | 'tecnico'>('real');

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const scrollToHelp = () => {
        const element = document.getElementById('como-comprar');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative w-full flex flex-col md:rounded-[2.5rem] overflow-hidden border border-border shadow-2xl bg-slate-950">

            {/* Sticky Toolbar */}
            <div className="z-10 bg-background/95 backdrop-blur-md border-b border-border p-3 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0">

                {/* View Toggle */}
                <div className="flex bg-muted/50 p-1 rounded-full border border-border w-full md:w-auto">
                    <button
                        onClick={() => setViewMode('real')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                            viewMode === 'real'
                                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <Eye className="w-4 h-4" />
                        Vista Real
                    </button>
                    <button
                        onClick={() => setViewMode('tecnico')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                            viewMode === 'tecnico'
                                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <MapIcon className="w-4 h-4" />
                        Vista Técnica
                    </button>
                </div>

                {/* Legend & Actions (Desktop: Row, Mobile: Grid/Stack) */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-foreground">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-foreground">Reservado</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium text-foreground">Vendido</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={scrollToHelp}
                        className="hidden md:flex ml-2 gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary"
                    >
                        <HelpCircle className="w-4 h-4" />
                        ¿Cómo comprar?
                    </Button>
                </div>
            </div>

            {/* Map Area */}
            <div className="relative w-full h-[60vh] md:h-[80vh] bg-[#1a1a1a]">
                <MapContainer
                    center={CENTER_POS}
                    zoom={17}
                    scrollWheelZoom={true}
                    className="h-full w-full z-0"
                    minZoom={16}
                    maxZoom={20}
                    style={{ background: '#1a1a1a' }}
                >
                    <MapController />

                    {/* IMAGES OVERLAYS */}
                    {viewMode === 'real' && (
                        <ImageOverlay
                            url="/plano-assets/plano-real.jpeg"
                            bounds={LOT_BOUNDS}
                            opacity={1}
                            zIndex={1}
                        />
                    )}

                    {viewMode === 'tecnico' && (
                        <ImageOverlay
                            url="/plano-assets/plano-a062dd1825b1a339.png"
                            bounds={LOT_BOUNDS}
                            opacity={1}
                            zIndex={2} // Ensure technical sits on top if both were active (logic prevents it but good practice)
                        />
                    )}

                    {/* POLYGONS LAYER */}
                    {polygons.map((poly) => {
                        const lot = lots.find(l => l.id === poly.id);
                        const status = lot ? (lot.status as keyof typeof COLORS) : 'available';
                        const isSelected = selectedLotId === poly.id;
                        const isAvailable = status === 'available';

                        const formatCurrency = (amount: number) => {
                            return new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: 'CLP',
                                minimumFractionDigits: 0,
                            }).format(amount);
                        };

                        const lotLabel = lot?.displayLabel ?? lot?.number ?? poly.id;

                        // Visual Style Logic
                        const isRealMode = viewMode === 'real';

                        // In Real Mode: Mostly invisible fill, show stroke on hover/select
                        // In Technical Mode: Visible fill and stroke

                        const baseColor = COLORS[status];
                        const fillColor = isRealMode ? 'transparent' : baseColor;

                        // Opacity Logic
                        const fillOpacity = isSelected ? 0.6 : (isRealMode ? 0 : 0.35);
                        const strokeOpacity = isSelected ? 1 : (isRealMode ? 0.3 : 0.8);
                        const weight = isSelected ? 3 : (isRealMode ? 1 : 1);
                        const strokeColor = isSelected ? '#3b82f6' : (isRealMode ? 'white' : baseColor);

                        return (
                            <React.Fragment key={poly.id}>
                                {/* Number Marker - Always visible but styled differently per mode */}
                                {(viewMode === 'tecnico' || isSelected) && (
                                    <Marker
                                        position={[poly.center.lat, poly.center.lng]}
                                        interactive={false}
                                        icon={L.divIcon({
                                            className: 'marker-label-icon',
                                            html: `<div style="
                                                color: ${isAvailable ? '#22c55e' : '#fff'}; 
                                                font-weight: 800; 
                                                text-shadow: 0 0 3px rgba(0,0,0,0.9); 
                                                font-size: 10px; 
                                                white-space: nowrap;
                                                opacity: ${isRealMode ? 0.8 : 1};
                                            ">${lotLabel}</div>`,
                                            iconSize: [0, 0],
                                            iconAnchor: [0, 0]
                                        })}
                                    />
                                )}

                                <Polygon
                                    positions={poly.paths.map((p: any) => [p.lat, p.lng])}
                                    eventHandlers={{
                                        click: () => {
                                            if (lot) onSelectLot(lot);
                                        },
                                        mouseover: (e) => {
                                            // Highlight effect on hover
                                            const layer = e.target;
                                            layer.setStyle({
                                                weight: 3,
                                                color: '#fff',
                                                fillOpacity: 0.5,
                                                fillColor: isRealMode ? baseColor : baseColor
                                            });
                                        },
                                        mouseout: (e) => {
                                            // Reset style
                                            const layer = e.target;
                                            layer.setStyle({
                                                weight: weight,
                                                color: strokeColor,
                                                fillOpacity: fillOpacity,
                                                fillColor: fillColor
                                            });
                                        }
                                    }}
                                    pathOptions={{
                                        color: strokeColor,
                                        fillColor: fillColor,
                                        fillOpacity: fillOpacity,
                                        weight: weight,
                                        opacity: strokeOpacity,
                                    }}
                                >
                                    {!isMobile && lot && (
                                        <Tooltip direction="top" opacity={1} sticky>
                                            <div className="p-3 min-w-[140px] text-center bg-card text-foreground rounded-lg border border-border shadow-xl">
                                                <p className="font-bold text-base mb-2 border-b border-border/50 pb-1">Lote {lot.displayLabel ?? lot.number}</p>
                                                <div className="space-y-1 text-sm">
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">Etapa:</span>
                                                        <span className="font-medium">{lot.displayStage ?? lot.stage}</span>
                                                    </p>
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">Superficie:</span>
                                                        <span className="font-medium">{lot.area} m²</span>
                                                    </p>
                                                    <p className="text-primary font-bold pt-2 text-base">
                                                        {lot.totalPrice ? formatCurrency(lot.totalPrice) : 'Consultar'}
                                                    </p>
                                                </div>
                                                <div className={`mt-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    status === 'reserved' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {status === 'available' ? 'Disponible' :
                                                        status === 'reserved' ? 'Reservado' : 'Vendido'}
                                                </div>
                                            </div>
                                        </Tooltip>
                                    )}
                                </Polygon>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
