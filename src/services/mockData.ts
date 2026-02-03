import { Lot, LotStatus, UserSession } from '@/types';
import { getLotSpec, calculateLotPricing } from './lotSpecs';
import layoutPositions from './layoutPositions.json';
import defaultMapOverrides from './defaultMapOverrides.json';

// CONTRATO DE STORAGE - NO MODIFICAR ESTAS KEYS SIN INSTRUCCIÓN EXPLÍCITA
const STORAGE_KEY = 'alimin_lomas_del_mar_lots_v5';
const SESSION_KEY = 'alimin_lomas_del_mar_session_v2';
const POSITIONS_KEY = 'alimin_lomas_del_mar_positions_v1';
const POSITIONS_VERSION_KEY = 'alimin_lomas_del_mar_positions_version_v1';
const MAP_OVERRIDES_KEY = 'lomas_lot_map_overrides_v3';

// Incrementar cuando publiques un nuevo layout oficial para forzar que todos vuelvan al layout del repo.
const LAYOUT_VERSION = 8;

// Modo admin/operación: fuerza todo el plano a DISPONIBLE (sin vendidos ni reservados)
const FORCE_ALL_AVAILABLE = false;

// Keys legacy para migración
const LEGACY_KEYS = ['alimin_lomas_del_mar_lots_v1', 'alimin_lomas_del_mar_lots'];

// Re-export pricing functions from lotSpecs for convenience
export { PRICING_RULES, calculateLotPricing } from './lotSpecs';

// Oferta price is the same for all lots
export const OFFER_PRICE = 50; // $50 CLP (Valor DE PRUEBA)

// Tipo para el mapa de posiciones por id
type PositionsMap = Record<string, { x: number; y: number; size?: number }>;

const resolveDefaultPositions = (): PositionsMap => {
  const raw = layoutPositions as unknown as Record<string, unknown>;
  const positions = raw && typeof raw === 'object' && 'positions' in raw ? (raw.positions as unknown) : raw;
  return positions as PositionsMap;
};

// POSICIONES PREDEFINIDAS - Layout oficial versionado en el repo
// CONTRATO: Estas posiciones son el fallback si no hay nada en POSITIONS_KEY
const DEFAULT_POSITIONS: PositionsMap = resolveDefaultPositions();

const lotCountError: string | null = null;

export const getLotCountError = (): string | null => lotCountError;

export type MapOverrides = Record<string, { label?: string; stage?: number }>;

export const getDefaultMapOverrides = (): MapOverrides => {
  const raw = defaultMapOverrides as unknown as MapOverrides;
  const next = { ...(raw ?? {}) };
  if (Object.prototype.hasOwnProperty.call(next, '200')) {
    delete next['200'];
  }
  return next;
};

const sanitizeOverrides = (overrides: MapOverrides): MapOverrides => {
  const next: MapOverrides = { ...(overrides ?? {}) };

  if (Object.prototype.hasOwnProperty.call(next, '200')) {
    delete next['200'];
  }

  // Proteger mappings críticos (201–203) para que nunca se pierdan.
  const defaults = getDefaultMapOverrides();
  for (const k of ['201', '202', '203'] as const) {
    if (!Object.prototype.hasOwnProperty.call(next, k)) {
      const d = defaults[k];
      if (d) next[k] = { ...d };
    }
  }

  return next;
};

export const loadMapOverrides = (): MapOverrides => {
  const defaults = getDefaultMapOverrides();
  try {
    const raw = localStorage.getItem(MAP_OVERRIDES_KEY) ?? localStorage.getItem('lomas_lot_map_overrides_v2');
    if (!raw) return sanitizeOverrides(defaults);

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return sanitizeOverrides(defaults);

    // Contrato: siempre partir desde default y el usuario pisa por encima.
    return sanitizeOverrides({ ...defaults, ...(parsed as MapOverrides) });
  } catch {
    return sanitizeOverrides(defaults);
  }
};

export const saveMapOverrides = (overrides: MapOverrides): void => {
  try {
    const defaults = getDefaultMapOverrides();
    const cleaned = sanitizeOverrides(overrides);

    // Guardar SOLO overrides del usuario (diff vs defaults).
    const userOnly: MapOverrides = {};
    for (const [k, v] of Object.entries(cleaned)) {
      const d = defaults[k];
      const sameLabel = (d?.label ?? undefined) === (v?.label ?? undefined);
      const sameStage = (d?.stage ?? undefined) === (v?.stage ?? undefined);
      const isSameAsDefault = Boolean(d) && sameLabel && sameStage;
      if (!isSameAsDefault) {
        userOnly[k] = v;
      }
    }

    localStorage.setItem(MAP_OVERRIDES_KEY, JSON.stringify(userOnly));
  } catch (e) {
    console.error('Error saving map overrides to localStorage:', e);
  }
};

