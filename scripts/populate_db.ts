import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../src/lib/logic';

const prisma = new PrismaClient();

async function populateDb() {
    console.log('🌱 Starting DB Population...');

    let createdCount = 0;
    let updatedCount = 0;

    // Iteramos por todos los IDs posibles (ajusta el límite si es necesario, 300 es seguro)
    // Según tu lots.json llega hasta ~202, pero iterar hasta 300 no hace daño, logic.ts filtra los inválidos.
    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);

        // Si la lógica dice que este ID no es válido (null), lo saltamos
        if (!details || !details.stage || !details.number) {
            continue;
        }

        // Upsert: Crear si no existe, actualizar si existe (solo campos básicos para no sobrescribir ventas)
        // OJO: Si ya está vendido, NO cambiamos el status a 'available'. Solo llenamos huecos.
        const existing = await prisma.lot.findUnique({ where: { id } });

        if (!existing) {
            // No existe -> CREAR como available
            await prisma.lot.create({
                data: {
                    id: id,
                    number: details.number,
                    stage: details.stage,
                    area_m2: details.area_m2 || 300, // Valor por defecto seguro
                    price_total_clp: details.price_clp || 14990000,
                    status: 'available'
                }
            });
            console.log(`✅ Created Lot ID ${id} [Stage ${details.stage} #${details.number}]`);
            createdCount++;
        } else {
            // Ya existe -> Actualizar SOLO datos técnicos, NO el status (para respetar ventas)
            if (existing.number !== details.number || existing.stage !== details.stage) {
                await prisma.lot.update({
                    where: { id },
                    data: {
                        number: details.number,
                        stage: details.stage,
                        // No tocamos status
                    }
                });
                console.log(`🔄 Updated Lot ID ${id} metadata`);
                updatedCount++;
            }
        }
    }

    console.log(`\n🎉 Population Complete!`);
    console.log(`   - Created: ${createdCount}`);
    console.log(`   - Updated: ${updatedCount}`);
}

populateDb()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
