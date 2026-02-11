'use client';

import { Lot } from '@/types';
import { X } from 'lucide-react';
import { LotGrid } from './LotGrid';
import { useEffect } from 'react';

interface PlanoModalProps {
    isOpen: boolean;
    onClose: () => void;
    lots: Lot[];
    onSelectLot: (lot: Lot) => void;
    onUpdateLots: (lots: Lot[]) => void;
    selectedLotId: number | null;
    userReservation: number | null;
    isSessionActive: boolean;
}

export const PlanoModal = ({ isOpen, onClose, lots, onSelectLot, onUpdateLots, selectedLotId, userReservation, isSessionActive }: PlanoModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full h-full max-w-[95vw] max-h-[95vh] m-4 bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div>
                        <h2 className="text-2xl font-black text-foreground">Plano Esquemático</h2>
                        <p className="text-sm text-muted-foreground mt-1">Selecciona tu terreno ideal</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-auto p-6">
                    <LotGrid
                        lots={lots}
                        onSelectLot={onSelectLot}
                        onUpdateLots={onUpdateLots}
                        selectedLotId={selectedLotId}
                        userReservation={userReservation}
                        isSessionActive={isSessionActive}
                    />
                </div>
            </div>
        </div>
    );
};
