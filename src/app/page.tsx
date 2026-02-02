"use client";

import dynamic from 'next/dynamic';
import { Map as MapIcon } from 'lucide-react';

const MapLotViewer = dynamic(() => import('@/components/MapLotViewer'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center">Cargando Mapa Satelital...</div>
});

import { useState, useEffect, useCallback } from 'react';
import { Lot, UserSession } from '@/types';
import {
  loadLots,
  saveLots,
  loadSession,
  saveSession,
  createNewSession,
  lockLot,
  releaseExpiredLocks,
  isLotLocked
} from '@/services/mockData';
import { Header } from '@/components/Header';
import { CountdownBanner } from '@/components/CountdownBanner';
import { WaitingRoom } from '@/components/WaitingRoom';
import { UserStatusMessage } from '@/components/UserStatusMessage';
import { ProgressBar } from '@/components/ProgressBar';
import { LotGrid } from '@/components/LotGrid';
import { InvestmentDetails } from '@/components/InvestmentDetails';
import { LotReservationPopup } from '@/components/LotReservationPopup';
import { LegalBasesPopup } from '@/components/LegalBasesPopup';
import { LegalBasesModal } from '@/components/LegalBasesModal';
import { Footer } from '@/components/Footer';
import { AdminLogin } from '@/components/AdminLogin';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured, tryLockLot } from '@/services/lotLocksSupabase';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, Droplets, Zap, Lock, Route, Footprints, Sun, Trees, ScrollText } from 'lucide-react';
import Link from 'next/link';

const BLOCK_DURATION = 60 * 1000; // 60 seconds
const DISABLE_WAITING_ROOM = false;
const DISABLE_COUNTDOWN = false;
const DISABLE_SESSION_EXPIRY = false;

type ApiLotsRow = {
  id: number;
  number: string;
  status: string;
  reserved_until?: string | null;
};

const normalizeStatus = (status: unknown): Lot['status'] | null => {
  if (status === 'sold' || status === 'reserved' || status === 'available') return status;
  return null;
};

const fetchLotsFromApi = async (): Promise<ApiLotsRow[]> => {
  const res = await fetch('/api/lots');
  const jsonUnknown: unknown = await res.json().catch(() => null);
  const json = jsonUnknown && typeof jsonUnknown === 'object' ? (jsonUnknown as Record<string, unknown>) : null;
  const ok = Boolean(json && json['ok']);
  if (!res.ok || !ok) {
    const msg = typeof json?.['error'] === 'string' ? (json['error'] as string) : 'failed_to_fetch_lots';
    throw new Error(msg);
  }
  const dataUnknown = json?.['data'];
  return Array.isArray(dataUnknown) ? (dataUnknown as ApiLotsRow[]) : [];
};

