import lotsPositions from '@/data/lots.json';

type LotPosition = {
    id: number;
    number: string;
    x: number;
    y: number;
    status: "available" | "sold" | "reserved";
    stage?: number;
};

type LotWithStatus = {
    id: number;
    number: string;
    stage?: number | null; // Added stage to type
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
 * Uses lots.json as the primary source and overlays status from database
 * This ensures all positioned lots are displayed with current status
 * @param lotsWithStatus - Lots with current status from database (optional)
 * @returns Lots from lots.json with updated status from database
 */
export function mergeLotPositions(lotsWithStatus?: LotWithStatus[]): MergedLot[] {
    // Use lots.json as the base (these have the manual positions)
    const positionedLots = lotsPositions as LotPosition[];

    if (!lotsWithStatus || lotsWithStatus.length === 0) {
        // No database data, return positioned lots as-is
        return positionedLots.map(lot => ({
            ...lot,
            reservedUntil: null,
            lockedBy: null,
            lockedUntil: null,
            area: null,
            totalPrice: null,
            pricePerM2: null,
        }));
    }

    // Create a maps for reliable lookup
    const statusByKey = new Map<string, LotWithStatus>();
    const statusById = new Map<number, LotWithStatus>();

    lotsWithStatus.forEach(lot => {
        // Map by Stage-Number
        const key = lot.stage ? `${lot.stage}-${lot.number}` : `no_stage-${lot.number}`;
        statusByKey.set(key, lot);

        // Map by ID (Secondary robust lookup)
        statusById.set(lot.id, lot);
    });

    // Merge: use positioned lots and overlay status from database
    return positionedLots.map(posLot => {
        // Construct the key for the JSON lot
        const key = posLot.stage ? `${posLot.stage}-${posLot.number}` : `no_stage-${posLot.number}`;

        // Try exact match by Key first, then fallback to ID match
        const dbLot = statusByKey.get(key) || statusById.get(posLot.id);

        if (dbLot) {
            // Lot exists in database, use its status and ID from DB
            return {
                id: dbLot.id, // CRITICAL: Use the real DB ID
                number: posLot.number,
                x: posLot.x,
                y: posLot.y,
                stage: posLot.stage,
                status: dbLot.status,
                reservedUntil: dbLot.reservedUntil ?? null,
                lockedBy: dbLot.lockedBy ?? null,
                lockedUntil: dbLot.lockedUntil ?? null,
                area: dbLot.area,
                totalPrice: dbLot.totalPrice,
                pricePerM2: dbLot.pricePerM2,
            };
        }

        // Lot not in database, use position data with default status
        return {
            id: (posLot.id > 100000) ? parseInt(posLot.number) : posLot.id,
            number: posLot.number,
            x: posLot.x,
            y: posLot.y,
            stage: posLot.stage,
            status: posLot.status,
            reservedUntil: null,
            lockedBy: null,
            lockedUntil: null,
            area: null,
            totalPrice: null,
            pricePerM2: null,
        };
    });
}

/**
 * Filters lots to only those with valid coordinates
 * @param lots - Lots potentially with coordinates
 * @returns Only lots that have x,y coordinates
 */
export function filterLotsWithCoordinates(lots: MergedLot[]): MergedLot[] {
    return lots.filter(lot =>
        typeof lot.x === 'number' &&
        typeof lot.y === 'number' &&
        !isNaN(lot.x) &&
        !isNaN(lot.y)
    );
}

/**
 * Gets all positioned lots from lots.json
 * @returns All lots with positions
 */
export function getAllPositionedLots(): LotPosition[] {
    return lotsPositions as LotPosition[];
}
