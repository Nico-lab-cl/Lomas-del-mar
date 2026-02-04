import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../src/lib/logic';

const prisma = new PrismaClient();

// Lista MAESTRA de lotes vendidos proporcionada por el usuario
const SOLD_LOTS = [
    // Etapa 1
    { stage: 1, number: 1 }, { stage: 1, number: 2 }, { stage: 1, number: 5 },
    { stage: 1, number: 6 }, { stage: 1, number: 8 }, { stage: 1, number: 28 },
    { stage: 1, number: 37 }, { stage: 1, number: 42 }, { stage: 1, number: 45 },
    { stage: 1, number: 46 },
    // Etapa 2
    { stage: 2, number: 1 }, { stage: 2, number: 29 }, { stage: 2, number: 47 },
    // Etapa 3
    { stage: 3, number: 26 }, { stage: 3, number: 27 }, { stage: 3, number: 42 },
    { stage: 3, number: 43 },
    // Etapa 4
    { stage: 4, number: 25 }, { stage: 4, number: 41 }, { stage: 4, number: 44 },
    { stage: 4, number: 45 }, { stage: 4, number: 65 }
];

async function populateDb() {
    console.log('🌱 Starting DB Enforcement (Reset & Seed)...');

    let createdCount = 0;
    let updatedCount = 0;
    let soldCount = 0;
    let availableCount = 0;

    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);

        if (!details || !details.stage || !details.number) {
            continue;
        }

        // Determine correct status based on MASTER list
        const isSold = SOLD_LOTS.some(l => l.stage === details.stage && String(l.number) === String(details.number));
        const targetStatus = isSold ? 'sold' : 'available';

        const existing = await prisma.lot.findUnique({ where: { id } });

        if (!existing) {
            // Create New
            await prisma.lot.create({
                data: {
                    id: id,
                    number: details.number,
                    stage: details.stage,
                    area_m2: details.area_m2 || 300,
                    price_total_clp: details.price_total_clp || 14990000,
                    reservation_amount_clp: 50, // FORCE 50 CLP
                    status: targetStatus
                }
            });
            console.log(`✅ Created Lot ID ${id} [Stage ${details.stage} #${details.number}] -> ${targetStatus.toUpperCase()}`);
            createdCount++;
        } else {
            // Update Existing - FORCE STATUS to match MASTER list
            // This effectively CLEANS any previous 'reserved' or 'sold' status that shouldn't be there
            await prisma.lot.update({
                where: { id },
                data: {
                    number: details.number,
                    stage: details.stage,
                    price_total_clp: details.price_total_clp || 14990000,
                    reservation_amount_clp: 550000, // FORCE 550000 CLP
                    status: targetStatus // FORCE STATUS
                }
            });
            // console.log(`🔄 Enforced Lot ID ${id} -> ${targetStatus}`);
            updatedCount++;
        }

        if (targetStatus === 'sold') soldCount++;
        else availableCount++;
    }

    console.log(`\n🎉 Enforcement Complete!`);
    console.log(`   - Total Processed: ${createdCount + updatedCount}`);
    console.log(`   - Forced SOLD: ${soldCount}`);
    console.log(`   - Forced AVAILABLE: ${availableCount}`);
}

populateDb()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
