-- =========================================================
-- PASO 1: EJECUTAR ESTO EN LA BASE DE DATOS 'crm'
-- =========================================================

-- 1. Crear el usuario (si ya existe, no hará nada)
-- Ya lo hiciste con éxito, pero lo dejo por si acaso.
-- CREATE USER metrics_viewer WITH PASSWORD 'chris.2026';

-- 2. Permisos básicos
GRANT CONNECT ON DATABASE crm TO metrics_viewer;
GRANT USAGE ON SCHEMA public TO metrics_viewer;

-- 3. Permisos de SOLO LECTURA
GRANT SELECT ON "Lead" TO metrics_viewer;
GRANT SELECT ON "User" TO metrics_viewer;
GRANT SELECT ON "Notification" TO metrics_viewer;

-- 4. Futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metrics_viewer;
