'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Copy, Map as LucideMap } from 'lucide-react';
import { Lot, LotStatus } from '@/types';

// --- DATA HARDCODED ---
const STATIC_LOTS: Partial<Lot>[] = [];
for (let i = 1; i <= 49; i++) STATIC_LOTS.push({ id: i, number: String(i), status: 'available' });
for (let i = 50; i <= 150; i++) STATIC_LOTS.push({ id: i, number: String(i), status: 'available' });
STATIC_LOTS.push({ id: 201, number: '201', status: 'available' });
STATIC_LOTS.push({ id: 202, number: '202', status: 'available' });
STATIC_LOTS.push({ id: 203, number: '203', status: 'available' });

type Pin = {
    id: number;
    number: string;
    x: number;
    y: number;
    status: LotStatus;
};

export default function MapBuilder() {
    const [viewMode, setViewMode] = useState<'real' | 'tecnico'>('real');
    const [placedPins, setPlacedPins] = useState<Pin[]>([]);
    const [draggedItem, setDraggedItem] = useState<Lot | null>(null);
    const [movingPinId, setMovingPinId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Filter
    const availableLots = STATIC_LOTS.filter(l =>
        !placedPins.some(p => p.id === l.id) &&
        (l.number?.includes(searchTerm) ?? true)
    );

    // --- DRAG ---
    const handleDragStartFromPalette = (e: React.DragEvent, lot: Lot) => {
        setDraggedItem(lot);
        setMovingPinId(null);
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/json", JSON.stringify(lot));
    };

    const handlePinDragStart = (e: React.DragEvent, pin: Pin) => {
        setMovingPinId(pin.id);
        setDraggedItem(null);
        e.dataTransfer.effectAllowed = "move";
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = movingPinId ? "move" : "copy";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!mapContainerRef.current) return;

        const rect = mapContainerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const xPercent = (offsetX / rect.width) * 100;
        const yPercent = (offsetY / rect.height) * 100;
        const finalX = Math.max(0, Math.min(100, xPercent));
        const finalY = Math.max(0, Math.min(100, yPercent));

        if (movingPinId) {
            setPlacedPins(prev => prev.map(p =>
                p.id === movingPinId ? { ...p, x: finalX, y: finalY } : p
            ));
            setMovingPinId(null);
        } else if (draggedItem) {
            const newPin: Pin = {
                id: draggedItem.id,
                number: draggedItem.number,
                status: draggedItem.status,
                x: finalX,
                y: finalY
            };
            setPlacedPins(prev => [...prev, newPin]);
            setDraggedItem(null);
        }
    };

    const handleExport = () => {
        const minimalData = placedPins.map(({ number, x, y }) => ({
            number,
            x: Number(x.toFixed(2)),
            y: Number(y.toFixed(2))
        }));
        const json = JSON.stringify(minimalData, null, 2);
        navigator.clipboard.writeText(json);
        alert("JSON COPIADO!");
        console.log(json);
    };

    return (
        <div className="h-screen w-full bg-slate-950 text-white overflow-hidden relative">

            {/* 1. Header Fijo Arriba */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-white/10 z-50 flex items-center justify-between px-4 shadow-xl">
                <h1 className="text-xl font-bold flex gap-2 items-center text-emerald-400">
                    <LucideMap className="w-6 h-6" />
                    Builder v3 (Fixed)
                </h1>
                <div className="flex gap-4">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                        <TabsList className="bg-slate-800">
                            <TabsTrigger value="real">Real</TabsTrigger>
                            <TabsTrigger value="tecnico">Técnico</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={handleExport} className="bg-emerald-600 font-bold">
                        <Copy className="w-4 h-4 mr-2" /> COPIAR JSON
                    </Button>
                </div>
            </div>

            {/* 2. Sidebar Fija Derecha (Garantizado que se ve) */}
            <div className="fixed top-16 right-0 bottom-0 w-80 bg-slate-900 border-l border-white/20 z-40 flex flex-col shadow-2xl">
                <div className="p-3 border-b border-white/10 bg-slate-800/50">
                    <h2 className="text-sm font-bold text-center text-slate-300">
                        PENDIENTES: <span className="text-emerald-400 text-lg">{availableLots.length}</span>
                    </h2>
                    <input
                        className="mt-2 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Scroll nativo simple */}
                <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                    <div className="grid grid-cols-4 gap-2">
                        {availableLots.map(lot => (
                            <div
                                key={lot.id}
                                draggable
                                onDragStart={(e) => handleDragStartFromPalette(e, lot as Lot)}
                                className="aspect-square bg-slate-800 border border-slate-600 rounded flex items-center justify-center cursor-grab hover:bg-emerald-900 hover:border-emerald-500 transition-all select-none"
                            >
                                <span className="font-bold text-white shadow-black drop-shadow-md">{lot.number}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-black/30 border-t border-white/10 text-center text-xs text-slate-500">
                    Arrastra al mapa
                </div>
            </div>

            {/* 3. Área Principal (Canvas) */}
            <div className="absolute top-16 left-0 right-80 bottom-0 bg-[#111] overflow-auto flex justify-center p-10">
                <div
                    ref={mapContainerRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="relative shadow-2xl border-4 border-yellow-500/20"
                    style={{ width: '1600px', height: 'fit-content' }}
                >
                    <img
                        src={viewMode === 'real' ? '/plano-assets/plano-real.jpeg' : '/plano-assets/plano-a062dd1825b1a339.png'}
                        alt="Mapa Base"
                        className="w-full h-auto block pointer-events-none select-none"
                    />

                    {placedPins.map(pin => (
                        <div
                            key={pin.id}
                            draggable
                            onDragStart={(e) => handlePinDragStart(e, pin)}
                            onContextMenu={(e) => { e.preventDefault(); setPlacedPins(prev => prev.filter(p => p.id !== pin.id)); }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move hover:scale-125 z-20"
                            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        >
                            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg">
                                <span className="text-[9px] font-black text-white">{pin.number}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
