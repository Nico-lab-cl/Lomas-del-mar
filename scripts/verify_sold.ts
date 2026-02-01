import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../prisma/seed';

const prisma = new PrismaClient();

const CHECK_LIST = [
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
    console.log('Verifying lot statuses...');
    let allGood = true;

    for (const req of CHECK_LIST) {
        // Find ID brute force (to match mark_sold logic)
        let foundId = -1;
        for (let id = 1; id <= 300; id++) {
            const d = computeLotDetailsFromId(id);
            if (d.stage === req.stage && parseInt(d.number) === req.number) {
                foundId = id;
                break;
            }
        }

        if (foundId === -1) {
            console.error(`❌ Stage ${req.stage} # ${req.number}: NOT FOUND IN MAPPING`);
            allGood = false;
            continue;
        }

        // Check DB
        const lot = await prisma.lot.findUnique({ where: { id: foundId } });
        if (!lot) {
            console.error(`❌ Stage ${req.stage} # ${req.number} (ID ${foundId}): DOES NOT EXIST IN DB`);
            allGood = false;
            continue;
        }

        if (lot.status === 'sold') {
            console.log(`✅ Stage ${req.stage} # ${req.number} (ID ${foundId}): VENDIDO`);
        } else {
            console.error(`❌ Stage ${req.stage} # ${req.number} (ID ${foundId}): ESTADO ES '${lot.status}' (Se esperaba 'sold')`);
            allGood = false;
        }
    }

    if (allGood) {
        console.log('\n✨ TODOS IOS LOTES SOLICITADOS ESTÁN CONFIRMADOS COMO VENDIDOS ✨');
    } else {
        console.error('\n⚠️ ALGUNOS LOTES NO TIENEN EL ESTADO CORRECTO. SI ACABAS DE CORRER mark_sold.ts, REVISA SI HUBO ERRORES.');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
