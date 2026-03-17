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

-- Insert initial admin user (password should be hashed in a real app, 
-- but I will provide a placeholder or use the requested one)
-- Using 'nicolas' as password for now as per user request
INSERT INTO "User" ("id", "username", "password", "name", "role", "updatedAt")
VALUES (
    'initial-admin-id', 
    'nicolas', 
    'nicolas', 
    'Nicolas', 
    'ADMIN', 
    CURRENT_TIMESTAMP
) ON CONFLICT ("username") DO NOTHING;
