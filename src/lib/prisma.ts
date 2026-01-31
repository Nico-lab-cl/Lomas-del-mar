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
            datasourceUrl: process.env.DATABASE_URL,
            log: ['query'],
        }));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
