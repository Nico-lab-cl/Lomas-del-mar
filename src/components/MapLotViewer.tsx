'use client';

import React from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, Marker } from 'react-leaflet';
import { Lot } from '@/types';
import lotPolygonsDataRaw from '@/services/lotPolygons.json';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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


interface MapLotViewerProps {
    lots: Lot[];
    onSelectLot: (lot: Lot) => void;
    selectedLotId: number | null;
}


export default function MapLotViewer({ lots, onSelectLot, selectedLotId }: MapLotViewerProps) {
    // Usamos los datos crudos directamente ya que no hay edición local
    const polygons = lotPolygonsDataRaw;

    // Centro inicial (usamos el primer lote o un promedio)
    const centerPos = polygons.length > 0 ? polygons[0].center : { lat: -33.46, lng: -71.61 };

    return (
        <div className="relative w-full h-[60vh] md:h-[85vh] md:rounded-[2.5rem] overflow-hidden border-y md:border border-border shadow-2xl">
            <MapContainer
                center={[centerPos.lat, centerPos.lng]}
                zoom={18}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
            >
                <TileLayer
                    attribution="Tiles &copy; Esri"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />

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

                    return (
                        <React.Fragment key={poly.id}>
                            {/* Marcador para el número de lote permanente (Transparente) */}
                            <Marker
                                position={[poly.center.lat, poly.center.lng]}
                                interactive={false}
                                icon={L.divIcon({
                                    className: 'marker-label-icon',
                                    html: `<div style="color: ${isAvailable ? '#22c55e' : '#fff'}; font-weight: 800; text-shadow: 0 0 3px rgba(0,0,0,0.9); font-size: 11px; white-space: nowrap;">${lotLabel}</div>`,
                                    iconSize: [0, 0],
                                    iconAnchor: [0, 0]
                                })}
                            />

                            <Polygon
                                positions={poly.paths.map((p: any) => [p.lat, p.lng])}
                                eventHandlers={{
                                    click: () => {
                                        if (lot) onSelectLot(lot);
                                    }
                                }}
                                pathOptions={{
                                    // Borde gris sutil para disponibles, blanco/status para otros
                                    color: isSelected ? '#3b82f6' : (isAvailable ? 'rgba(255, 255, 255, 0.4)' : COLORS[status]),
                                    // Relleno gris muy suave (difuminado)
                                    fillColor: isAvailable ? 'rgba(0, 0, 0, 0.2)' : COLORS[status],
                                    fillOpacity: isSelected ? 0.6 : (isAvailable ? 0.05 : 0.35),
                                    weight: isSelected ? 3 : 1
                                }}
                            >
                                {/* Tooltip informativo al pasar el cursor (SOLO HOVER) */}
                                {lot && (
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
    );
}
