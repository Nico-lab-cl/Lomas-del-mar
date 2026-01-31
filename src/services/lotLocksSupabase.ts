// This service is legacy/mocked for the migration.
// The actual data fetching is handled via internal API routes (/api/lots) using Prisma.

export type LotLockRow = {
  lot_id: number;
  locked_by: string;
  locked_until: string;
};

export type LotStatusRow = {
  id: number;
  status: string;
};

// Always return false to force usage of internal API/Prisma path
export const isSupabaseConfigured = (): boolean => false;

export const fetchActiveLotLocks = async (): Promise<LotLockRow[]> => {
  return [];
};

export const fetchLotsStatus = async (): Promise<LotStatusRow[]> => {
  return [];
};

export type TryLockResult = {
  ok: boolean;
  locked_by: string | null;
  locked_until: string | null;
  reason?: string | null;
};

export const tryLockLot = async (lotId: number, sessionId: string, durationSeconds = 600): Promise<TryLockResult> => {
  // Mock failure for now, or implement via /api/lock if needed later
  return { ok: false, locked_by: null, locked_until: null, reason: 'migration_mode' };
};

export const releaseLotLock = async (lotId: number, sessionId: string): Promise<boolean> => {
  return false;
};
