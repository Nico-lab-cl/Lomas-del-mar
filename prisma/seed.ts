import { PrismaClient } from '@prisma/client';

// Inlined logic to avoid dependency on src/ in production Docker
export const computeLotDetailsFromId = (lotId: number) => {
    const stageAndStageLotNumber = (() => {
        if (lotId >= 1 && lotId <= 47) return { stage: 1, stageLotNumber: lotId };
        if (lotId >= 48 && lotId <= 92) return { stage: 2, stageLotNumber: lotId - 47 };
        if (lotId >= 93 && lotId <= 131) return { stage: 3, stageLotNumber: lotId - 92 };

        if (lotId >= 132 && lotId <= 199) return { stage: 4, stageLotNumber: lotId - 131 };

        // Mapeo de lotes "desbordaos" (que no caben en los rangos lineales)
        if (lotId === 201) return { stage: 2, stageLotNumber: 46 };
        if (lotId === 202) return { stage: 2, stageLotNumber: 47 };
        if (lotId === 203) return { stage: 3, stageLotNumber: 40 };
        if (lotId === 204) return { stage: 3, stageLotNumber: 41 };
        if (lotId === 205) return { stage: 3, stageLotNumber: 42 };
        if (lotId === 206) return { stage: 3, stageLotNumber: 43 };
        return null;
    })();

    const stage = stageAndStageLotNumber?.stage ?? null;
    const stageLotNumber = stageAndStageLotNumber?.stageLotNumber ?? null;

    const area_m2 = (() => {
        if (!stage || !stageLotNumber) return null;

        if (stage === 1) {
            if (stageLotNumber === 1) return 326.23;
            if (stageLotNumber >= 2 && stageLotNumber <= 27) return 200;
            if (stageLotNumber === 28) return 344.2;
            if (stageLotNumber >= 29 && stageLotNumber <= 46) return 390;
            if (stageLotNumber === 47) return 236.97;
            return null;
        }

        if (stage === 2) {
            if (stageLotNumber === 1) return 374.13;
            if (stageLotNumber >= 2 && stageLotNumber <= 27) return 200;
            if (stageLotNumber === 28) return 211.72;
            if (stageLotNumber === 29) return null;
            if (stageLotNumber === 30) return 361.08;
            if (stageLotNumber >= 31 && stageLotNumber <= 46) return 390;
            if (stageLotNumber === 47) return 303.52;
            return null;
        }

        if (stage === 3) {
            if (stageLotNumber >= 1 && stageLotNumber <= 25) return 200;
            if (stageLotNumber === 26 || stageLotNumber === 27) return null;
            if (stageLotNumber >= 28 && stageLotNumber <= 42) return 390;
            if (stageLotNumber === 43) return null;
            return null;
        }

        if (stage === 4) {
            if (stageLotNumber === 1) return 249.24;
            if (stageLotNumber === 2) return 239.18;
            if (stageLotNumber === 3) return 228.91;
            if (stageLotNumber === 4) return 215.63;
            if (stageLotNumber === 5) return 201.33;
            if (stageLotNumber >= 6 && stageLotNumber <= 23) return 200;
            if (stageLotNumber === 24) return 293.3;
            if (stageLotNumber === 25) return 449.28;
            if (stageLotNumber >= 26 && stageLotNumber <= 40) return 200;
            if (stageLotNumber === 41) return null;
            if (stageLotNumber === 42) return 294.07;
            if (stageLotNumber === 43) return 308.84;
            if (stageLotNumber === 44 || stageLotNumber === 45) return null;
            if (stageLotNumber === 46) return 316.56;
            if (stageLotNumber === 47) return 232.04;
            if (stageLotNumber === 48) return 208.79;
            if (stageLotNumber >= 49 && stageLotNumber <= 64) return 390;
            if (stageLotNumber === 65) return null;
            return null;
        }

        return null;
    })();

    const price_total_clp = (() => {
        if (area_m2 != null && area_m2 >= 200 && area_m2 <= 299) return 34900000;
        if (area_m2 != null && area_m2 >= 300 && area_m2 <= 399) return 42900000;
        return null;
    })();

    return {
        number: stageLotNumber ? String(stageLotNumber) : String(lotId),
        stage,
        area_m2,
        price_total_clp,
    };
};

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    const lotsToCreate = [];

    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);

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
