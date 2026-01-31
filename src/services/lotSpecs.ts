import { LotDimensions } from '@/types';

// ====== ESPECIFICACIONES DE LOTES - FUENTE DE VERDAD ======
// NO modificar sin instrucción explícita del usuario

export interface LotSpec {
  stage: number;
  stageLotNumber: number;
  area_m2: number | null;
  forceSold: boolean;
  dimensions: LotDimensions;
}

export const getStageLotSpec = (stage: number, stageLotNumber: number): LotSpec | null => {
  if (!Number.isFinite(stageLotNumber) || stageLotNumber < 1) return null;

  const dimensions = NULL_DIMENSIONS;
  let area_m2: number | null = null;
  let forceSold = false;

  if (stage === 1) {
    if (stageLotNumber === 1) {
      area_m2 = 326.23;
      forceSold = true;
    } else if (stageLotNumber >= 2 && stageLotNumber <= 27) {
      area_m2 = 200;
    } else if (stageLotNumber === 28) {
      area_m2 = 344.2;
    } else if (stageLotNumber >= 29 && stageLotNumber <= 46) {
      area_m2 = 390;
    } else if (stageLotNumber === 47) {
      area_m2 = 236.97;
    } else {
      return null;
    }

    if ([1, 2, 5, 6, 8, 28, 42, 43, 46].includes(stageLotNumber)) {
      forceSold = true;
    }
  } else if (stage === 2) {
    if (stageLotNumber === 1) {
      area_m2 = 374.13;
    } else if (stageLotNumber >= 2 && stageLotNumber <= 27) {
      area_m2 = 200;
    } else if (stageLotNumber === 28) {
      area_m2 = 211.72;
    } else if (stageLotNumber === 29) {
      area_m2 = null;
      forceSold = true;
    } else if (stageLotNumber === 30) {
      area_m2 = 361.08;
    } else if (stageLotNumber >= 31 && stageLotNumber <= 46) {
      area_m2 = 390;
    } else if (stageLotNumber === 47) {
      area_m2 = 303.52;
      forceSold = true;
    } else {
      return null;
    }
  } else if (stage === 3) {
    if (stageLotNumber >= 1 && stageLotNumber <= 25) {
      area_m2 = 200;
    } else if (stageLotNumber === 26 || stageLotNumber === 27) {
      area_m2 = null;
      forceSold = true;
    } else if (stageLotNumber >= 28 && stageLotNumber <= 42) {
      area_m2 = 390;
    } else if (stageLotNumber === 43) {
      area_m2 = null;
      forceSold = true;
    } else {
      return null;
    }
  } else if (stage === 4) {
    if (stageLotNumber === 1) {
      area_m2 = 249.24;
    } else if (stageLotNumber === 2) {
      area_m2 = 239.18;
    } else if (stageLotNumber === 3) {
      area_m2 = 228.91;
    } else if (stageLotNumber === 4) {
      area_m2 = 215.63;
    } else if (stageLotNumber === 5) {
      area_m2 = 201.33;
    } else if (stageLotNumber >= 6 && stageLotNumber <= 23) {
      area_m2 = 200;
    } else if (stageLotNumber === 24) {
      area_m2 = 293.3;
    } else if (stageLotNumber === 25) {
      area_m2 = 449.28;
      forceSold = true;
    } else if (stageLotNumber >= 26 && stageLotNumber <= 40) {
      area_m2 = 200;
    } else if (stageLotNumber === 41) {
      area_m2 = null;
      forceSold = true;
    } else if (stageLotNumber === 42) {
      area_m2 = 294.07;
    } else if (stageLotNumber === 43) {
      area_m2 = 308.84;
    } else if (stageLotNumber === 44 || stageLotNumber === 45) {
      area_m2 = null;
      forceSold = true;
    } else if (stageLotNumber === 46) {
      area_m2 = 316.56;
    } else if (stageLotNumber === 47) {
      area_m2 = 232.04;
    } else if (stageLotNumber === 48) {
      area_m2 = 208.79;
    } else if (stageLotNumber >= 49 && stageLotNumber <= 64) {
      area_m2 = 390;
    } else if (stageLotNumber === 65) {
      area_m2 = null;
      forceSold = true;
    } else {
      return null;
    }
  } else {
    return null;
  }

  return {
    stage,
    stageLotNumber,
    area_m2,
    forceSold,
    dimensions,
  };
};

const NULL_DIMENSIONS: LotDimensions = { front_m: null, depth_m: null, width_m: null, other_side_m: null, notes: null };

const getStageAndIndexByLotId = (lotId: number): { stage: number; index: number } | null => {
  // Mapping by internal IDs to align with the provided PDF arrays (L-1.. per stage)
  if (lotId >= 1 && lotId <= 47) return { stage: 1, index: lotId - 1 };
  if (lotId >= 48 && lotId <= 94) return { stage: 2, index: lotId - 48 };
  if (lotId >= 95 && lotId <= 137) return { stage: 3, index: lotId - 95 };

  if (lotId >= 138 && lotId <= 199) return { stage: 4, index: lotId - 138 };
  // IDs internos restaurados: Etapa 3 lotes 43/42/41 (201/202/203)
  if (lotId === 201) return { stage: 3, index: 42 };
  if (lotId === 202) return { stage: 3, index: 41 };
  if (lotId === 203) return { stage: 3, index: 40 };

  return null;
};

/**
 * Obtiene las especificaciones de un lote por su id.
 */
export const getLotSpec = (lotId: number): LotSpec | null => {
  const info = getStageAndIndexByLotId(lotId);
  if (!info) return null;

  const { stage, index } = info;
  const stageLotNumber = index + 1;
  return getStageLotSpec(stage, stageLotNumber);
};

// ====== REGLAS DE PRECIOS ======
// Precios en CLP

export const PRICING_RULES = {
  PRICE_200M2: 34900000,
  PRICE_390M2: 42900000,
} as const;

/**
 * Calcula el precio total y precio por m2 según el área del lote.
 * Reglas:
 * - área = 200 m² → totalPrice = 34,900,000 CLP
 * - área = 390 m² → totalPrice = 42,900,000 CLP
 * - otro → totalPrice = null (mostrar "Consultar")
 */
export const calculateLotPricing = (area: number | null): { totalPrice: number | null; pricePerM2: number | null } => {
  if (area != null && area >= 200 && area <= 299) {
    return {
      totalPrice: PRICING_RULES.PRICE_200M2,
      pricePerM2: Math.round(PRICING_RULES.PRICE_200M2 / area),
    };
  }
  if (area != null && area >= 300 && area <= 399) {
    return {
      totalPrice: PRICING_RULES.PRICE_390M2,
      pricePerM2: Math.round(PRICING_RULES.PRICE_390M2 / area),
    };
  }
  // Otros casos: consultar
  return {
    totalPrice: null,
    pricePerM2: null,
  };
};

/**
 * Determina si un lote debe marcarse como VENDIDO por regla de área.
 * Regla: área > 390 m² → sold
 */
export const shouldBeSoldByAreaRule = (area: number): boolean => {
  return area > 390;
};
