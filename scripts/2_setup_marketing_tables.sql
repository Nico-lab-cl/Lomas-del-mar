-- =========================================================
-- PASO 2: CONECTARSE A LA NUEVA BASE DE DATOS 'crm_marketing'
-- Y EJECUTAR ESTO ALLÍ
-- =========================================================

-- 1. Crear extensión para IDs aleatorios
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Crear tabla de Campañas
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'SENT', 'FAILED'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Crear tabla de Logs de Envío
CREATE TABLE IF NOT EXISTS campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    lead_id TEXT NOT NULL, -- ID que viene del CRM principal
    email TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    status TEXT, -- 'DELIVERED', 'OPENED', 'CLICKED'
    error_message TEXT
);
