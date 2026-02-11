# Instrucciones para Actualizar Lotes Vendidos

## Problema
Los lotes vendidos están configurados en el código (`seed.ts`) pero la base de datos de producción aún no refleja estos cambios.

## Solución

### Opción 1: Ejecutar SQL Directamente (MÁS RÁPIDO)

1. **Conectarse a la base de datos de Easypanel**:
   - Ir a Easypanel → Servicios → PostgreSQL
   - Abrir terminal o cliente SQL
   - Conectar a la base de datos `db-alimin`

2. **Ejecutar el script SQL**:
   ```bash
   # Copiar el contenido de prisma/update-sold-lots.sql
   # Y ejecutarlo en la base de datos
   ```

3. **Verificar cambios**:
   ```sql
   SELECT id, number, stage, status FROM "Lot" WHERE status = 'sold' ORDER BY stage, CAST(number AS INTEGER);
   ```

### Opción 2: Re-ejecutar Seed en Producción

1. **Conectarse al contenedor de Alimaniv2 en Easypanel**
2. **Ejecutar**:
   ```bash
   npx prisma db seed
   ```

### Opción 3: Hacer Deploy con Seed Automático

1. **Verificar que `package.json` tiene**:
   ```json
   "prisma": {
     "seed": "tsx prisma/seed.ts"
   }
   ```

2. **Hacer deploy** - El seed se ejecutará automáticamente

## Lotes que deben estar en ROJO (Vendidos)

### Etapa 1
- Lote 1, 2, 5, 6, 8, 28, 37, 42, 43, 45, 46

### Etapa 2
- Lote 1, 29, 47

### Etapa 3
- Lote 26, 27, 42, 43

### Etapa 4
- Lote 25, 41, 44, 45, 65

## Verificación

Después de ejecutar, los lotes deben aparecer en **ROJO** en el mapa y **NO deben ser clickeables**.
