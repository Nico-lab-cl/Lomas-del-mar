import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../src/lib/logic';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Clean existing
    // await prisma.lot.deleteMany();

    // Seed lots 1 to 300
    // Based on logic.ts, implementation seems to handle specific ranges.
    // We will iterate and check if logic returns valid details.

    const lotsToCreate = [];

    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);

        // If logic returns a number, it effectively exists in the logic map
        // (Although logic returns null price/area for some, we should still create the lot if it has a stage/number?)
        // Let's assume if it has a stage and number, it's a valid lot.

        if (details.stage && details.number) {
            lotsToCreate.push({
                id: id,
                number: details.number,
                stage: details.stage,
                area_m2: details.area_m2,
                price_total_clp: details.price_total_clp,
                status: 'available',
                reservation_amount_clp: 550000
            });
        }
    }

    for (const lot of lotsToCreate) {
        await prisma.lot.upsert({
            where: { id: lot.id },
            update: {},
            create: lot
        });
    }

    console.log(`Seeding finished. Created/Upserted ${lotsToCreate.length} lots.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
