"use client";

import dynamic from 'next/dynamic';
import { Map as MapIcon, HelpCircle } from 'lucide-react';

const MapLotViewer = dynamic(() => import('@/components/MapLotViewer'), {
  ssr: false,
  loading: () => <div className="h-[60vh] md:h-[85vh] w-full bg-muted/10 animate-pulse md:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 border border-border/50">
    <div className="p-4 rounded-full bg-muted/20">
      <MapIcon className="w-8 h-8 text-muted-foreground/50 animate-bounce" />
    </div>
    <span className="text-muted-foreground font-medium">Cargando Mapa Satelital...</span>
  </div>
});

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { LotReservationPopup } from '@/components/LotReservationPopup';
import { PlanoModal } from '@/components/PlanoModal';
import { PurchaseTutorial } from '@/components/PurchaseTutorial';

import { Hero } from '@/components/Hero';
import { TrustBanner } from '@/components/TrustBanner';
import { InvestmentThesis } from '@/components/InvestmentThesis';
import { VideoGallery } from '@/components/VideoGallery';
import { ProjectFeatures } from '@/components/ProjectFeatures';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';
import { LegalDocumentsPopup } from '@/components/LegalDocumentsPopup';
import { Footer } from '@/components/Footer';
import { AdminLogin } from '@/components/AdminLogin';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured, tryLockLot } from '@/services/lotLocksSupabase';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, Droplets, Zap, Lock, Route, Footprints, Sun, Trees, ScrollText, Ruler, Calculator } from 'lucide-react';
import Link from 'next/link';

const BLOCK_DURATION = 60 * 1000; // 60 seconds
const DISABLE_WAITING_ROOM = false;
const DISABLE_COUNTDOWN = false;
const DISABLE_SESSION_EXPIRY = false;