export default function Home() {
  const { toast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [lastViewedLot, setLastViewedLot] = useState<Lot | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);

  // Initialize data
  useEffect(() => {
    let isCancelled = false;

    const applyApiStatusOverlay = (baseLots: Lot[], apiRows: ApiLotsRow[]): Lot[] => {
      const byId = new Map(apiRows.map((r) => [r.id, r] as const));
      const now = Date.now();

      return baseLots.map((lot) => {
        const row = byId.get(lot.id);
        const remoteStatus = normalizeStatus(row?.status);
        const reservedUntilMs = row?.reserved_until ? Date.parse(row.reserved_until) : Number.NaN;

        // Visual rule: reserved but already expired -> treat as available until backend cleanup arrives.
        const isExpiredReserved =
          remoteStatus === 'reserved' && Number.isFinite(reservedUntilMs) && reservedUntilMs > 0 && reservedUntilMs < now;

        const nextStatus: Lot['status'] =
          remoteStatus === 'sold' ? 'sold' : isExpiredReserved ? 'available' : remoteStatus ?? 'available';

        return {
          ...lot,
          status: nextStatus,
          reservedUntil: Number.isFinite(reservedUntilMs) ? reservedUntilMs : null,
          // Backend is the source-of-truth; locks from legacy local data should not drive reserved.
          lockedBy: null,
          lockedUntil: null,
        };
      });
    };

    const init = async () => {
      try {
        const baseLots = loadLots();

        if (isSupabaseConfigured()) {
          setIsHydrating(true);
          try {
            const apiRows = await fetchLotsFromApi();
            if (isCancelled) return;

            const hydratedLots = applyApiStatusOverlay(baseLots, apiRows);
            setLots(hydratedLots);
            saveLots(hydratedLots);
          } catch (err) {
            console.warn('Supabase initial hydration failed:', err);
            if (isCancelled) return;
            setLots(baseLots);
            saveLots(baseLots);
          } finally {
            if (!isCancelled) setIsHydrating(false);
          }
        } else {
          let storedLots = baseLots;
          storedLots = releaseExpiredLocks(storedLots);
          setLots(storedLots);
          saveLots(storedLots);
        }

        let storedSession = loadSession();
        if (!storedSession) {
          storedSession = createNewSession();
        }

        if (storedSession.isBlocked && storedSession.blockedUntil) {
          const now = Date.now();
          const remaining = storedSession.blockedUntil - now;
          if (remaining > BLOCK_DURATION) {
            storedSession = {
              ...storedSession,
              blockedUntil: now + BLOCK_DURATION,
            };
          }
        }

        if (storedSession && storedSession.isActive && !storedSession.isBlocked) {
          const now = Date.now();
          const remaining = storedSession.expiresAt - now;
          if (remaining <= 0) {
            storedSession = createNewSession();
          }
        }

        if (DISABLE_SESSION_EXPIRY) {
          storedSession = {
            ...storedSession,
            isActive: true,
            isBlocked: false,
            blockedUntil: null,
            expiresAt: Date.now() + 999999999 // Hack for visual consistency
          };
        }

        if (isCancelled) return;
        setSession(storedSession);
        saveSession(storedSession);
        setIsInitialized(true);
      } catch (error) {
        console.error("Initialization error:", error);
        // Fallback checks to prevent infinite loading
        if (!isCancelled) setIsInitialized(true);
      }
    };

    void init();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Save lots when they change
  useEffect(() => {
    if (isSupabaseConfigured()) return;
    if (isInitialized && lots.length > 0) {
      saveLots(lots);
    }
  }, [lots, isInitialized]);

  // Check and release expired locks every 30 seconds
  useEffect(() => {
    if (isSupabaseConfigured()) return;
    const interval = setInterval(() => {
      setLots(prevLots => {
        const updatedLots = releaseExpiredLocks(prevLots);
        // Only update if there were changes
        if (JSON.stringify(updatedLots) !== JSON.stringify(prevLots)) {
          return updatedLots;
        }
        return prevLots;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Poll /api/lots to refresh statuses in near real-time.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isCancelled = false;

    const syncLots = async () => {
      try {
        const apiRows = await fetchLotsFromApi();
        if (isCancelled) return;

        setLots((prevLots) => {
          const byId = new Map(apiRows.map((r) => [r.id, r] as const));
          const now = Date.now();

          return prevLots.map((lot) => {
            const row = byId.get(lot.id);
            const remoteStatus = normalizeStatus(row?.status);
            const reservedUntilMs = row?.reserved_until ? Date.parse(row.reserved_until) : Number.NaN;
            const isExpiredReserved =
              remoteStatus === 'reserved' &&
              Number.isFinite(reservedUntilMs) &&
              reservedUntilMs > 0 &&
              reservedUntilMs < now;

            const nextStatus: Lot['status'] =
              remoteStatus === 'sold' ? 'sold' : isExpiredReserved ? 'available' : remoteStatus ?? 'available';

            const nextReservedUntil = Number.isFinite(reservedUntilMs) ? reservedUntilMs : null;
            if (nextStatus === lot.status && nextReservedUntil === (lot.reservedUntil ?? null)) {
              return lot;
            }

            return {
              ...lot,
              status: nextStatus,
              reservedUntil: nextReservedUntil,
            };
          });
        });
      } catch (err) {
        console.warn('API lots polling failed:', err);
      }
    };

    syncLots();
    const interval = setInterval(syncLots, 12_000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Save session when it changes
  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  // Handle lot selection 
  const handleSelectLot = useCallback((lot: Lot) => {
    if (!session?.isActive || session.isBlocked) return;

    // No permitir selección si no está disponible (vendido/reservado/etc.)
    if (lot.status !== 'available') return;

    // Si el lote está bloqueado por otra sesión, no permitir abrir popup.
    // Si el lock es de esta sesión, sí permitir continuar.
    const isLockedForThisSession = isLotLocked(lot, session.id);
    if (lot.status === 'available' && isLockedForThisSession) return;
    setSelectedLot(lot);
    setLastViewedLot(lot);
  }, [session]);

  const handleUpdateLots = useCallback((updatedLots: Lot[]) => {
    setLots(updatedLots);
  }, []);

  const handleConfirmReservation = useCallback(() => {
    if (!selectedLot || !session) return;

    const updatedSession: UserSession = {
      ...session,
      currentReservation: selectedLot.id,
    };
    setSession(updatedSession);

    setLastViewedLot(selectedLot);
    setSelectedLot(null);
  }, [selectedLot, session]);

  const handleSessionExpire = useCallback(() => {
    if (!session) return;

    if (DISABLE_SESSION_EXPIRY) {
      const updatedSession: UserSession = {
        ...session,
        isActive: true,
        isBlocked: false,
        blockedUntil: null,
      };
      setSession(updatedSession);
      return;
    }

    const now = Date.now();
    const updatedSession: UserSession = {
      ...session,
      isActive: false,
      isBlocked: true,
      blockedUntil: now + BLOCK_DURATION,
    };
    setSession(updatedSession);
    setSelectedLot(null);
  }, [session]);

  const handleUnblock = useCallback(() => {
    const newSession = createNewSession();
    setSession(newSession);
    window.location.reload();
  }, []);

  const handleReserveFromDetails = useCallback(() => {
    if (!session?.isActive || session.isBlocked) return;

    const reservedLot = session.currentReservation
      ? lots.find(lot => lot.id === session.currentReservation) ?? null
      : null;

    const lotToReserve = lastViewedLot || reservedLot;
    if (!lotToReserve) return;
    if (lotToReserve.status !== 'available') return;

    setSelectedLot(lotToReserve);
  }, [lastViewedLot, lots, session]);

  if (!isInitialized || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Cargando disponibilidad...</div>
      </div>
    );
  }

  // Show waiting room if session is blocked
  if (!DISABLE_WAITING_ROOM && session.isBlocked && session.blockedUntil) {
    return <WaitingRoom blockedUntil={session.blockedUntil} onUnblock={handleUnblock} />;
  }

  const reservedLot = session.currentReservation
    ? lots.find(lot => lot.id === session.currentReservation)
    : null;

  const selectedLotFromState = selectedLot ? lots.find(l => l.id === selectedLot.id) ?? selectedLot : null;
  const selectedLotIsTemporarilyLocked = Boolean(
    selectedLotFromState && isLotLocked(selectedLotFromState, session.id)
  );

  return (
    <div className="min-h-screen bg-background relative z-10">
      <LegalBasesPopup />
      <LegalBasesModal />
      {/* Header */}
      <Header projectName="Lomas Del Mar" />

      {/* Countdown Banner */}
      {!DISABLE_COUNTDOWN && (
        <CountdownBanner
          expiresAt={session.expiresAt}
          onExpire={handleSessionExpire}
          isBlurred={selectedLot !== null}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* User Status */}
        <UserStatusMessage session={session} />

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">¡INCLUYE TODO!</p>
              <p className="text-xs text-muted-foreground">Infraestructura y servicios incluidos en tu compra</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Droplets className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Agua certificada por la Seremi de salud</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Zap className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Luz Eléctrica</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Lock className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Portón automático</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Route className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Calles compactadas con maicillo</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Footprints className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Veredas y Solereas</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Sun className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Luminarias solares</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <Trees className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Áreas verdes</span>
            </div>
            <div className="group flex items-start gap-3 rounded-lg bg-background/60 p-3 border border-border/60 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1 hover:shadow-md">
              <ScrollText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm text-foreground">Rol individual</span>
            </div>
          </div>
        </div>

        {/* Investment Details */}
        <InvestmentDetails
          selectedLot={lastViewedLot || reservedLot || null}
          onReserve={handleReserveFromDetails}
          isSessionActive={session.isActive}
        />

        {/* Progress Bar */}
        <ProgressBar lots={lots} />

        <div className="w-full">
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <img
              src="/plano-banner.png"
              alt="Vista del proyecto"
              loading="lazy"
              className="h-auto w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.02] group-hover:-translate-y-1"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
          <div className="mt-4 flex justify-center">
            <a
              href="https://maps.app.goo.gl/pmYqgPqXJrBghfRR6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="h-auto rounded-full px-6 py-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ver ubicación en Google Maps
                </span>
              </Button>
            </a>
          </div>
        </div>

        {/* Lot Grid - Full width */}

        {/* === INICIO BLOQUE MAPA === */}
        {/* 1. Plano Esquema (Principal para compra) */}
        <div className="mb-12">
          <LotGrid
            lots={lots}
            onSelectLot={handleSelectLot}
            onUpdateLots={handleUpdateLots}
            selectedLotId={selectedLot?.id ?? null}
            userReservation={session?.currentReservation ?? null}
            isSessionActive={session?.isActive ?? false}
            isHydrating={isHydrating}
          />
        </div>

        {/* 2. Vista Satelital (Secundaria) */}
        <div className="flex flex-col items-center justify-center w-full max-w-[1248px] mx-auto px-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <MapIcon className="w-6 h-6 text-primary" />
              Explorador Satelital
            </h2>
            <p className="text-muted-foreground">Visualiza la ubicación real de tu terreno con tecnología GPS</p>
          </div>

          <MapLotViewer
            lots={lots}
            onSelectLot={handleSelectLot}
            selectedLotId={selectedLot?.id ?? null}
          />
        </div>
        {/* === FIN BLOQUE MAPA === */}
      </main>

      {/* Footer */}
      <Footer />

      {/* Admin Login */}
      <AdminLogin />

      {/* Unified Lot Reservation Popup */}
      <LotReservationPopup
        lot={selectedLotFromState}
        isOpen={selectedLot !== null}
        onClose={() => setSelectedLot(null)}
        onConfirm={handleConfirmReservation}
        isTemporarilyLocked={selectedLotIsTemporarilyLocked}
        sessionId={session.id}
      />
    </div>
  );
}
