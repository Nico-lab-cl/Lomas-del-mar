"use client";

import React, { useState, useRef, useEffect } from "react";
import { Save, Map as MapIcon, Plus, Trash2 } from "lucide-react";
import initialLots from "@/data/lots.json";

// Define Types
type Lot = {
    id: number;
    number: string;
    x: number; // percentage
    y: number; // percentage
    status: "available" | "sold" | "reserved";
    stage: number; // 1, 2, 3, 4
};

export default function MapBuilder() {
    const [placedLots, setPlacedLots] = useState<Lot[]>([]);
    const [view, setView] = useState<"real" | "technical">("real");
    const [currentStage, setCurrentStage] = useState<number>(1);
    const [newLotNumber, setNewLotNumber] = useState<string>("");

    const mapRef = useRef<HTMLDivElement>(null);
    const [draggedLotData, setDraggedLotData] = useState<{ id?: number; number?: string; type: "new" | "existing" } | null>(null);

    // Load initial lots on mount to avoid hydration mismatch if possible, or just set it initially
    useEffect(() => {
        setPlacedLots(initialLots as Lot[]);
    }, []);

    const handleDragStartNew = (e: React.DragEvent) => {
        if (!newLotNumber) {
            e.preventDefault();
            return;
        }
        const data = JSON.stringify({ type: "new", number: newLotNumber });
        setDraggedLotData({ number: newLotNumber, type: "new" });
        e.dataTransfer.effectAllowed = "copy";
        // Use text/plain for maximum compatibility
        e.dataTransfer.setData("text/plain", data);
        e.dataTransfer.setData("application/json", data);
    };

    const handleDragStartExisting = (e: React.DragEvent, lot: Lot) => {
        const data = JSON.stringify({ type: "existing", id: lot.id });
        setDraggedLotData({ id: lot.id, type: "existing" });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", data);
        e.dataTransfer.setData("application/json", data);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Critical for allowing drop
        e.dataTransfer.dropEffect = draggedLotData?.type === "new" ? "copy" : "move";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!mapRef.current) return;

        let data;
        try {
            // Try getting data from multiple types
            const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
            if (!raw) return;
            data = JSON.parse(raw);
        } catch (err) {
            console.error("Drop Parse Error", err);
            return;
        }

        // Calculate position
        const rect = mapRef.current.getBoundingClientRect();
        const xFn = e.clientX - rect.left;
        const yFn = e.clientY - rect.top;

        // Convert to percentage
        const xPercent = (xFn / rect.width) * 100;
        const yPercent = (yFn / rect.height) * 100;

        if (data.type === "existing") {
            // Update existing
            setPlacedLots(prev => prev.map(l =>
                l.id === data.id ? { ...l, x: Number(xPercent.toFixed(2)), y: Number(yPercent.toFixed(2)) } : l
            ));
        } else if (data.type === "new") {
            // Check if ID collision is possible (unlikely with Date.now())
            // Check if number already exists? (Optional, skipping for now to allow corrections)

            const newId = Date.now();
            setPlacedLots(prev => [
                ...prev,
                {
                    id: newId,
                    number: data.number,
                    x: Number(xPercent.toFixed(2)),
                    y: Number(yPercent.toFixed(2)),
                    status: "available",
                    stage: currentStage,
                },
            ]);
            // setNewLotNumber(""); // Optional: Clear input after drop logic choice - keeping it to allow bulk drops of same number? No, better clear.
            // Actually user might want to drop "10", then "11". Clearing is good.
        }
        setDraggedLotData(null);
    };

    const exportJSON = () => {
        const data = JSON.stringify(placedLots, null, 2);
        navigator.clipboard.writeText(data);
        alert("JSON copiado al portapapeles!");
    };

    const removeLot = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setPlacedLots(placedLots.filter((l) => l.id !== id));
        // Also remove from initial lots context if we were syncing real time, but here we just update local state
    };

    const updateLotStage = (id: number, newStage: number) => {
        setPlacedLots(placedLots.map(l => l.id === id ? { ...l, stage: newStage } : l));
    };

    const getStageColor = (stage: number) => {
        switch (stage) {
            case 1: return "bg-red-500";
            case 2: return "bg-blue-500";
            case 3: return "bg-green-500";
            case 4: return "bg-yellow-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
            {/* TOOLBAR */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button
                    onClick={() => setView(view === "real" ? "technical" : "real")}
                    className="bg-white p-2 rounded shadow flex items-center gap-2 hover:bg-gray-50"
                >
                    <MapIcon size={20} />
                    {view === "real" ? "Ver Plano Técnico" : "Ver Foto Real"}
                </button>
                <button
                    onClick={exportJSON}
                    className="bg-blue-600 text-white p-2 rounded shadow flex items-center gap-2 hover:bg-blue-700"
                >
                    <Save size={20} />
                    Exportar JSON
                </button>
            </div>

            {/* STAGE LEGEND / SELECTOR Overlay */}
            <div className="absolute bottom-4 left-4 z-50 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border">
                <h3 className="text-sm font-bold mb-2">Asignar Etapa (Drag & Drop)</h3>
                <div className="flex flex-col gap-2">
                    {[1, 2, 3, 4].map(num => (
                        <label key={num} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="stage"
                                checked={currentStage === num}
                                onChange={() => setCurrentStage(num)}
                                className="accent-blue-600"
                            />
                            <span className={`w-3 h-3 rounded-full ${getStageColor(num)}`}></span>
                            <span className="text-sm">Etapa {num}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* CANVAS AREA */}
            <div className="flex-1 overflow-auto bg-gray-200 relative">
                <div
                    ref={mapRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{ width: "1500px", position: "relative" }}
                    className="select-none"
                >
                    <img
                        src={view === "real" ? "/plano-assets/plano-real.jpeg" : "/plano-assets/plano-real.jpeg"}
                        alt="Map"
                        style={{ width: "100%", display: "block" }}
                        draggable={false}
                    />

                    {/* Placed Pins */}
                    {placedLots.map((lot) => (
                        <div
                            key={lot.id}
                            draggable
                            onDragStart={(e) => handleDragStartExisting(e, lot)}
                            style={{
                                left: `${lot.x}%`,
                                top: `${lot.y}%`,
                                position: "absolute",
                                transform: "translate(-50%, -50%)",
                                cursor: "move"
                            }}
                            className="group"
                            title={`Lote ${lot.number} - Etapa ${lot.stage}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                const nextStage = lot.stage >= 4 ? 1 : lot.stage + 1;
                                updateLotStage(lot.id, nextStage);
                            }}
                        >
                            <div className="relative">
                                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border border-white shadow-sm flex items-center justify-center text-white font-bold text-[7px] md:text-[9px] hover:scale-150 transition-transform ${getStageColor(lot.stage)}`}>
                                    {lot.number}
                                </div>
                                <button
                                    onClick={(e) => removeLot(e, lot.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    x
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SIDEBAR */}
            <div className="w-64 bg-white border-l shadow-xl flex flex-col z-40">
                <div className="p-4 border-b bg-gray-50 space-y-4">
                    <div>
                        <h2 className="font-bold text-lg">Crear Lote</h2>
                        <p className="text-xs text-gray-500">Ingresa número y arrastra al mapa</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-700">Número de Lote</label>
                            <input
                                type="text"
                                value={newLotNumber}
                                onChange={(e) => setNewLotNumber(e.target.value)}
                                placeholder="Ej: 45, A-1..."
                                className="border p-2 rounded w-full text-sm"
                            />
                        </div>

                        <div
                            draggable={!!newLotNumber}
                            onDragStart={handleDragStartNew}
                            className={`
                        p-3 rounded border border-dashed flex items-center justify-center gap-2 font-medium transition-colors
                        ${newLotNumber
                                    ? 'bg-blue-50 border-blue-300 cursor-grab active:cursor-grabbing text-blue-700 hover:bg-blue-100'
                                    : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                        >
                            <Plus size={16} />
                            {newLotNumber ? `Arrastrar "${newLotNumber}"` : "Ingresa un número"}
                        </div>
                        {newLotNumber && (
                            <div className="text-[10px] text-center text-gray-400">
                                Etapa seleccionada: <span className="font-bold">Etapa {currentStage}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-2 bg-gray-100 border-b text-xs font-bold text-gray-500 flex justify-between items-center">
                        <span>Lotes Ubicados ({placedLots.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {placedLots.slice().reverse().map((lot) => (
                            <div key={lot.id} className="flex items-center justify-between p-2 bg-white rounded border shadow-sm text-sm hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${getStageColor(lot.stage)}`} />
                                    <span className="font-medium">#{lot.number}</span>
                                </div>
                                <button
                                    onClick={(e) => removeLot(e, lot.id)}
                                    className="text-gray-400 hover:text-red-500"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {placedLots.length === 0 && (
                            <div className="text-center text-gray-400 py-4 text-xs">
                                No hay lotes ubicados
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