export const resetMapOverridesToDefault = (): MapOverrides => {
  try {
    localStorage.removeItem(MAP_OVERRIDES_KEY);
    localStorage.removeItem('lomas_lot_map_overrides_v2');
  } catch {
    // ignore
  }
  return getDefaultMapOverrides();
};
export const getDefaultPositions = (): Record<string, { x: number; y: number; size?: number }> => {
  return { ...DEFAULT_POSITIONS };
};

// ====== FUNCIONES DE POSICIONES - CONTRATO INMUTABLE ======

/**
 * Aplica posiciones guardadas por id sobre los lotes.
 * NUNCA recalcula x/y - solo aplica lo que existe en el mapa.
 */
export const applyPositionsById = (lots: Lot[], positions: PositionsMap): Lot[] => {
  return lots.map(lot => {
    const savedPosition = positions[String(lot.id)];
    if (savedPosition) {
      return {
        ...lot,
        x: savedPosition.x,
        y: savedPosition.y,
        size: savedPosition.size ?? lot.size,
      };
    }
    return lot;
  });
};

/**
 * Extrae posiciones de los lotes para guardar en POSITIONS_KEY.
 */
export const extractPositionsFromLots = (lots: Lot[]): PositionsMap => {
  const positions: PositionsMap = {};
  lots.forEach(lot => {
    positions[String(lot.id)] = {
      x: lot.x,
      y: lot.y,
      size: lot.size,
    };
  });
  return positions;
};

/**
 * Guarda posiciones en POSITIONS_KEY.
 */
export const savePositions = (positions: PositionsMap): void => {
  try {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
    localStorage.setItem(POSITIONS_VERSION_KEY, String(LAYOUT_VERSION));
  } catch (e) {
    console.error('Error saving positions to localStorage:', e);
  }
};

/**
 * Carga posiciones desde POSITIONS_KEY.
 */
export const loadPositions = (): PositionsMap => {
  try {
    const storedVersion = localStorage.getItem(POSITIONS_VERSION_KEY);
    if (storedVersion !== String(LAYOUT_VERSION)) {
      return { ...DEFAULT_POSITIONS };
    }
    const stored = localStorage.getItem(POSITIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Si hay posiciones guardadas, usarlas
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading positions from localStorage:', e);
  }
  // CONTRATO: Si no hay posiciones guardadas, usar las predefinidas
  return { ...DEFAULT_POSITIONS };
};

// ====== FIN FUNCIONES DE POSICIONES ======

// Generate initial lot positions in a grid pattern
// INTEGRA: specs de área/dimensiones, reglas de precios, regla de vendidos por área>390
const STAGE_LIMITS: Record<number, number> = {
  1: 47,
  2: 47,
  3: 43,
  4: 65,
};

const DISABLE_STAGE_QUOTA_FILTER = true;

const applyStageQuotaFilter = (lots: Lot[]): Lot[] => {
  if (DISABLE_STAGE_QUOTA_FILTER) return lots;

  const counters = new Map<number, number>();
  const sorted = lots.slice().sort((a, b) => a.id - b.id);

  return sorted.filter((lot) => {
    const stage = lot.stage ?? 1;
    const limit = STAGE_LIMITS[stage];
    if (!limit) return false;

    const next = (counters.get(stage) ?? 0) + 1;
    if (next > limit) return false;
    counters.set(stage, next);
    return true;
  });
};

const generateInitialLots = (): Lot[] => {
  const lots: Lot[] = [];
  const cols = 15;

  // Nota: si FORCE_ALL_AVAILABLE está activo, no usar estados predefinidos.

  // Definir los rangos de lotes: 1-49, 50-199 y 201-203 (el 200 se ignora)
  const lotNumbers = [
    ...Array.from({ length: 49 }, (_, i) => i + 1),      // 1-49
    ...Array.from({ length: 150 }, (_, i) => i + 50),    // 50-199
    201,
    202,
    203,
  ];

  const totalLots = lotNumbers.length; // 202 lotes
  const rows = Math.ceil(totalLots / cols);

  lotNumbers.forEach((lotNum, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Obtener especificaciones del lote
    const spec = getLotSpec(lotNum);

    const area = spec ? spec.area_m2 : 200;
    const stage = spec?.stage ?? 1;
    const stageLotNumber = spec?.stageLotNumber;
    const forceSold = spec?.forceSold ?? false;
    const dimensions = spec?.dimensions ?? null;

    // Calcular precios según el área
    const pricing = calculateLotPricing(area);

    // Determinar estado del lote (fuente de verdad final: Supabase/DB, pero inicializar con forceSold)
    const status: LotStatus = (forceSold && !FORCE_ALL_AVAILABLE) ? 'sold' : 'available';

    lots.push({
      id: lotNum,
      number: stageLotNumber ? String(stageLotNumber) : String(lotNum),
      status: FORCE_ALL_AVAILABLE ? 'available' : status,
      area,
      pricePerM2: pricing.pricePerM2,
      x: 2 + (col / cols) * 96,
      y: 5 + (row / rows) * 90,
      // Nuevos campos
      stage,
      stageLotNumber,
      forceSold,
      totalPrice: pricing.totalPrice,
      dimensions,
    });
  });

  return applyStageQuotaFilter(lots);
};

/**
 * Intenta cargar lotes desde keys legacy para migración.
 */
const loadFromLegacyKeys = (): Lot[] | null => {
  for (const key of LEGACY_KEYS) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        console.log(`Migrating lots from legacy key: ${key}`);
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`Error loading from legacy key ${key}:`, e);
    }
  }
  return null;
};

