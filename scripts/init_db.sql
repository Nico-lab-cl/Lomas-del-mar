-- Database: crm
-- Description: Initialization script for CRM Asesores

-- Create Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ASESOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Create Leads table
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "businessName" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "tags" TEXT,
    "lastActivity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Insert initial users (Admins and Advisors)
INSERT INTO "User" ("id", "username", "password", "name", "role", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'admin@aliminspa.cl', 'patricio.alimin2026', 'Admin Alimin', 'ADMIN', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'marcela.e@aliminspa.cl', 'marcela.alimin2026', 'Marcela E', 'ASESOR', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Orlando.c@aliminspa.cl', 'orlando.alimin2026', 'Orlando C', 'ASESOR', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Barbara.a@aliminspa.cl', 'barbara.alimin2026', 'Barbara A', 'ASESOR', CURRENT_TIMESTAMP)
ON CONFLICT ("username") DO UPDATE SET
    "password" = EXCLUDED."password",
    "role" = EXCLUDED."role",
    "updatedAt" = CURRENT_TIMESTAMP;
