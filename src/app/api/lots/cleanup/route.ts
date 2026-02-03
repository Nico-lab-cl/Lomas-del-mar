import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Cleanup endpoint for expired lot locks
 * Should be called periodically by a cron job (e.g., every 5 minutes)
 * 
 * This endpoint:
 * 1. Finds all expired locks
 * 2. Updates associated lots to 'available' status
 * 3. Deletes expired locks
 */
export async function POST() {
    try {
        const now = new Date();

        await prisma.$transaction(async (tx) => {
            // Find expired locks
            const expiredLocks = await tx.lotLock.findMany({
                where: { locked_until: { lt: now } }
            });

            if (expiredLocks.length === 0) {
                return; // No expired locks to clean
            }

            const lotIds = expiredLocks.map(lock => lock.lot_id);

            // Update lots to 'available' if they were 'reserved'
            await tx.lot.updateMany({
                where: {
                    id: { in: lotIds },
                    status: 'reserved' // Only update reserved lots, not sold ones
                },
                data: {
                    status: 'available',
                    reserved_until: null,
                    reserved_at: null,
                    reserved_by: null,
                    updated_at: now
                }
            });

            // Delete expired locks
            await tx.lotLock.deleteMany({
                where: { locked_until: { lt: now } }
            });
        });

        return NextResponse.json({
            ok: true,
            message: 'Expired locks cleaned successfully'
        });

    } catch (error) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