/**
 * Carga lotes aplicando posiciones guardadas por id.
 * FLUJO:
 * 1. Intenta cargar lotes de STORAGE_KEY
 * 2. Si no existe, intenta keys legacy
 * 3. Si no existe, genera defaults
 * 4. SIEMPRE aplica posiciones desde POSITIONS_KEY por id
 * 5. Filtra lote 200 si existe
 */
export const loadLots = (): Lot[] => {
  let lots: Lot[] | null = null;
  const mapOverrides = loadMapOverrides();

  // 1. Intentar cargar de STORAGE_KEY
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      lots = JSON.parse(stored);
      // SAFETY FIX: Filter out invalid timestamp IDs (e.g. from MapBuilder) that cause backend INT4 overflow
      if (lots) {
        lots = lots.filter(l => l.id < 1000000);
      }
    }
  } catch (e) {
    console.error('Error loading lots from localStorage:', e);
  }

  // 2. Si no hay, intentar keys legacy
  if (!lots) {
    lots = loadFromLegacyKeys();
  }

  // 3. Si no hay, generar defaults
  if (!lots) {
    lots = generateInitialLots();
  }

  // Si antes se guardaron lotes filtrados en localStorage, al desactivar el filtro
  // debemos completar los faltantes para que aparezcan en pantalla (modo edición).
  if (DISABLE_STAGE_QUOTA_FILTER) {
    const generated = generateInitialLots();
    const byId = new Map<number, Lot>(lots.map((l) => [l.id, l]));
    for (const g of generated) {
      if (!byId.has(g.id)) {
        lots.push(g);
      }
    }
  }

  // Sincronizar siempre specs (etapa/área/dimensiones) desde fuente de verdad
  // para que cambios en lotSpecs se reflejen aunque existan datos en localStorage.
  lots = lots.map((lot) => {
    const spec = getLotSpec(lot.id);
    const area = spec ? spec.area_m2 : lot.area;
    const stage = spec?.stage ?? lot.stage ?? 1;
    const stageLotNumber = spec?.stageLotNumber ?? lot.stageLotNumber;
    const forceSold = spec?.forceSold ?? lot.forceSold;
    const dimensions = spec?.dimensions ?? lot.dimensions ?? null;

    const pricing = calculateLotPricing(area);

    // FIX: Respect forceSold
    const currentStatus = (lot.status === 'sold') ? 'sold' : lot.status;
    const finalStatus = (forceSold && !FORCE_ALL_AVAILABLE) ? 'sold' : currentStatus;

    return {
      ...lot,
      area,
      stage,
      stageLotNumber,
      // Update number if stageLotNumber is available to fix display
      number: stageLotNumber ? String(stageLotNumber) : lot.number,
      forceSold,
      dimensions,
      pricePerM2: pricing.pricePerM2,
      totalPrice: pricing.totalPrice,
      status: FORCE_ALL_AVAILABLE ? 'available' : finalStatus,
      lockedBy: null,
      lockedUntil: null,
    };
  });

  if (FORCE_ALL_AVAILABLE) {
    lots = lots.map((lot) => ({
      ...lot,
      status: 'available',
      lockedBy: null,
      lockedUntil: null,
    }));
  }

  // Temporarily disable stage quota filtering
  // lots = applyStageQuotaFilter(lots);
  lots = applyStageQuotaFilter(lots);

  // 4. Aplicar posiciones guardadas por id (CONTRATO: siempre aplicar)
  const positions = loadPositions();
  if (Object.keys(positions).length > 0) {
    lots = applyPositionsById(lots, positions);
  }

  // 5. Filtrar lote 200 si existe
  lots = lots.filter((lot) => lot.id !== 200);

  // Calcular displayStage/displayLabel para que toda la UI coincida con el plano
  // (considera overrides de etapa y nombre).
  {
    lots = lots.map((lot) => {
      const override = mapOverrides[String(lot.id)];
      const displayStage = (override?.stage ?? lot.stage ?? 1);
      const computedLabel = lot.number;
      const displayLabel = override?.label && String(override.label).trim().length
        ? String(override.label).trim()
        : computedLabel;

      return {
        ...lot,
        displayStage,
        displayLabel,
      };
    });
  }

  // Guardar inmediatamente para evitar regeneración futura
  saveLots(lots);

  return lots;
};

