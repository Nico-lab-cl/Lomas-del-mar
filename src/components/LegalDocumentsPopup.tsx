'use client';

import { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LegalDocumentsPopup = () => {
    const [showBasesLegales, setShowBasesLegales] = useState(false);
    const [hasReadBases, setHasReadBases] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show popup when scrolling past the hero (only if not dismissed)
            const scrolled = window.scrollY > window.innerHeight - 200;
            if (scrolled && !showBasesLegales && !isDismissed) {
                setShowBasesLegales(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [showBasesLegales, isDismissed]);

    const handleBasesLegalesClose = () => {
        setShowBasesLegales(false);
        setIsDismissed(true); // Mark as dismissed permanently
    };

    const handleBasesLegalesView = () => {
        window.open('https://drive.google.com/file/d/1Q7rZQAx7voDp4Qk8VWhTQmP0ezSDxJIu/view', '_blank');
    };

    const handleBasesLegalesDownload = () => {
        window.open('https://drive.google.com/uc?export=download&id=1Q7rZQAx7voDp4Qk8VWhTQmP0ezSDxJIu', '_blank');
    };

    const handleCheckboxChange = (checked: boolean) => {
        setHasReadBases(checked);
        if (checked) {
            // Auto-close modal when checkbox is checked
            setTimeout(() => {
                handleBasesLegalesClose();
            }, 300);
        }
    };

    if (!showBasesLegales) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-lg bg-card rounded-3xl shadow-2xl border-2 border-primary/50 overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Gradient Header */}
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 border-b border-primary/20">
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={handleBasesLegalesClose}
                            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-2xl bg-primary/20">
                            <FileText className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-foreground">
                                Bases Legales
                            </h3>
                            <p className="text-sm text-primary font-semibold">
                                Lectura Obligatoria
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <p className="text-base text-foreground mb-6 leading-relaxed">
                        Antes de continuar con tu compra, <strong>debes leer las bases legales</strong> de la promoción.
                        Este documento contiene información legal importante sobre términos y condiciones.
                    </p>

                    <div className="flex flex-col gap-4">
                        <Button
                            onClick={handleBasesLegalesView}
                            size="lg"
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-xl"
                        >
                            📋 Más Info
                        </Button>

                        <Button
                            onClick={handleBasesLegalesDownload}
                            size="lg"
                            variant="outline"
                            className="w-full h-14 font-bold text-lg border-primary/30 hover:bg-primary/10"
                        >
                            ⬇️ Descargar PDF
                        </Button>

                        {/* Checkbox */}
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors bg-muted/30">
                            <input
                                type="checkbox"
                                id="readBases"
                                checked={hasReadBases}
                                onChange={(e) => handleCheckboxChange(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                            />
                            <label
                                htmlFor="readBases"
                                className="text-base font-semibold text-foreground cursor-pointer select-none flex-1"
                            >
                                He leído las bases legales
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
