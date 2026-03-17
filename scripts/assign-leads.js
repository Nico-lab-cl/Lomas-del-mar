/**
 * Script para asignar leads masivamente desde un CSV a un asesor.
 * 
 * USO:
 *   node scripts/assign-leads.js <CSV_PATH> <USER_ID>
 *
 * EJEMPLO:
 *   node scripts/assign-leads.js "../Export_Contacts_Barbara A_Mar_2026_11_15_AM.csv" "uuid-de-barbara"
 *
 * PREREQUISITO:
 *   - Debes tener acceso a la base de datos del CRM.
 *   - Ejecuta: SELECT id, username, name FROM "User"; para obtener los IDs.
 *
 * ALTERNATIVA SQL DIRECTA (ejecutar en Easypanel):
 *   -- Paso 1: Obtener el ID de Barbara
 *   SELECT id, name FROM "User" WHERE name ILIKE '%Barbara%';
 *   
 *   -- Paso 2: Asignar todos los leads de source 'import csv' que coincidan
 *   -- (reemplaza <ID> con el resultado del paso 1)
 *   UPDATE "Lead" SET "assignedToId" = '<ID>' WHERE "contactId" IN (
 *     -- lista de contactIds del CSV de Barbara
 *   );
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const csvPath = process.argv[2];
  const userId = process.argv[3];

  if (!csvPath || !userId) {
    console.log('USO: node scripts/assign-leads.js <CSV_PATH> <USER_ID>');
    console.log('');
    console.log('Para obtener el USER_ID, ejecuta en la base de datos:');
    console.log('  SELECT id, username, name FROM "User";');
    process.exit(1);
  }

  const fullPath = path.resolve(csvPath);
  console.log(`📂 Leyendo CSV: ${fullPath}`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  console.log(`📊 Total de registros: ${dataLines.length}`);

  // Extract emails (column index 4)
  const emails = [];
  for (const line of dataLines) {
    // Simple CSV parser for quoted fields
    const match = line.match(/"([^"]*)"/g);
    if (match && match.length >= 5) {
      const email = match[4].replace(/"/g, '').trim().toLowerCase();
      if (email && email.includes('@')) {
        emails.push(email);
      }
    }
  }

  console.log(`📧 Emails encontrados: ${emails.length}`);

  // Generate SQL directly (more reliable than API for initial setup)
  const sqlOutput = path.join(path.dirname(fullPath), `assign_${path.basename(csvPath, '.csv')}.sql`);
  
  // Build SQL in batches
  let sql = `-- Script de asignación masiva\n`;
  sql += `-- Generado: ${new Date().toISOString()}\n`;
  sql += `-- CSV: ${path.basename(csvPath)}\n`;
  sql += `-- Target User ID: ${userId}\n\n`;

  const batchSize = 200;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const emailList = batch.map(e => `'${e.replace(/'/g, "''")}'`).join(',\n  ');
    sql += `UPDATE "Lead" SET "assignedToId" = '${userId}'\nWHERE LOWER("email") IN (\n  ${emailList}\n);\n\n`;
  }

  sql += `-- Verificación: contar leads asignados\nSELECT COUNT(*) as "total_asignados" FROM "Lead" WHERE "assignedToId" = '${userId}';\n`;

  fs.writeFileSync(sqlOutput, sql);
  console.log(`\n✅ Script SQL generado: ${sqlOutput}`);
  console.log(`   Ejecuta este archivo en tu consola de Easypanel para asignar los leads.`);
}

main().catch(console.error);