/**
 * Guarda lotes Y sincroniza posiciones a POSITIONS_KEY.
 * CONTRATO: Siempre sincronizar ambos storages.
 */
export const saveLots = (lots: Lot[]): void => {
  try {
    // Guardar lotes completos
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lots));

    // Sincronizar posiciones a POSITIONS_KEY
    const positions = extractPositionsFromLots(lots);
    savePositions(positions);
  } catch (e) {
    console.error('Error saving lots to localStorage:', e);
  }
};

export const resetLots = (): Lot[] => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(POSITIONS_KEY);
  localStorage.removeItem(POSITIONS_VERSION_KEY);
  // Guardar posiciones predefinidas al resetear
  savePositions({ ...DEFAULT_POSITIONS });
  const lots = generateInitialLots();
  // Aplicar posiciones predefinidas
  return applyPositionsById(lots, DEFAULT_POSITIONS);
};

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createNewSession = (): UserSession => {
  const now = Date.now();
  const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

  return {
    id: generateSessionId(),
    startTime: now,
    expiresAt: now + SESSION_DURATION,
    isActive: true,
    currentReservation: null,
    isBlocked: false,
    blockedUntil: null,
  };
};

export const loadSession = (): UserSession | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored) as UserSession;
      const now = Date.now();

      // Check if blocked and block period expired
      if (session.isBlocked && session.blockedUntil && now >= session.blockedUntil) {
        // Reset block and create new session
        return createNewSession();
      }

      // Fix: Invalidate legacy sessions that are too long (e.g. created when duration was 24h)
      // Current duration is 10 min. If remaining time is significantly more than 10 min (e.g. > 15 min), reset.
      const remaining = session.expiresAt - now;
      const MAX_VALID_DURATION = 15 * 60 * 1000; // 15 minutes safety buffer

      if (remaining > MAX_VALID_DURATION) {
        console.log('Legacy long session detected, resetting...');
        return createNewSession();
      }

      return session;
    }
  } catch (e) {
    console.error('Error loading session from localStorage:', e);
  }
  return null;
};

export const saveSession = (session: UserSession): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving session to localStorage:', e);
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// ====== FUNCIONES DE BLOQUEO TEMPORAL DE LOTES ======

const LOCK_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Bloquea un lote temporalmente para una sesión específica
 */
export const lockLot = (lots: Lot[], lotId: number, sessionId: string): Lot[] => {
  const now = Date.now();
  return lots.map(lot => {
    if (lot.id === lotId && lot.status === 'available') {
      const hasActiveLock = Boolean(lot.lockedBy && lot.lockedUntil && now < lot.lockedUntil);
      if (hasActiveLock && lot.lockedBy !== sessionId) {
        return lot;
      }
      return {
        ...lot,
        lockedBy: sessionId,
        lockedUntil: now + LOCK_DURATION,
      };
    }
    return lot;
  });
};

/**
 * Libera un lote bloqueado
 */
export const unlockLot = (lots: Lot[], lotId: number): Lot[] => {
  return lots.map(lot => {
    if (lot.id === lotId) {
      return {
        ...lot,
        lockedBy: null,
        lockedUntil: null,
      };
    }
    return lot;
  });
};

/**
 * Verifica si un lote está bloqueado y si el bloqueo sigue vigente
 */
export const isLotLocked = (lot: Lot, sessionId?: string): boolean => {
  if (!lot.lockedBy || !lot.lockedUntil) return false;

  const now = Date.now();
  // Si el bloqueo expiró, no está bloqueado
  if (now >= lot.lockedUntil) return false;

  // Si hay sessionId, verificar si es el dueño del bloqueo
  if (sessionId && lot.lockedBy === sessionId) return false;

  return true;
};

/**
 * Libera todos los lotes cuyo bloqueo ha expirado
 */
export const releaseExpiredLocks = (lots: Lot[]): Lot[] => {
  const now = Date.now();
  return lots.map(lot => {
    if (lot.lockedBy && lot.lockedUntil && now >= lot.lockedUntil) {
      return {
        ...lot,
        lockedBy: null,
        lockedUntil: null,
      };
    }
    return lot;
  });
};

/**
 * Marca un lote como reservado permanentemente (después del pago)
 */
export const markLotAsReserved = (lots: Lot[], lotId: number): Lot[] => {
  return lots.map(lot => {
    if (lot.id === lotId) {
      return {
        ...lot,
        status: 'reserved',
        lockedBy: null,
        lockedUntil: null,
      };
    }
    return lot;
  });
};
