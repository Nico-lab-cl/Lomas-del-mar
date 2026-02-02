import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyLotMapping() {
    console.log('\n📊 VERIFICANDO MAPEO DE LOTES VENDIDOS\n');

    // Lista de lotes que DEBERÍAN estar vendidos según el usuario
    const expectedSold = [
        { stage: 1, number: '1' }, { stage: 1, number: '2' }, { stage: 1, number: '5' },
        { stage: 1, number: '6' }, { stage: 1, number: '8' }, { stage: 1, number: '28' },
        { stage: 1, number: '37' }, { stage: 1, number: '42' }, { stage: 1, number: '45' },
        { stage: 1, number: '46' },
        { stage: 2, number: '1' }, { stage: 2, number: '29' }, { stage: 2, number: '47' },
        { stage: 3, number: '26' }, { stage: 3, number: '27' }, { stage: 3, number: '42' },
        { stage: 3, number: '43' },
        { stage: 4, number: '25' }, { stage: 4, number: '41' }, { stage: 4, number: '44' },
        { stage: 4, number: '45' }, { stage: 4, number: '65' }
    ];

    console.log('🔍 Buscando lotes que DEBERÍAN estar vendidos:\n');

    for (const lot of expectedSold) {
        const found = await prisma.lot.findFirst({
            where: {
                stage: lot.stage,
                number: lot.number
            }
        });

        if (found) {
            console.log(`✅ Etapa ${lot.stage} Lote ${lot.number} -> ID: ${found.id} | Estado: ${found.status}`);
        } else {
            console.log(`❌ NO ENCONTRADO: Etapa ${lot.stage} Lote ${lot.number}`);
        }
    }

    console.log('\n🔍 Lotes que ESTÁN marcados como vendidos en la BD:\n');

    const actualSold = await prisma.lot.findMany({
        where: { status: 'sold' },
        orderBy: [{ stage: 'asc' }, { number: 'asc' }]
    });

    actualSold.forEach(lot => {
        console.log(`🔴 ID: ${lot.id} | Etapa ${lot.stage} Lote ${lot.number}`);
    });

    console.log(`\n📊 Total vendidos en BD: ${actualSold.length}`);
}

verifyLotMapping()
    .catch((e) => {
        console.error('❌ ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
