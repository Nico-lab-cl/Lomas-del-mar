
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting Global Price Restoration...');
    console.log('Target: All lots with status "available"');
    console.log('Action: Set reservation_amount_clp to 550,000');
    console.log('--------------------------------------------------');

    const result = await prisma.lot.updateMany({
        where: {
            status: 'available'
        },
        data: {
            reservation_amount_clp: 550000
        }
    });

    console.log(`✅ successfully updated ${result.count} lots.`);
    console.log(`All available lots now have a reservation fee of $550.000 CLP.`);
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
