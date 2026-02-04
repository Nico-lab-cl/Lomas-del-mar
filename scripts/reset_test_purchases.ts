
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // IDs extracted from user request
    const TARGET_LOT_IDS = [
        134, // S4
        190, // S4
        135, // S4
        96,  // S3
        136, // S4
        112, // S3
        111, // S3
        97,  // S3
        29,  // S1
        132, // S4
        90,   // S2
        203   // S3 L41
    ];

    console.log(`🗑️  Starting Bulk Reset for ${TARGET_LOT_IDS.length} Lots...`);
    console.log(`📝 Target IDs: ${TARGET_LOT_IDS.join(', ')}`);
    console.log('--------------------------------------------------');

    let totalDeletedTxs = 0;
    let totalDeletedRes = 0;

    for (const lotId of TARGET_LOT_IDS) {
        console.log(`\n🔹 Processing Lot ID ${lotId}...`);

        // 1. Find and Delete Transactions
        const transactions = await prisma.webpayTransaction.findMany({
            where: { lot_id: lotId }
        });

        if (transactions.length > 0) {
            console.log(`   Found ${transactions.length} transactions.`);
            for (const tx of transactions) {
                await prisma.webpayTransaction.delete({ where: { id: tx.id } });
                totalDeletedTxs++;

                // Delete associated reservation if it exists
                if (tx.reservation_id) {
                    try {
                        await prisma.reservation.delete({ where: { id: tx.reservation_id } });
                        console.log(`      - Deleted Tx ${tx.token.slice(0, 8)}... & Reservation ${tx.reservation_id}`);
                        totalDeletedRes++;
                    } catch (e) {
                        console.log(`      - Deleted Tx ${tx.token.slice(0, 8)}... (Reservation not found/already deleted)`);
                    }
                } else {
                    console.log(`      - Deleted Tx ${tx.token.slice(0, 8)}...`);
                }
            }
        } else {
            console.log(`   No transactions found.`);
        }

        // 2. Reset Lot Status
        await prisma.lot.update({
            where: { id: lotId },
            data: {
                status: 'available',
                reservation_amount_clp: 550000 // Ensure price is standard
            }
        });
        console.log(`   ✅ Status set to 'available'.`);

        // 3. Clear Locks
        const deletedLocks = await prisma.lotLock.deleteMany({
            where: { lot_id: lotId }
        });
        if (deletedLocks.count > 0) console.log(`   🔓 Cleared ${deletedLocks.count} lock(s).`);
    }

    console.log('--------------------------------------------------');
    console.log('✨ BULK RESET COMPLETE ✨');
    console.log(`Totals: Deleted ${totalDeletedTxs} Transactions, ${totalDeletedRes} Reservations.`);
    console.log('All specified lots are now available for sale.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
