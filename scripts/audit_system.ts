
import { PrismaClient } from '@prisma/client';
import { computeLotDetailsFromId } from '../prisma/seed'; // Used seed.ts as it works in prod environment
// They should be identical.

const prisma = new PrismaClient();

async function main() {
    console.log('🕵️  Starting System Audit...');
    console.log('--------------------------------------------------');

    let errors = 0;

    // 1. Check Key Problem Lots (Canaries)
    const canaries = [
        { id: 90, expectedStage: 2, expectedNum: "41", desc: "S2 L41 (Receipt Error Case)" },
        { id: 111, expectedStage: 3, expectedNum: "19", desc: "S3 L19 (Webhook Error Case)" },
        { id: 50, expectedStage: 2, expectedNum: "1", desc: "S2 L1 (Visual Start)" },
        { id: 48, expectedStage: 2, expectedNum: "47", desc: "S2 L47 (Override Case)" },
        { id: 201, expectedStage: 3, expectedNum: "43", desc: "S3 L43 (Duplicate Case)" }
    ];

    console.log('🧪 Checking Critical Lots (Canaries):');
    for (const canary of canaries) {
        const logic = computeLotDetailsFromId(canary.id);
        const db = await prisma.lot.findUnique({ where: { id: canary.id } });

        if (!logic || !db) {
            console.error(`❌ Can't find ID ${canary.id} (${canary.desc})`);
            errors++;
            continue;
        }

        const logicMatch = String(logic.number) === canary.expectedNum && logic.stage === canary.expectedStage;
        const dbMatch = db.number === canary.expectedNum && db.stage === canary.expectedStage;

        if (logicMatch && dbMatch) {
            console.log(`✅ ID ${canary.id} (${canary.desc}): \tLogic OK \tDB OK \t-> [S${logic.stage} L${logic.number}]`);
        } else {
            console.error(`❌ ID ${canary.id} (${canary.desc}): MISMATCH`);
            if (!logicMatch) console.error(`   Logic says: S${logic?.stage} L${logic?.number} (Expected S${canary.expectedStage} L${canary.expectedNum})`);
            if (!dbMatch) console.error(`   DB says:    S${db.stage} L${db.number}    (Expected S${canary.expectedStage} L${canary.expectedNum})`);
            errors++;
        }
    }

    console.log('\n📊 Scanning Full Database (IDs 1-300)...');
    let mismatchCount = 0;

    for (let id = 1; id <= 300; id++) {
        const details = computeLotDetailsFromId(id);
        if (!details || !details.stage) continue;

        const db = await prisma.lot.findUnique({ where: { id } });
        if (!db) continue;

        if (db.number !== details.number || db.stage !== details.stage) {
            console.error(`❌ Mismatch ID ${id}: DB[S${db.stage} #${db.number}] vs LOGIC[S${details.stage} #${details.number}]`);
            mismatchCount++;
        }
    }

    if (mismatchCount === 0) {
        console.log('✅ Full Database Scan: 100% SYNCHRONIZED');
    } else {
        console.error(`❌ Full Database Scan: Found ${mismatchCount} mismatches.`);
        errors += mismatchCount;
    }

    console.log('--------------------------------------------------');
    if (errors === 0) {
        console.log('✨ SYSTEM STATUS: 100% HEALTHY. ALL DATA IS SYNCED. ✨');
    } else {
        console.error('⚠️ SYSTEM STATUS: ISSUES FOUND. PLEASE RUN RESYNC SCRIPT.');
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
