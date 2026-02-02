import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.BUILD_MODE === 'true';

export const prisma =
    globalForPrisma.prisma ||
    (isBuild
        ? new Proxy({} as PrismaClient, {
            get() {
                throw new Error("Prisma accessed during build time. This should not happen for dynamic routes.");
            }
        })
        : new PrismaClient({
            log: ['query'],
        }));

import { bootstrapDatabase } from './bootstrap';

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// SELF-HEALING: Run bootstrap once on server start (simulation)
// In Next.js serverless this might run multiple times, but since logic is idempotent it's fine.
// In Docker 'standalone' server.js, this runs once per process.
if (!globalForPrisma.prisma) {
    // Only run on fresh start
    bootstrapDatabase(prisma).catch(err => console.error('Bootstrap failed', err));
}
