import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '@/lib/logic';

const prisma = new PrismaClient();

async function verifyAllLots() {
    console.log('\n🔍 VERIFICACIÓN COMPLETA DE TODOS LOS LOTES\n');

    const allLots = await prisma.lot.findMany({
        orderBy: [{ stage: 'asc' }, { id: 'asc' }]
    });

    console.log(`📊 Total de lotes en la base de datos: ${allLots.length}\n`);

    let mismatches = 0;
    let correct = 0;

    console.log('Verificando consistencia ID -> (Etapa, Número)...\n');

    for (const dbLot of allLots) {
        // Calcular lo que DEBERÍA ser según logic.ts
        const computed = computeLotDetailsFromId(dbLot.id);

        // Comparar con lo que ESTÁ en la BD
        const stageMatch = computed.stage === dbLot.stage;
        const numberMatch = computed.number === dbLot.number;

        if (!stageMatch || !numberMatch) {
            console.log(`❌ DESAJUSTE ID ${dbLot.id}:`);
            console.log(`   BD: Etapa ${dbLot.stage} Lote ${dbLot.number}`);
            console.log(`   Código: Etapa ${computed.stage} Lote ${computed.number}`);
            mismatches++;
        } else {
            correct++;
        }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   ✅ Correctos: ${correct}`);
    console.log(`   ❌ Desajustes: ${mismatches}`);

    if (mismatches === 0) {
        console.log('\n🎉 ¡PERFECTO! Todos los IDs están correctamente mapeados.\n');
    } else {
        console.log('\n⚠️  Hay desajustes que necesitan corrección.\n');
    }

    // Verificar que los 22 vendidos estén correctos
    console.log('\n🔍 Verificando los 22 lotes vendidos...\n');

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

    const soldLots = await prisma.lot.findMany({
        where: { status: 'sold' },
        orderBy: [{ stage: 'asc' }, { number: 'asc' }]
    });

    let soldMismatches = 0;

    for (const lot of expectedSold) {
        const found = soldLots.find(s => s.stage === lot.stage && s.number === lot.number);
        if (!found) {
            console.log(`❌ NO VENDIDO: Etapa ${lot.stage} Lote ${lot.number}`);
            soldMismatches++;
        }
    }

    for (const sold of soldLots) {
        const shouldBeSold = expectedSold.some(e => e.stage === sold.stage && e.number === sold.number);
        if (!shouldBeSold) {
            console.log(`⚠️  VENDIDO EXTRA: Etapa ${sold.stage} Lote ${sold.number} (ID: ${sold.id})`);
            soldMismatches++;
        }
    }

    if (soldMismatches === 0 && soldLots.length === 22) {
        console.log('✅ Los 22 lotes vendidos están perfectamente configurados.\n');
    } else {
        console.log(`⚠️  Hay ${soldMismatches} discrepancias en los lotes vendidos.\n`);
    }
}

verifyAllLots()
    .catch((e) => {
        console.error('❌ ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
