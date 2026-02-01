import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Lot } from '@/types';
import {
  isLotLocked,
  extractPositionsFromLots,
  applyPositionsById,
  savePositions,
  getDefaultPositions,
  loadLots,
  loadMapOverrides,
  saveMapOverrides,
  resetMapOverridesToDefault,
  MapOverrides,
} from '@/services/mockData';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { StatusLegend } from './StatusLegend';
import { Settings, Undo, Save, RotateCcw, AlertTriangle, RefreshCw, X, GripVertical, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { PurchaseTutorial, openPurchaseTutorial } from '@/components/PurchaseTutorial';

interface LotGridProps {
  lots: Lot[];
  onSelectLot: (lot: Lot) => void;
  onUpdateLots: (lots: Lot[]) => void;
  selectedLotId: number | null;
  userReservation: number | null;
  isSessionActive: boolean;
  isHydrating?: boolean;
}

export const LotGrid = ({
  lots,
  onSelectLot,
  onUpdateLots,
  selectedLotId,
  userReservation,
  isSessionActive,
  isHydrating = false,
}: LotGridProps) => {
  const { isAdmin } = useAdminAuth();
  const [jumpingLotId, setJumpingLotId] = useState<number | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [positionHistory, setPositionHistory] = useState<{ lotId: number, x: number, y: number, size?: number }[]>([]);
  const [originalLots, setOriginalLots] = useState<Lot[]>([]);
  const [mapError, setMapError] = useState(false);
  const [draggingLotId, setDraggingLotId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedLotForResize, setSelectedLotForResize] = useState<number | null>(null);
  const [draftSizes, setDraftSizes] = useState<Record<string, number>>({});
  const [mapOverrides, setMapOverrides] = useState<MapOverrides>({});
  const [draftOverrides, setDraftOverrides] = useState<MapOverrides>({});
  const [overrideLabel, setOverrideLabel] = useState('');
  const [overrideStage, setOverrideStage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMapOverrides(loadMapOverrides());
  }, []);

  const persistOverrides = useCallback((next: MapOverrides) => {
    saveMapOverrides(next);
    setMapOverrides(loadMapOverrides());

    // Refrescar lotes desde fuente de verdad para que el cambio se vea inmediatamente.
    try {
      onUpdateLots(loadLots());
    } catch {
      return;
    }
  }, [onUpdateLots]);

  const selectedOverride = selectedLotForResize ? mapOverrides[String(selectedLotForResize)] : undefined;
  const selectedDraft = selectedLotForResize ? draftOverrides[String(selectedLotForResize)] : undefined;

  useEffect(() => {
    if (!selectedLotForResize) {
      setOverrideLabel('');
      setOverrideStage('');
      return;
    }
    const draft = draftOverrides[String(selectedLotForResize)];
    if (draft) {
      setOverrideLabel(draft.label ?? '');
      setOverrideStage(draft.stage != null ? String(draft.stage) : '');
      return;
    }
    const o = mapOverrides[String(selectedLotForResize)];
    setOverrideLabel(o?.label ?? '');
    setOverrideStage(o?.stage != null ? String(o.stage) : '');
  }, [selectedLotForResize, mapOverrides, draftOverrides]);

  const effectiveOverrides = useMemo(() => {
    if (!isEditorMode) return mapOverrides;

    const next = { ...mapOverrides };
    for (const [lotId, draft] of Object.entries(draftOverrides)) {
      const label = (draft.label ?? '').trim();
      const cleanedLabel = label.length ? label : undefined;
      const cleanedStage =
        draft.stage != null && draft.stage >= 1 && draft.stage <= 4 ? draft.stage : undefined;

      if (!cleanedLabel && cleanedStage == null) {
        delete next[lotId];
      } else {
        next[lotId] = { label: cleanedLabel, stage: cleanedStage };
      }
    }
    return next;
  }, [isEditorMode, mapOverrides, draftOverrides]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Store original lots when entering editor mode
  const handleEnterEditorMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Deep copy of lots to preserve original state
    setOriginalLots(lots.map(lot => ({ ...lot })));
    setPositionHistory([]);
    setIsEditorMode(true);
  };

  // Save changes and exit editor mode
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Persist current label/stage draft before exiting editor
    persistOverrides(effectiveOverrides);

    // Persist draft sizes before exiting editor
    if (Object.keys(draftSizes).length > 0) {
      const nextLots = lots.map((l) => {
        const draft = draftSizes[String(l.id)];
        return draft != null ? { ...l, size: draft } : l;
      });
      onUpdateLots(nextLots);
      setDraftSizes({});
    }
    // Changes are already saved via onUpdateLots, just close editor
    setIsEditorMode(false);
    setPositionHistory([]);
    setOriginalLots([]);
    setDraftOverrides({});
    setSelectedLotForResize(null);
  };

  // Restore to original state (before entering editor mode)
  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (originalLots.length > 0) {
      onUpdateLots(originalLots.map(lot => ({ ...lot })));
      setPositionHistory([]);
    }
  };

  // Close editor without saving (restore original)
  const handleCloseEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (originalLots.length > 0) {
      onUpdateLots(originalLots.map(lot => ({ ...lot })));
    }
    setIsEditorMode(false);
    setPositionHistory([]);
    setOriginalLots([]);
    setSelectedLotForResize(null);
    setDraftOverrides({});
    setDraftSizes({});
  };

  // Handle lot size change
  const handleSizeChange = (lotId: number, newSize: number) => {
    const lot = lots.find(l => l.id === lotId);
    if (lot) {
      setPositionHistory(prev => [...prev, { lotId: lot.id, x: lot.x, y: lot.y, size: lot.size || 1 }]);
      const updatedLots = lots.map(l =>
        l.id === lotId ? { ...l, size: newSize } : l
      );
      onUpdateLots(updatedLots);
    }
  };

  const handleDraftSizeChange = useCallback((lotId: number, newSize: number) => {
    setDraftSizes((prev) => ({ ...prev, [String(lotId)]: newSize }));
  }, []);

  const handleCommitDraftSize = useCallback((lotId: number) => {
    const draft = draftSizes[String(lotId)];
    if (draft == null) return;
    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      setPositionHistory((prev) => [...prev, { lotId: lot.id, x: lot.x, y: lot.y, size: lot.size || 1 }]);
    }
    const updatedLots = lots.map((l) => (l.id === lotId ? { ...l, size: draft } : l));
    onUpdateLots(updatedLots);
    setDraftSizes((prev) => {
      const next = { ...prev };
      delete next[String(lotId)];
      return next;
    });
  }, [draftSizes, lots, onUpdateLots]);

  const getStatusClass = (lot: Lot): string => {
    if (lot.id === selectedLotId || lot.id === userReservation) {
      return 'lot-marker-selected';
    }
    // Check if lot is temporarily locked
    if (lot.status === 'available' && isLotLocked(lot)) {
      return 'lot-marker-reserved'; // Show as reserved while locked
    }
    switch (lot.status) {
      case 'available':
        return 'lot-marker-available';
      case 'reserved':
        return 'lot-marker-reserved';
      case 'sold':
        return 'lot-marker-sold';
      default:
        return 'lot-marker-available';
    }
  };

  const handleLotClick = (lot: Lot) => {
    if (!isHydrating && !isEditorMode && lot.status === 'available' && isSessionActive) {
      onSelectLot(lot);
    }
  };

  const getAutoSizeForLot = useCallback((lot: Lot): number | undefined => {
    const override = effectiveOverrides[String(lot.id)];
    const stage = override?.stage ?? lot.displayStage ?? lot.stage ?? 1;

    const labelFromOverride = override?.label != null ? String(override.label).trim() : '';
    const computedLabel = String(lot.displayLabel ?? lot.number);
    const label = labelFromOverride.length ? labelFromOverride : computedLabel;
    const labelNum = Number.parseInt(label, 10);
    if (!Number.isFinite(labelNum)) return undefined;

    // Stage 2: lots 26-28 should be smaller like 24-25
    if (stage === 2 && labelNum >= 24 && labelNum <= 28) return 0.85;

    // Stage 3: lots 23-25 should be smaller like 22
    if (stage === 3 && labelNum >= 23 && labelNum <= 25) return 0.85;

    // Stage 4: lots 1-15 slightly smaller
    if (stage === 4 && labelNum >= 1 && labelNum <= 15) return 0.78;

    // Stage 4: lots 42-48 slightly larger to fill space
    if (stage === 4 && labelNum >= 42 && labelNum <= 48) return 1.15;

    // Stage 4: lots 49-61 same size as 62-65
    if (stage === 4 && labelNum >= 49 && labelNum <= 61) return 1;

    return undefined;
  }, [effectiveOverrides]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, lot: Lot) => {
    if (!isEditorMode || !containerRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate offset from lot center to mouse position
    const lotX = (lot.x / 100) * rect.width + rect.left;
    const lotY = (lot.y / 100) * rect.height + rect.top;

    setDragOffset({
      x: clientX - lotX,
      y: clientY - lotY
    });

    // Save position for undo
    setPositionHistory(prev => [...prev, { lotId: lot.id, x: lot.x, y: lot.y }]);
    setDraggingLotId(lot.id);
  }, [isEditorMode]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingLotId === null || !containerRef.current) return;

    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate new position as percentage
    let x = ((clientX - dragOffset.x - rect.left) / rect.width) * 100;
    let y = ((clientY - dragOffset.y - rect.top) / rect.height) * 100;

    // Clamp values to keep lot within bounds
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const updatedLots = lots.map(lot =>
      lot.id === draggingLotId ? { ...lot, x, y } : lot
    );
    onUpdateLots(updatedLots);
  }, [draggingLotId, dragOffset, lots, onUpdateLots]);

  const handleDragEnd = useCallback(() => {
    setDraggingLotId(null);
  }, []);

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (draggingLotId !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggingLotId, handleDragMove, handleDragEnd]);

  // Undo last action
  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (positionHistory.length === 0) return;

    const lastPosition = positionHistory[positionHistory.length - 1];
    const updatedLots = lots.map(lot =>
      lot.id === lastPosition.lotId ? { ...lot, x: lastPosition.x, y: lastPosition.y, size: lastPosition.size || 1 } : lot
    );
    onUpdateLots(updatedLots);
    setPositionHistory(prev => prev.slice(0, -1));
  };

  const selectedResizeLot = lots.find(l => l.id === selectedLotForResize);

  const handleExportLayout = () => {
    const positions = extractPositionsFromLots(lots);
    const backup = {
      schema: 'lomas_map_backup_v1',
      createdAt: new Date().toISOString(),
      positions,
      overrides: effectiveOverrides,
      lots: lots.map((lot) => ({
        id: lot.id,
        x: lot.x,
        y: lot.y,
        size: lot.size,
        stage: lot.displayStage ?? lot.stage,
        label: lot.displayLabel ?? lot.number,
        status: lot.status,
        area: lot.area,
        pricePerM2: lot.pricePerM2,
        totalPrice: lot.totalPrice,
      })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lomas-backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportLayoutFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      const isBackup =
        parsed !== null &&
        typeof parsed === 'object' &&
        'schema' in parsed &&
        (parsed as { schema?: unknown }).schema === 'lomas_map_backup_v1';

      if (isBackup) {
        const backup = parsed as {
          positions?: Record<string, { x: number; y: number; size?: number }>;
          overrides?: Record<string, { label?: string; stage?: number }>;
          lots?: Array<{
            id: number;
            status?: Lot['status'];
            area?: Lot['area'];
            pricePerM2?: Lot['pricePerM2'];
            totalPrice?: Lot['totalPrice'];
          }>;
        };

        const nextPositions = backup.positions ?? {};
        savePositions(nextPositions);

        if (backup.overrides && typeof backup.overrides === 'object') {
          persistOverrides(backup.overrides);
        }

        let updatedLots = applyPositionsById(lots, nextPositions);
        if (Array.isArray(backup.lots) && backup.lots.length > 0) {
          const byId = new Map<number, (typeof backup.lots)[number]>();
          backup.lots.forEach((l) => byId.set(l.id, l));
          updatedLots = updatedLots.map((lot) => {
            const snap = byId.get(lot.id);
            if (!snap) return lot;
            return {
              ...lot,
              status: (snap.status as Lot['status']) ?? lot.status,
              area: (snap.area as Lot['area']) ?? lot.area,
              pricePerM2: (snap.pricePerM2 as Lot['pricePerM2']) ?? lot.pricePerM2,
              totalPrice: (snap.totalPrice as Lot['totalPrice']) ?? lot.totalPrice,
            };
          });
        }

        onUpdateLots(updatedLots);
        return;
      }

      const legacyPositions = parsed as Record<string, { x: number; y: number; size?: number }>;
      const updatedLots = applyPositionsById(lots, legacyPositions);
      savePositions(legacyPositions);
      onUpdateLots(updatedLots);
    } catch {
      return;
    }
  };

  const handleResetToOfficialLayout = () => {
    const defaults = getDefaultPositions();
    savePositions(defaults);
    onUpdateLots(applyPositionsById(lots, defaults));
  };

  return (
    <div id="plano" className="status-card scroll-mt-32">
      <PurchaseTutorial />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-foreground">Plano Maestro: Lomas Del Mar</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openPurchaseTutorial()}
          >
            ¿Cómo comprar?
          </Button>
          <StatusLegend />
        </div>
      </div>

      {/* Mobile hint */}
      <p className="text-xs text-muted-foreground mb-2 md:hidden flex items-center gap-1">
        <span>👆</span> Desliza horizontalmente para ver todo el plano
      </p>

      {/* Demo Map Warning */}
      {mapError && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4 flex flex-col sm:flex-row items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-warning">Usando Mapa de Demostración</p>
            <p className="text-sm text-muted-foreground">
              No pudimos cargar /plano.svg desde la carpeta public.
              <br />Verifica que exista public/plano.svg y que el archivo se pueda abrir directamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/plano.svg', '_blank')}
            >
              Abrir SVG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable Map Wrapper for Mobile */}
      <div className="overflow-x-auto -mx-5 px-5 pb-2">
        {/* Map Container */}
        <div
          ref={containerRef}
          className={`relative bg-white rounded-xl overflow-hidden border border-border ${isEditorMode ? 'cursor-move' : ''}`}
          style={{ aspectRatio: '4/3', minWidth: '420px' }}
        >
          {/* Background Map Image */}
          <object
            data={'/plano.svg'}
            type="image/svg+xml"
            aria-label="Plano Maestro"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            onLoad={() => {
              if (mapError) setMapError(false);
            }}
            onError={() => {
              setMapError(true);
            }}
          />

          {/* Lot Markers */}
          {lots
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((lot) => {
              const isSmallLot = (lot.id >= 1 && lot.id <= 27) || (lot.id >= 51 && lot.id <= 74) || (lot.id >= 93 && lot.id <= 114) || (lot.id >= 147 && lot.id <= 192);
              const isDragging = draggingLotId === lot.id;
              const isSelectedForResize = selectedLotForResize === lot.id;
              const isLocked = isLotLocked(lot);
              const canJump = lot.status === 'available' && !isLocked && !isEditorMode;
              const clickJumpOffsetPx = jumpingLotId === lot.id ? -10 : 0;
              const autoSize = getAutoSizeForLot(lot);
              const draftSize = draftSizes[String(lot.id)];
              const manualSize = lot.size != null && lot.size !== 1 ? lot.size : undefined;
              const lotSize = draftSize ?? manualSize ?? autoSize ?? 1;
              const lotOverride = effectiveOverrides[String(lot.id)];
              const markerText = (lotOverride?.label && lotOverride.label.trim())
                ? lotOverride.label.trim()
                : String(lot.displayLabel ?? lot.number);
              return (
                <Tooltip key={lot.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`lot-marker-responsive absolute ${isSmallLot ? 'lot-marker-small' : ''} ${getStatusClass(lot)} ${canJump ? 'lot-marker-jumpable' : ''} ${isDragging ? 'ring-4 ring-blue-400 scale-110 z-50' : ''
                        } ${isSelectedForResize ? 'ring-4 ring-yellow-400 z-40' : ''} ${isEditorMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      style={{
                        left: `${lot.x}%`,
                        top: `${lot.y}%`,
                        transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                        transform: `translate(-50%, -50%) translateY(calc(var(--lot-jump-y, 0px) + ${clickJumpOffsetPx}px)) scale(${lotSize})`,
                      }}
                      onMouseDown={(e) => {
                        if (!isEditorMode) return;
                        handleDragStart(e, lot);
                      }}
                      onTouchStart={(e) => {
                        if (!isEditorMode) return;
                        handleDragStart(e, lot);
                      }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (canJump) {
                          setJumpingLotId(lot.id);
                          window.setTimeout(() => {
                            setJumpingLotId((prev) => (prev === lot.id ? null : prev));
                          }, 180);
                        }
                        if (isEditorMode) {
                          // Save current draft before switching selection
                          if (selectedLotForResize && selectedLotForResize !== lot.id) {
                            const currentLotId = String(selectedLotForResize);
                            const label = overrideLabel.trim();
                            const stageNum = overrideStage.trim() ? Number(overrideStage.trim()) : undefined;
                            const nextStage = Number.isFinite(stageNum) ? stageNum : undefined;

                            setDraftOverrides((prev) => {
                              const next = { ...prev };
                              const cleanedLabel = label.length ? label : undefined;
                              const cleanedStage =
                                nextStage != null && nextStage >= 1 && nextStage <= 4 ? nextStage : undefined;

                              if (!cleanedLabel && cleanedStage == null) {
                                delete next[currentLotId];
                              } else {
                                next[currentLotId] = { label: cleanedLabel, stage: cleanedStage };
                              }
                              return next;
                            });
                          }
                          setSelectedLotForResize(lot.id);
                        }
                        handleLotClick(lot);
                      }}
                    >
                      {isEditorMode && (
                        <GripVertical className="w-2 h-2 absolute -top-1 -right-1 text-white/70" />
                      )}
                      {markerText}
                    </button>
                  </TooltipTrigger>
                  {!isEditorMode && (
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-semibold">Lote L-{lot.displayLabel ?? lot.number}</p>
                        {(lot.displayStage ?? lot.stage) && (
                          <p className="text-xs text-muted-foreground">Etapa {lot.displayStage ?? lot.stage}</p>
                        )}
                        <p className="text-sm">{lot.area} m²</p>
                        <p className={`font-bold ${lot.status === 'available' ? 'text-primary' : 'text-muted-foreground'}`}>
                          {lot.totalPrice ? formatCurrency(lot.totalPrice) : 'Consultar'}
                        </p>
                        {lot.status === 'reserved' && (
                          <p className="text-xs text-amber-600 mt-1">Reservado</p>
                        )}
                        {lot.status === 'sold' && (
                          <p className="text-xs text-red-600 mt-1">Vendido</p>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}

          {/* Editor Mode Button - Only visible for admin */}
          {isAdmin && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm z-20"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                if (isEditorMode) {
                  handleCloseEditor(e);
                } else {
                  handleEnterEditorMode(e);
                }
              }}
            >
              {isEditorMode ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </Button>
          )}

        </div>
      </div>

      {/* Editor Panel - Outside map container to not block lots */}
      {isEditorMode && (
        <div
          className="mt-4 bg-card border border-border rounded-lg p-4 shadow-lg animate-scale-in"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            <GripVertical className="w-4 h-4" />
            Modo Editor - Arrastra los lotes
          </h3>

          <p className="text-xs text-muted-foreground mb-3">
            Arrastra cualquier lote para posicionarlo. Haz clic en un lote para seleccionarlo y cambiar su tamaño.
          </p>

          {/* Size adjustment for selected lot */}
          {selectedResizeLot && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tamaño del Lote {selectedResizeLot.number}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedLotForResize(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground">Nombre en el plano</label>
                  <input
                    value={overrideLabel}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOverrideLabel(value);
                      if (!selectedResizeLot) return;
                      const lotId = String(selectedResizeLot.id);
                      setDraftOverrides((prev) => ({
                        ...prev,
                        [lotId]: {
                          label: value,
                          stage: prev[lotId]?.stage ?? selectedOverride?.stage,
                        },
                      }));
                    }}
                    className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder={selectedOverride?.label ? '' : 'Ej: 44'}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Etapa (1-4)</label>
                  <input
                    value={overrideStage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOverrideStage(value);
                      if (!selectedResizeLot) return;
                      const lotId = String(selectedResizeLot.id);
                      const stageNum = value.trim() ? Number(value.trim()) : undefined;
                      const nextStage = Number.isFinite(stageNum) ? stageNum : undefined;
                      setDraftOverrides((prev) => ({
                        ...prev,
                        [lotId]: {
                          label: prev[lotId]?.label ?? overrideLabel,
                          stage: nextStage,
                        },
                      }));
                    }}
                    className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder={selectedOverride?.stage != null ? '' : 'Ej: 2'}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!selectedResizeLot) return;
                    const lotId = String(selectedResizeLot.id);
                    const label = overrideLabel.trim();
                    const stageNum = overrideStage.trim() ? Number(overrideStage.trim()) : undefined;
                    const nextStage = Number.isFinite(stageNum) ? stageNum : undefined;

                    const next = { ...mapOverrides };
                    const cleanedLabel = label.length ? label : undefined;
                    const cleanedStage = nextStage != null && nextStage >= 1 && nextStage <= 4 ? nextStage : undefined;

                    if (!cleanedLabel && cleanedStage == null) {
                      delete next[lotId];
                    } else {
                      next[lotId] = { label: cleanedLabel, stage: cleanedStage };
                    }
                    persistOverrides(next);

                    setDraftOverrides((prev) => {
                      const d = { ...prev };
                      delete d[lotId];
                      return d;
                    });
                  }}
                >
                  Guardar nombre/etapa
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedOverride}
                  onClick={() => {
                    if (!selectedResizeLot) return;
                    const next = { ...mapOverrides };
                    delete next[String(selectedResizeLot.id)];
                    persistOverrides(next);
                  }}
                >
                  Eliminar override
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[draftSizes[String(selectedResizeLot.id)] ?? (selectedResizeLot.size || 1)]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value: number[]) => handleDraftSizeChange(selectedResizeLot.id, value[0])}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {(((draftSizes[String(selectedResizeLot.id)] ?? (selectedResizeLot.size || 1)) * 100)).toFixed(0)}%
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={draftSizes[String(selectedResizeLot.id)] == null}
                  onClick={() => handleCommitDraftSize(selectedResizeLot.id)}
                >
                  Guardar tamaño
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={positionHistory.length === 0}
            >
              <Undo className="w-3 h-3 mr-1" />
              Deshacer ({positionHistory.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRestore}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Restaurar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const defaults = resetMapOverridesToDefault();
                setDraftOverrides({});
                setMapOverrides(defaults);
                try {
                  onUpdateLots(loadLots());
                } catch {
                  return;
                }
              }}
            >
              Restaurar numeración oficial
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const defaults = getDefaultPositions();
                savePositions(defaults);
                onUpdateLots(applyPositionsById(lots, defaults));
              }}
            >
              Layout oficial
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => importInputRef.current?.click()}
            >
              Importar layout
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleImportLayoutFile(file);
                }
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportLayout}
            >
              Exportar layout
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={handleSave}
            >
              <Save className="w-3 h-3 mr-1" />
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
