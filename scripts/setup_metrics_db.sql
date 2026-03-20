-- ---------------------------------------------------------
-- PARTE 1: Configuración en la base de datos ACTUAL (crm)
-- Ejecutar estas líneas mientras estás conectado a la DB 'crm'
-- ---------------------------------------------------------

-- 1. Crear el usuario para el nuevo CRM (Solo Lectura)
-- Reemplaza 'TU_PASSWORD_SEGURA' por una real
CREATE USER metrics_viewer WITH PASSWORD 'TU_PASSWORD_SEGURA';

-- 2. Dar permisos de conexión
GRANT CONNECT ON DATABASE crm TO metrics_viewer;
GRANT USAGE ON SCHEMA public TO metrics_viewer;

-- 3. Dar permisos de SOLO LECTURA en las tablas críticas
GRANT SELECT ON "Lead" TO metrics_viewer;
GRANT SELECT ON "User" TO metrics_viewer;
GRANT SELECT ON "Notification" TO metrics_viewer;

-- 4. Asegurar que futuras tablas (si las hay) no sean editables por este usuario
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metrics_viewer;


-- ---------------------------------------------------------
-- PARTE 2: Creación de la base de datos de MARKETING
-- Ejecutar estas líneas en tu servidor PostgreSQL
-- ---------------------------------------------------------

-- 1. Crear la base de datos independiente
CREATE DATABASE crm_marketing;

-- 2. Conectarse a 'crm_marketing' y crear las tablas base para Email Marketing
-- (Esto lo puede hacer Prisma automáticamente en el nuevo proyecto, 
-- pero aquí te dejo el SQL por si lo necesitas)

\c crm_marketing

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'SENT', 'FAILED'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    lead_id TEXT NOT NULL, -- ID que viene del CRM principal
    email TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    status TEXT, -- 'DELIVERED', 'OPENED', 'CLICKED'
    error_message TEXT
);
