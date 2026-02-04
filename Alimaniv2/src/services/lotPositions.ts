import layoutPositions from './layoutPositions.json';
import { getLotSpec } from './lotSpecs';

type LotPosition = {
    x: number;
    y: number;
    size?: number;
};

type LotWithStatus = {
    id: number;
    number: string;
    stage?: number | null;
    status: "available" | "sold" | "reserved";
    reservedUntil?: number | null;
    lockedBy?: string | null;
    lockedUntil?: number | null;
    area: number | null;
    totalPrice: number | null;
    pricePerM2: number | null;
};

type MergedLot = {
    id: number;
    number: string;
    x: number;
    y: number;
    status: "available" | "sold" | "reserved";
    stage?: number;
    reservedUntil?: number | null;
    lockedBy?: string | null;
    lockedUntil?: number | null;
    area: number | null;
    totalPrice: number | null;
    pricePerM2: number | null;
};

/**
 * Uses layoutPositions.json (positions per ID) and overlays status from database.
 * Source of Truth:
 * - Coordinates: layoutPositions.json
 * - Metadata (Stage, Number, Status): Database (lotsWithStatus)
 */
export function mergeLotPositions(lotsWithStatus?: LotWithStatus[]): MergedLot[] {
    const rawPositions = (layoutPositions as any).positions as Record<string, LotPosition>;
    const merged: MergedLot[] = [];

    // Map DB lots for fast lookup
    const dbMap = new Map<number, LotWithStatus>();
    if (lotsWithStatus) {
        lotsWithStatus.forEach(l => dbMap.set(l.id, l));
    }

    Object.entries(rawPositions).forEach(([key, pos]) => {
        const id = Number(key);
        if (isNaN(id)) return;

        const dbLot = dbMap.get(id);

        if (dbLot) {
            // Case 1: Lot found in DB (Preferred)
            merged.push({
                id: dbLot.id,
                number: dbLot.number,
                x: pos.x,
                y: pos.y,
                stage: dbLot.stage ?? undefined, // USE DB STAGE
                status: dbLot.status,
                reservedUntil: dbLot.reservedUntil ?? null,
                lockedBy: dbLot.lockedBy ?? null,
                lockedUntil: dbLot.lockedUntil ?? null,
                area: dbLot.area,
                totalPrice: dbLot.totalPrice,
                pricePerM2: dbLot.pricePerM2,
            });
        } else {
            // Case 2: Lot in JSON but not in DB (Fallback / Orphan)
            // Try to compute spec from ID to guess number/stage
            const spec = getLotSpec(id);
            merged.push({
                id: id,
                number: spec?.stageLotNumber ? String(spec.stageLotNumber) : String(id), // Fallback
                x: pos.x,
                y: pos.y,
                stage: spec?.stage ?? undefined,
                status: 'available', // Default
                reservedUntil: null,
                lockedBy: null,
                lockedUntil: null,
                area: null,
                totalPrice: null,
                pricePerM2: null,
            });
        }
    });

    return merged;
}

/**
 * Filters lots to only those with valid coordinates
 */
export function filterLotsWithCoordinates(lots: MergedLot[]): MergedLot[] {
    return lots.filter(lot =>
        typeof lot.x === 'number' &&
        typeof lot.y === 'number' &&
        !isNaN(lot.x) &&
        !isNaN(lot.y)
    );
}

export function getAllPositionedLots(): any[] {
    const rawPositions = (layoutPositions as any).positions as Record<string, LotPosition>;
    return Object.entries(rawPositions).map(([k, v]) => ({ id: Number(k), ...v }));
}
