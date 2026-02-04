"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize, Map as MapIcon, X } from "lucide-react";
import { mergeLotPositions, filterLotsWithCoordinates } from "@/services/lotPositions";
import type { Lot } from "@/types";

type MapLotViewerProps = {
    lots: Lot[];
    onSelectLot?: (lot: Lot) => void;
    selectedLotId?: number | null;
};

export default function MapLotViewer({ lots, onSelectLot, selectedLotId }: MapLotViewerProps) {
    const [view, setView] = useState<"real" | "technical">("real");
    const [showSchematic, setShowSchematic] = useState(false);

    // Merge positions from lots.json with current status
    const lotsWithPositions = useMemo(() => {
        const merged = mergeLotPositions(lots as any);
        return filterLotsWithCoordinates(merged);
    }, [lots]);

    // Status colors
    const getStatusColor = (status: Lot["status"]) => {
        switch (status) {
            case "available":
                return "bg-primary border-[#2A454A]";
            case "sold":
                return "bg-red-500 border-red-700";
            case "reserved":
                return "bg-yellow-500 border-yellow-700";
            default:
                return "bg-gray-500 border-gray-700";
        }
    };

    const getStageBorderColor = (stage: number) => {
        const colors: Record<number, string> = {
            1: "ring-blue-500",
            2: "ring-purple-500",
            3: "ring-pink-500",
            4: "ring-orange-500",
        };
        return colors[stage] || "ring-gray-500";
    };

    // Listen for external open-schematic event
    useEffect(() => {
        const container = document.querySelector('[data-map-viewer]');
        const handleOpenSchematic = () => setShowSchematic(true);

        if (container) {
            container.addEventListener('open-schematic', handleOpenSchematic as EventListener);
            return () => {
                container.removeEventListener('open-schematic', handleOpenSchematic as EventListener);
            };
        }
    }, []);

    return (
        <div className="relative w-full h-full bg-gray-100 overflow-hidden rounded-xl border shadow-lg group" data-map-viewer>
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <button
                    onClick={() => setView(view === "real" ? "technical" : "real")}
                    className="bg-white/90 backdrop-blur p-2 rounded-lg shadow hover:bg-white text-gray-700 transition"
                    title="Cambiar vista"
                >
                    <MapIcon size={20} />
                </button>
            </div>

            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <React.Fragment>
                        {/* Zoom Controls */}
                        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
                            <button
                                onClick={() => zoomIn()}
                                className="bg-white/90 backdrop-blur p-2 rounded-lg shadow hover:bg-white text-gray-700 transition"
                                title="Zoom In"
                            >
                                <ZoomIn size={20} />
                            </button>
                            <button
                                onClick={() => zoomOut()}
                                className="bg-white/90 backdrop-blur p-2 rounded-lg shadow hover:bg-white text-gray-700 transition"
                                title="Zoom Out"
                            >
                                <ZoomOut size={20} />
                            </button>
                            <button
                                onClick={() => resetTransform()}
                                className="bg-white/90 backdrop-blur p-2 rounded-lg shadow hover:bg-white text-gray-700 transition"
                                title="Reset View"
                            >
                                <Maximize size={20} />
                            </button>
                        </div>

                        <TransformComponent
                            wrapperClass="w-full h-full"
                            contentClass="w-full h-full"
                        >
                            <div
                                className="relative"
                                style={{ width: "100%", height: "auto" }}
                            >
                                <img
                                    src={view === "real" ? "/plano-assets/plano-real.jpeg" : "/plano-assets/plano-real.jpeg"}
                                    alt="Map"
                                    className="w-full h-auto block select-none"
                                    draggable={false}
                                />

                                {lotsWithPositions.map((lot) => {
                                    const isClickable = lot.status === 'available';
                                    return (
                                        <button
                                            key={lot.id}
                                            onClick={() => isClickable && onSelectLot && onSelectLot(lot)}
                                            disabled={!isClickable}
                                            style={{
                                                left: `${lot.x}%`,
                                                top: `${lot.y}%`,
                                                position: "absolute",
                                                transform: "translate(-50%, -50%)",
                                            }}
                                            className={`
                      group relative
                      w-[4px] h-[4px] sm:w-2 sm:h-2 md:w-3 md:h-3 lg:w-4 lg:h-4
                      rounded-full border-[0.5px] text-white font-bold text-[3px] sm:text-[5px] md:text-[6px] lg:text-[8px] shadow-sm
                      flex items-center justify-center
                      transition-transform ${isClickable ? 'hover:scale-150 hover:z-30 cursor-pointer' : 'cursor-not-allowed opacity-90'}
                      ${getStatusColor(lot.status)}
                      ${lot.stage ? `ring-[0.5px] ${getStageBorderColor(lot.stage)}` : ''}
                      ${selectedLotId === lot.id ? 'ring-1 ring-white scale-125' : ''}
                    `}
                                        >
                                            {lot.stage ? (
                                                <>
                                                    <span className="hidden sm:inline">E{lot.stage}-</span>
                                                    {lot.number}
                                                </>
                                            ) : (
                                                lot.number
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </TransformComponent>
                    </React.Fragment>
                )}
            </TransformWrapper>

            {/* Modal del Plano Esquemático */}
            {showSchematic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4">
                        <button
                            onClick={() => setShowSchematic(false)}
                            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white text-gray-700 transition"
                            title="Cerrar"
                        >
                            <X size={24} />
                        </button>
                        <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-2xl">
                            <img
                                src="/plano-assets/Plano-lomas.png"
                                alt="Plano Esquemático con Números de Lotes"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
