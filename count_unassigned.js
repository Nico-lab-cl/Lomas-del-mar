const { PrismaClient } = require('@prisma/client');

const databaseUrl = "postgresql://nicolas:nicolas@n8n_db-crm:5432/crm?sslmode=disable";
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.lead.count({
    where: {
      assignedToId: null,
      OR: [
        { source: { contains: 'META', mode: 'insensitive' } },
        { source: { contains: 'WEB', mode: 'insensitive' } }
      ]
    }
  });
  console.log(`Leads sin asignar (Meta/Web): ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
