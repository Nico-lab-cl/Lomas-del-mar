export type LotStatus = 'available' | 'reserved' | 'sold' | 'selected';

// Dimensiones del lote (en metros)
export interface LotDimensions {
  front_m: number | null;      // Frente
  depth_m: number | null;      // Fondo
  width_m: number | null;      // Ancho
  other_side_m: number | null; // Otro lado (para irregulares)
  notes: string | null;        // Notas adicionales
}

export interface Lot {
  id: number;
  number: string;
  status: LotStatus;
  area: number | null; // in m²
  pricePerM2: number | null;
  x: number; // percentage position
  y: number; // percentage position
  size?: number; // visual size multiplier (default 1)
  // Nuevos campos opcionales
  stage?: number; // Etapa 1..4
  stageLotNumber?: number; // Lote dentro de su etapa
  displayStage?: number; // Etapa visible en UI (considera overrides)
  displayLabel?: string; // Nombre visible en UI/plano (considera overrides y renumeración)
  totalPrice?: number | null; // Precio total del lote (null = consultar)
  forceSold?: boolean; // Si true, el lote debe mostrarse como vendido
  dimensions?: LotDimensions | null; // Dimensiones declaradas
  // Campos para bloqueo temporal
  lockedBy?: string | null; // session id that locked this lot
  lockedUntil?: number | null; // timestamp when lock expires

  reservedUntil?: number | null; // timestamp when reservation expires (from backend)
}

export interface UserSession {
  id: string;
  startTime: number;
  expiresAt: number;
  isActive: boolean;
  currentReservation: number | null; // lot id
  isBlocked: boolean;
  blockedUntil: number | null;
}

export interface InvestmentDetails {
  lot: Lot | null;
  totalPrice: number;
  downPayment: number;
  financingAvailable: boolean;
}
