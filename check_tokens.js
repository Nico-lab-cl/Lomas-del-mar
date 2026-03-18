const { PrismaClient } = require('@prisma/client');

const databaseUrl = "postgresql://nicolas:nicolas@n8n_db-crm:5432/crm?sslmode=disable";
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      fcmToken: true
    }
  });
  console.log("Estado de Tokens FCM:");
  users.forEach(u => {
    console.log(`- ${u.name}: ${u.fcmToken ? '✅ Registrado' : '❌ Sin Token (Debe aceptar permisos)'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
