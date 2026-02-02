'use client';

import React from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip as LeafletTooltip } from 'react-leaflet';
import { Lot } from '@/types';
import lotPolygonsData from '@/services/lotPolygons.json';
import 'leaflet/dist/leaflet.css';

// Colores idénticos a tu leyenda actual
const COLORS = {
    available: '#22c55e', // Verde
    reserved: '#f59e0b',  // Amarillo
    sold: '#ef4444',      // Rojo
    selected: '#3b82f6'   // Azul
};

// Centro del mapa (Lote 64 aprox, centro de tu terreno)
const CENTER: [number, number] = [-33.46125, -71.61411];

interface MapLotViewerProps {
    lots: Lot[];
    onSelectLot: (lot: Lot) => void;
    selectedLotId: number | null;
}

export default function MapLotViewer({ lots, onSelectLot, selectedLotId }: MapLotViewerProps) {
    return (
        <div className="w-full h-[600px] rounded-xl overflow-hidden border border-border shadow-2xl relative z-0">
            <MapContainer center={CENTER} zoom={17} scrollWheelZoom={false} className="h-full w-full">
                {/* Capa Satelital de ESRI (Gratis) */}
                <TileLayer
                    attribution="Tiles &copy; Esri"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />

                {/* Dibujamos los lotes */}
                {lotPolygonsData.map((poly) => {
                    const lot = lots.find(l => l.id === poly.id);
                    if (!lot) return null;

                    const isSelected = selectedLotId === lot.id;
                    const status = (lot.status as keyof typeof COLORS) || 'available';
                    const color = COLORS[status];

                    return (
                        <Polygon
                            key={poly.id}
                            positions={poly.paths.map(p => [p.lat, p.lng]) as [number, number][]}
                            pathOptions={{
                                color: isSelected ? '#ffffff' : color,
                                fillColor: isSelected ? COLORS.selected : color,
                                fillOpacity: isSelected ? 0.7 : 0.4,
                                weight: isSelected ? 3 : 1
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (lot.status === 'available') {
                                        onSelectLot(lot);
                                    }
                                }
                            }}
                        >
                            <LeafletTooltip sticky direction="top">
                                <div className="text-center font-sans">
                                    <span className="font-bold">Lote {lot.number}</span>
                                    <br />
                                    <span className="text-xs">{lot.area} m²</span>
                                </div>
                            </LeafletTooltip>
                        </Polygon>
                    );
                })}
            </MapContainer>

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-md text-xs font-bold z-[1000] shadow-sm">
                Vista Satelital
            </div>
        </div>
    );
}
