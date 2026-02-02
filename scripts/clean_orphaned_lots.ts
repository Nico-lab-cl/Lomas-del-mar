import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOrphanedLots() {
    console.log('\n🧹 LIMPIANDO LOTES HUÉRFANOS\n');

    // IDs que NO existen en el diseño del sistema según logic.ts
    const orphanedIds = [204, 205, 206];

    console.log('Los siguientes IDs serán eliminados:');
    for (const id of orphanedIds) {
        const lot = await prisma.lot.findUnique({ where: { id } });
        if (lot) {
            console.log(`  ❌ ID ${id}: Etapa ${lot.stage} Lote ${lot.number} (${lot.status})`);
        }
    }

    console.log('\n⚠️  Procediendo con la eliminación...\n');

    const result = await prisma.lot.deleteMany({
        where: {
            id: { in: orphanedIds }
        }
    });

    console.log(`✅ ${result.count} lotes huérfanos eliminados.\n`);

    // Verificar resultado final
    const remaining = await prisma.lot.count();
    console.log(`📊 Total de lotes restantes: ${remaining}`);
    console.log('   (Deberían ser 202: 205 - 3 = 202)\n');
}

cleanOrphanedLots()
    .catch((e) => {
        console.error('❌ ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
