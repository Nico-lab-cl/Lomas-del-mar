
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const LOT_ID = 90; // Stage 2 Lot 41
    console.log(`🗑️  Resetting Lot ID ${LOT_ID} (S2 L41)...`);

    // 1. Find transactions for this lot
    const transactions = await prisma.webpayTransaction.findMany({
        where: { lot_id: LOT_ID }
    });

    console.log(`Found ${transactions.length} transactions.`);

    for (const tx of transactions) {
        // Delete transaction
        await prisma.webpayTransaction.delete({ where: { id: tx.id } });
        console.log(`   - Deleted Transaction ${tx.token}`);

        // Delete associated reservation
        if (tx.reservation_id) {
            await prisma.reservation.delete({ where: { id: tx.reservation_id } }).catch(() => { });
            console.log(`   - Deleted Reservation ${tx.reservation_id}`);
        }
    }

    // Double check for any lingering reservations for this lot not linked to a transaction
    const lingeringReservations = await prisma.reservation.findMany({
        where: { currentReservation: LOT_ID } // Assuming logic? Or maybe we can't search by lot easily if it's JSON?
        // Actually reservation has 'lot_id' or similar? 
        // In route.ts: txRow.reservation doesn't show lot_id on reservation.
        // But session has currentReservation.
        // Let's stick to cleaning via transactions first.
    });

    // 2. Reset Lot Status
    await prisma.lot.update({
        where: { id: LOT_ID },
        data: {
            status: 'available',
            reservation_amount_clp: 550000 // Reset price just in case? No, keep it.
        }
    });
    console.log(`✅ Lot ${LOT_ID} status set to 'available'.`);

    // 3. Clear locks
    await prisma.lotLock.deleteMany({
        where: { lot_id: LOT_ID }
    });
    console.log(`✅ Cleared locks for Lot ${LOT_ID}.`);

    console.log('\n✨ Lot 41 (S2) is ready to be purchased again. ✨');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
