import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// URL provided by the user
const url = "postgres://alimin:alimin2026@n8n_db-aliminv2:5432/db-alimin?sslmode=disable";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});

async function main() {
    const sqlPath = path.join(process.cwd(), 'fix_missing_column.sql');
    console.log(`Reading SQL from: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
        console.error("SQL file not found!");
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Simple split by semicolon to handle the two statements
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute.`);

    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        try {
            await prisma.$executeRawUnsafe(statement);
            console.log("Success.");
        } catch (e: any) {
            console.error("Error executing statement:");
            console.error(e.message);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