type ApiLotsRow = {
  id: number;
  number: string;
  stage: number;
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
  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  // Refs for scroll tracking and navigation
  const videoGalleryRef = useRef<HTMLDivElement>(null);

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

        // HARDCODE FIX: Ensure Stage 4 lots are correctly identified regardless of DB/Cache state
        const isStage4 = lot.id >= 132 && lot.id <= 196;
        const finalStage = isStage4 ? 4 : (row?.stage ?? lot.stage);
        const finalDisplayStage = isStage4 ? 4 : (row?.stage ?? lot.displayStage);

        return {
          ...lot,
          // Sync Stage and Number from DB if available (Source of Truth)
          stage: finalStage,
          displayStage: finalDisplayStage, // FORCE DISPLAY TO MATCH DB
          number: row?.number ?? lot.number,
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

  // CRITICAL FIX: Add polling to sync lots data every 30 seconds for real-time updates
  // Removed defective polling effect that was overwriting state with raw DB data

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

            // HARDCODE FIX: Ensure Stage 4 lots are correctly identified regardless of DB/Cache state
            const isStage4 = lot.id >= 132 && lot.id <= 196;
            const finalStage = isStage4 ? 4 : (row?.stage ?? lot.stage);
            const finalDisplayStage = isStage4 ? 4 : (row?.stage ?? lot.displayStage);

            return {
              ...lot,
              // Sync Stage and Number from DB
              stage: finalStage,
              displayStage: finalDisplayStage, // FORCE DISPLAY TO MATCH DB
              number: row?.number ?? lot.number,
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

  // Detect scroll position to show countdown banner after VideoGallery
  useEffect(() => {
    const handleScroll = () => {
      if (videoGalleryRef.current) {
        const rect = videoGalleryRef.current.getBoundingClientRect();
        // Show countdown when VideoGallery has scrolled past viewport
        const hasScrolledPastGallery = rect.bottom < window.innerHeight / 2;
        setShowCountdown(hasScrolledPastGallery);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to map section
  const mapSectionRef = useRef<HTMLElement>(null);
  const mobileMapSectionRef = useRef<HTMLElement>(null);

  const scrollToMap = useCallback(() => {
    // If on mobile (check width < 768), scroll to mobile map. Else, desktop map.
    if (window.innerWidth < 768 && mobileMapSectionRef.current) {
      mobileMapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Auto-open sidebar when map comes into view
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if element is already in view on mount (e.g. refresh with scroll)
    const checkVisibility = () => {
      if (mapSectionRef.current) {
        const rect = mapSectionRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        if (isVisible) {
          setIsSidebarOpen(true);
        }
      }
    };
    checkVisibility();

    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger if any part is visible (isIntersecting)
        if (entries[0].isIntersecting) {
          setIsSidebarOpen(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" } // Trigger slightly before it's fully leaving the bottom, but reliably when entering
    );

    if (mapSectionRef.current) {
      observer.observe(mapSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
      <LegalDocumentsPopup />
      {/* Header */}
      <Header projectName="Lomas Del Mar" />

      {/* Hero Section - First Visual Impact */}
      <Hero onExploreClick={scrollToMap} />

      {/* Trust Banner - Key Value Propositions */}
      <TrustBanner />

      {/* Video Gallery */}
      <div ref={videoGalleryRef}>
        <VideoGallery onCtaClick={scrollToMap} />
      </div>

      {/* MOBILE MAP SECTION - VISIBLE ONLY ON MOBILE */}
      <section ref={mobileMapSectionRef} className="w-full pt-16 pb-24 bg-muted/5 animate-in fade-in duration-1000 block md:hidden">
        <div className="container mx-auto px-4 text-center mb-10 overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-6 mb-6">
            <img src="/logo.png" alt="Lomas del Mar" className="h-16 w-auto object-contain drop-shadow-sm" />
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Adquiere tu terreno ahora en <span className="text-primary tracking-tighter">Lomas del Mar</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
            Visualiza la ubicación real y el entorno de tu futuro terreno
          </p>
        </div>

        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-col gap-8">
            {/* Map Viewer Mobile */}
            <div className="w-full min-w-0">
              <MapLotViewer
                lots={lots}
                onSelectLot={handleSelectLot}
                selectedLotId={selectedLot?.id ?? null}
              />
            </div>
          </div>
        </div>
      </section>


      {/* Countdown Banner - Sticky, appears after VideoGallery */}
      {!DISABLE_COUNTDOWN && showCountdown && (
        <div className="sticky z-40 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ top: 'var(--header-height)' }}>
          <CountdownBanner
            expiresAt={session.expiresAt}
            onExpire={handleSessionExpire}
            isBlurred={selectedLot !== null}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="w-full py-6 space-y-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Project Features - Premium Grid */}
          <ProjectFeatures />


          {/* Progress Bar */}
          <ProgressBar lots={lots} />
        </div>



        {/* 2. Vista Satelital (Secundaria) - Immersive Full Bleed - DESKTOP ONLY */}
        <section ref={mapSectionRef} className="w-full pt-16 pb-24 bg-muted/5 animate-in fade-in duration-1000 hidden md:block">
          <div className="container mx-auto px-4 text-center mb-10 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
              <img
                src="/logo.png"
                alt="Lomas del Mar"
                className="h-16 w-auto object-contain drop-shadow-sm"
              />
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                Adquiere tu terreno ahora en <span className="text-primary tracking-tighter">Lomas del Mar</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto md:text-xl font-medium">
              Visualiza la ubicación real y el entorno de tu futuro terreno
            </p>
          </div>

          <div className="w-full max-w-[1920px] mx-auto md:px-8">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Info Sidebar - Shows FIRST on mobile, SECOND (right side) on XL */}
              <aside className="w-full xl:w-96 xl:order-2 space-y-6">
                {/* Manual de Compra */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    ¿Cómo comprar?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Aprende cómo reservar y comprar tu terreno en simples pasos.
                  </p>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('alimin:open-purchase-tutorial'));
                      }
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Ver guía de compra
                  </button>
                </div>

                {/* Botón Plano Esquemático */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-primary" />
                    Plano Esquemático
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualiza el plano general del proyecto con la numeración de todos los lotes.
                  </p>
                  <button
                    onClick={() => {
                      const mapViewer = document.querySelector('[data-map-viewer]');
                      if (mapViewer) {
                        const event = new CustomEvent('open-schematic');
                        mapViewer.dispatchEvent(event);
                      }
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Ver plano general
                  </button>
                </div>

                {/* Simbología de Etapas */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Simbología</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm bg-primary"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Área Verde</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm bg-red-500"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Lotes no disponibles</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm bg-blue-500"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Equip. Sanitario</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm bg-yellow-500"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Estacionamiento visitas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm bg-purple-500"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Sala de equip.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leyenda de Estados */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Estado de los lotes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary border-2 border-[#2A454A]"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Disponible</p>
                        <p className="text-xs text-gray-600">Listo para reservar</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-700"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Reservado</p>
                        <p className="text-xs text-gray-600">En proceso de compra</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-700"></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Vendido</p>
                        <p className="text-xs text-gray-600">No disponible</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Maps */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Ubicación</h3>
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3344.8!2d-71.5!3d-33.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDAyJzAwLjAiUyA3McKwMzAnMDAuMCJX!5e0!3m2!1ses!2scl!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación Lomas del Mar"
                    ></iframe>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Lomas del Mar, Región de Valparaíso
                  </p>
                </div>

                {/* Medios de Pago */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Medios de pago</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border">
                      <img
                        src="/Diseño sin título (2).svg"
                        alt="Transbank Webpay"
                        className="h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-600 font-semibold">Webpay</span>';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border">
                      <img
                        src="/Diseño sin título (3).svg"
                        alt="Webpay Plus"
                        className="h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-600 font-semibold">Webpay Plus</span>';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border">
                      <img
                        src="/visa-credit-card-logo-payment-mastercard-usa-visa.jpg"
                        alt="Visa"
                        className="h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-600 font-semibold">Visa</span>';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border">
                      <img
                        src="/Mastercard-logo.svg"
                        alt="Mastercard"
                        className="h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-600 font-semibold">Mastercard</span>';
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-4 text-center">
                    Pago seguro con Webpay Plus
                  </p>
                </div>
              </aside>

              {/* Map Viewer - Shows SECOND on mobile, FIRST (left side) on XL */}
              <div className="w-full flex-1 min-w-0 xl:order-1">
                <MapLotViewer
                  lots={lots}
                  onSelectLot={handleSelectLot}
                  selectedLotId={selectedLot?.id ?? null}
                />
              </div>

            </div>

          </div>
        </section>

        <div className="container mx-auto px-4 pb-16">
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <img
              src="/plano-banner.png"
              alt="Vista del proyecto"
              loading="lazy"
              className="h-auto w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.02] group-hover:-translate-y-1"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </div>
      </main>

      {/* Investment Thesis Section */}
      <InvestmentThesis />

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

      {/* Plano Modal */}
      <PlanoModal
        isOpen={isPlanoModalOpen}
        onClose={() => setIsPlanoModalOpen(false)}
        lots={lots}
        onSelectLot={handleSelectLot}
        onUpdateLots={handleUpdateLots}
        selectedLotId={selectedLot?.id ?? null}
        userReservation={session?.currentReservation ?? null}
        isSessionActive={session?.isActive ?? false}
      />

      {/* Purchase Tutorial Modal */}
      <PurchaseTutorial />
    </div>
  );
}
