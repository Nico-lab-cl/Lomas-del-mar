
import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from './logic';

// Lista MAESTRA de lotes vendidos proporcionada por el usuario
// Esta lista se impone como la única verdad al iniciar el servidor.
const SOLD_LOTS = [
    // Etapa 1
    { stage: 1, number: 1 }, { stage: 1, number: 2 }, { stage: 1, number: 5 },
    { stage: 1, number: 6 }, { stage: 1, number: 8 }, { stage: 1, number: 28 },
    { stage: 1, number: 37 }, { stage: 1, number: 42 }, { stage: 1, number: 45 },
    { stage: 1, number: 46 },
    // Etapa 2
    { stage: 2, number: 1 }, { stage: 2, number: 29 }, { stage: 2, number: 47 },
    // Etapa 3
    { stage: 3, number: 26 }, { stage: 3, number: 27 }, { stage: 3, number: 42 },
    { stage: 3, number: 43 },
    // Etapa 4
    { stage: 4, number: 25 }, { stage: 4, number: 41 }, { stage: 4, number: 44 },
    { stage: 4, number: 45 }, { stage: 4, number: 65 }
];

export async function bootstrapDatabase(prisma: PrismaClient) {
    if (process.env.NODE_ENV !== 'production') {
        // En desarrollo puede ser molesto que se reinicie todo el rato, 
        // pero para estar seguros, lo dejamos o lo logueamos.
        // console.log('🔧 Bootstrapping DB skipped in dev (uncomment to test)');
        // return;
    }

    console.log('🚀 [BOOTSTRAP] Enforcing Database State...');

    let updatedCount = 0;
    let createdCount = 0;

    // Iteramos por todos los IDs posibles validos (hasta 300 para asegurar)
    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);

        // Si es inválido, saltar
        if (!details || !details.stage || !details.number) continue;

        // Determinar si DEBERÍA estar vendido
        const shouldBeSold = SOLD_LOTS.some(l =>
            l.stage === details.stage && String(l.number) === String(details.number)
        );

        const targetStatus = shouldBeSold ? 'sold' : 'available';

        // Lógica de upsert simplificada
        const existing = await prisma.lot.findUnique({ where: { id } });

        if (!existing) {
            await prisma.lot.create({
                data: {
                    id,
                    number: details.number,
                    stage: details.stage,
                    area_m2: details.area_m2 || 300,
                    price_total_clp: details.price_total_clp || 14990000,
                    reservation_amount_clp: 50, // Siempre 50
                    status: targetStatus
                }
            });
            createdCount++;
        } else {
            // Check consistency
            const needsUpdate =
                existing.status !== targetStatus ||
                existing.reservation_amount_clp !== 50 ||
                existing.number !== details.number; // Basic check

            if (needsUpdate) {
                await prisma.lot.update({
                    where: { id },
                    data: {
                        status: targetStatus,
                        reservation_amount_clp: 50,
                        number: details.number,
                        stage: details.stage,
                        // Limpiar datos de reserva si se libera
                        ...(targetStatus === 'available' ? {
                            reserved_at: null,
                            reserved_by: null,
                            reserved_until: null,
                            // NO borramos order_id para historial, pero se podría
                        } : {})
                    }
                });
                updatedCount++;
            }
        }
    }

    console.log(`✅ [BOOTSTRAP] Complete. Created: ${createdCount}, Updated/Fixed: ${updatedCount}`);
}
