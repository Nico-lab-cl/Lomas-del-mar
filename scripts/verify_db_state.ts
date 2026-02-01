
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Database Verification...');
    console.log('--------------------------------------------------');

    // 1. Total Lots
    const totalLots = await prisma.lot.count();
    console.log(`📊 Total Lots in DB: ${totalLots}`);

    // 2. Breakdown by Status
    const statusBreakdown = await prisma.lot.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });

    console.log('\n📉 Breakdown by Status:');
    statusBreakdown.forEach(group => {
        console.log(`   - ${group.status.padEnd(12)}: ${group._count.id} lots`);
    });

    // 3. Price Check for Available Lots
    const availableLots = await prisma.lot.findMany({
        where: { status: 'available' },
        select: { reservation_amount_clp: true }
    });

    const lotsWith550k = availableLots.filter(l => l.reservation_amount_clp === 550000).length;
    const lotsWithOtherPrice = availableLots.length - lotsWith550k;

    console.log('\n💰 Price Check (Status: Available):');
    console.log(`   - Price $550.000 : ${lotsWith550k} lots ✅`);

    if (lotsWithOtherPrice > 0) {
        console.log(`   - Other Prices   : ${lotsWithOtherPrice} lots ⚠️`);
        // Find examples
        const examples = await prisma.lot.findMany({
            where: { status: 'available', NOT: { reservation_amount_clp: 550000 } },
            take: 3
        });
        console.log('     Examples of wrong prices:', examples);
    } else {
        console.log(`   - Other Prices   : 0 lots (All available lots are correct)`);
    }

    console.log('--------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
