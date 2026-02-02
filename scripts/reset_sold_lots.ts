import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// IDs de lotes que DEBEN estar vendidos
const SOLD_LOT_IDS = [
    // Etapa 1: Lote 1, 2, 5, 6, 8, 28, 37, 42, 45, 46
    1, 2, 5, 6, 8, 28, 37, 42, 45, 46,
    // Etapa 2: Lote 1, 29, 47
    50,   // Lote 1 de Etapa 2
    78,   // Lote 29 de Etapa 2
    48,   // Lote 47 de Etapa 2
    // Etapa 3: Lote 26, 27, 42, 43
    118,  // Lote 26 de Etapa 3
    119,  // Lote 27 de Etapa 3
    202,  // Lote 42 de Etapa 3
    201,  // Lote 43 de Etapa 3
    // Etapa 4: Lote 25, 41, 44, 45, 65
    156,  // Lote 25 de Etapa 4
    172,  // Lote 41 de Etapa 4
    175,  // Lote 44 de Etapa 4
    176,  // Lote 45 de Etapa 4
    196   // Lote 65 de Etapa 4
];

async function resetDatabase() {
    console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS...\n');

    // 1. RESETEAR TODO A DISPONIBLE
    console.log('📌 Paso 1: Reseteando TODOS los lotes a disponible...');
    const resetResult = await prisma.lot.updateMany({
        data: {
            status: 'available',
            reserved_at: null,
            reserved_by: null,
            reserved_until: null,
            reservation_amount_clp: 50
        }
    });
    console.log(`✅ ${resetResult.count} lotes reseteados a disponible\n`);

    // 2. MARCAR COMO VENDIDOS SOLO LOS ESPECÍFICOS
    console.log('📌 Paso 2: Marcando lotes vendidos específicos...');
    const soldResult = await prisma.lot.updateMany({
        where: {
            id: { in: SOLD_LOT_IDS }
        },
        data: {
            status: 'sold'
        }
    });
    console.log(`✅ ${soldResult.count} lotes marcados como vendidos\n`);

    // 3. VERIFICAR RESULTADO
    console.log('📊 RESUMEN FINAL:');
    const available = await prisma.lot.count({ where: { status: 'available' } });
    const sold = await prisma.lot.count({ where: { status: 'sold' } });
    const reserved = await prisma.lot.count({ where: { status: 'reserved' } });

    console.log(`   ✅ Disponibles: ${available}`);
    console.log(`   ❌ Vendidos: ${sold}`);
    console.log(`   🔒 Reservados: ${reserved}`);

    console.log('\n🎉 LIMPIEZA COMPLETA!\n');
}

resetDatabase()
    .catch((e) => {
        console.error('❌ ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
