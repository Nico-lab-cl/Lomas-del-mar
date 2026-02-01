import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../prisma/seed';

const prisma = new PrismaClient();

const SOLD_LIST = [
    // Etapa 1
    { stage: 1, number: 1 },
    { stage: 1, number: 2 },
    { stage: 1, number: 5 },
    { stage: 1, number: 6 },
    { stage: 1, number: 8 },
    { stage: 1, number: 28 },
    { stage: 1, number: 37 },
    { stage: 1, number: 42 },
    { stage: 1, number: 45 },
    { stage: 1, number: 46 },

    // Etapa 2
    { stage: 2, number: 1 },
    { stage: 2, number: 29 },
    { stage: 2, number: 47 },

    // Etapa 3
    { stage: 3, number: 26 },
    { stage: 3, number: 27 },
    { stage: 3, number: 42 },
    { stage: 3, number: 43 },

    // Etapa 4
    { stage: 4, number: 25 },
    { stage: 4, number: 41 },
    { stage: 4, number: 44 },
    { stage: 4, number: 45 },
    { stage: 4, number: 65 },
];

async function main() {
    console.log('Searching for lots to mark as SOLD...');

    const lotsToUpdate: { id: number; stage: number; number: string }[] = [];

    // Brute force scan to find resolving IDs (most robust way given complexities)
    // Range 1 to 300 should cover everything
    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);
        if (details.stage && details.number) {
            const numVal = parseInt(details.number, 10);

            // Check if this lot is in our SOLD_LIST
            const match = SOLD_LIST.find(l => l.stage === details.stage && l.number === numVal);
            if (match) {
                lotsToUpdate.push({ id, stage: details.stage, number: details.number });
            }
        }
    }

    console.log(`Found ${lotsToUpdate.length} lots matched out of ${SOLD_LIST.length} requested.`);

    // Check for missing
    for (const req of SOLD_LIST) {
        const found = lotsToUpdate.find(l => l.stage === req.stage && parseInt(l.number) === req.number);
        if (!found) {
            console.warn(`⚠️ WARNING: Could not find ID for Stage ${req.stage} Lot ${req.number}`);
        }
    }

    // Execute updates
    for (const lot of lotsToUpdate) {
        console.log(`Marking Lot ID ${lot.id} (Stage ${lot.stage} # ${lot.number}) as SOLD`);

        // Use upsert to create if not exists (critical for ids 201-206)
        const lotData = computeLotDetailsFromId(lot.id);

        await prisma.lot.upsert({
            where: { id: lot.id },
            update: {
                status: 'sold',
            },
            create: {
                id: lot.id,
                number: lot.number,
                stage: lot.stage,
                area_m2: lotData.area_m2,
                price_total_clp: lotData.price_total_clp,
                status: 'sold',
                reservation_amount_clp: 550000
            }
        });

        // Clear any locks just in case (using LotLock model)
        try {
            await prisma.lotLock.delete({
                where: { lot_id: lot.id }
            });
        } catch (e) {
            // Ignore if lock doesn't exist
        }
    }

    console.log('Updates complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
