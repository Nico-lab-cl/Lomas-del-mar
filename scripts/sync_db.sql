-- Script de sincronización manual para la base de datos CRM-Alimin
-- Ejecuta este script en tu gestor de base de datos (pgAdmin, terminal de Postgres, etc.)

-- 1. Actualizar tabla Lead
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "visited" BOOLEAN DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "interests" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastNoteAt" TIMESTAMP;

-- 2. Actualizar tabla User (por si acaso faltan estas columnas del perfil)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 3. Asegurar que los índices existan (opcional pero recomendado)
-- CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
