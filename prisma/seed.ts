import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function syncSoldLots() {
    console.log('🔄 Sincronizando lotes...');

    // 1. Limpiar todo (opcional, si quieres resetear a 'available' antes de aplicar vendidos)
    // await prisma.lot.updateMany({ data: { status: 'available' } });

    // 2. Marcar Etapa 1
    await prisma.lot.updateMany({ where: { id: { in: [1, 2, 5, 6, 8, 28, 37, 42, 45, 46] } }, data: { status: 'sold' } });

    // 3. Marcar Etapa 2 (Ids: 50, 78, 48)
    await prisma.lot.updateMany({ where: { id: { in: [50, 78, 48] } }, data: { status: 'sold' } });

    // 4. Marcar Etapa 3 (Ids: 118, 119, 202, 201)
    await prisma.lot.updateMany({ where: { id: { in: [118, 119, 202, 201] } }, data: { status: 'sold' } });

    // 5. Marcar Etapa 4 (Ids: 156, 172, 175, 176, 196)
    await prisma.lot.updateMany({ where: { id: { in: [156, 172, 175, 176, 196] } }, data: { status: 'sold' } });

    const count = await prisma.lot.count({ where: { status: 'sold' } });
    console.log('✅ LISTO! Total actual:', count);
}

syncSoldLots()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
