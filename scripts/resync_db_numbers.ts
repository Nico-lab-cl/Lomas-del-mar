
import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../src/lib/logic';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting DB Resync: Aligning Lot Numbers/Stages with current logic...');

    let updatedCount = 0;

    // Iterate 1 to 300
    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);

        if (!details || !details.stage || !details.number) {
            // If logic says it shouldn't exist, we skip (or could delete, but let's just skip)
            continue;
        }

        const currentLot = await prisma.lot.findUnique({ where: { id } });

        if (!currentLot) {
            // Lot exists in logic but not in DB? We could create it, but focus is updating existing.
            // console.warn(`⚠️ Lot ID ${id} defined in logic but missing in DB. Skipping.`);
            continue;
        }

        // Check if DB differs from Logic
        if (currentLot.number !== details.number || currentLot.stage !== details.stage) {
            console.log(`🛠️ Fixing ID ${id}: DB[S${currentLot.stage} #${currentLot.number}] -> LOW[S${details.stage} #${details.number}]`);

            await prisma.lot.update({
                where: { id },
                data: {
                    number: details.number,
                    stage: details.stage,
                    // Optionally update area/price if needed, but number is the critical fix now
                    area_m2: details.area_m2,
                }
            });
            updatedCount++;
        }
    }

    console.log(`\n✅ Resync complete. Verified all IDs. Updated ${updatedCount} lots.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
