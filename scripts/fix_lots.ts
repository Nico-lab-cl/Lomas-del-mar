import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../prisma/seed';

const prisma = new PrismaClient();

async function main() {
    console.log('Start fixing lot data...');

    // Range of IDs to fix
    // 93-131 (Stage 3 remapping)
    // 132-200 (Stage 4 remapping)
    const idsToFix = [];
    for (let i = 93; i <= 200; i++) {
        idsToFix.push(i);
    }

    for (const id of idsToFix) {
        const details = computeLotDetailsFromId(id);
        if (!details.area_m2) {
            // If it returns null, it might be a valid null (e.g. sold or special)
        }

        if (details.stage && details.number) {
            console.log(`Updating Lot ID ${id}: Stage ${details.stage}, Number ${details.number}, Area ${details.area_m2}`);

            await prisma.lot.update({
                where: { id },
                data: {
                    number: details.number,
                    stage: details.stage,
                    area_m2: details.area_m2,
                    price_total_clp: details.price_total_clp,
                }
            });
        }
    }

    console.log('Fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
