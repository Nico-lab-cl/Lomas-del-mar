-- Script para marcar lotes vendidos en la base de datos
-- Ejecutar este script en la base de datos de producción

-- Etapa 1: Lotes 1, 2, 5, 6, 8, 28, 37, 42, 43, 45, 46
UPDATE "Lot" SET status = 'sold', updated_at = NOW() 
WHERE id IN (1, 2, 5, 6, 8, 28, 37, 42, 43, 45, 46);

-- Etapa 2: Lotes 1, 29, 47
-- Lote 1 de Etapa 2 = id 50
-- Lote 29 de Etapa 2 = id 78
-- Lote 47 de Etapa 2 = id 48
UPDATE "Lot" SET status = 'sold', updated_at = NOW() 
WHERE id IN (50, 78, 48);

-- Etapa 3: Lotes 26, 27, 42, 43
-- Lote 26 de Etapa 3 = id 118
-- Lote 27 de Etapa 3 = id 119
-- Lote 42 de Etapa 3 = id 202
-- Lote 43 de Etapa 3 = id 201
UPDATE "Lot" SET status = 'sold', updated_at = NOW() 
WHERE id IN (118, 119, 202, 201);

-- Etapa 4: Lotes 25, 41, 44, 45, 65
-- Lote 25 de Etapa 4 = id 156
-- Lote 41 de Etapa 4 = id 172
-- Lote 44 de Etapa 4 = id 175
-- Lote 45 de Etapa 4 = id 176
-- Lote 65 de Etapa 4 = id 196
UPDATE "Lot" SET status = 'sold', updated_at = NOW() 
WHERE id IN (156, 172, 175, 176, 196);

-- Verificar los cambios
SELECT id, number, stage, status FROM "Lot" WHERE status = 'sold' ORDER BY stage, CAST(number AS INTEGER);
