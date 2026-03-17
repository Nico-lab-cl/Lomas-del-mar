import { Pool } from "pg";

/**
 * External Database Connection for aliminspa.cl
 * This pool connects to the remote PostgreSQL database to fetch web leads and newsletter subscribers.
 */

// Use environment variable for security
const externalConnectionString = process.env.EXTERNAL_DB_URL;

let pool: Pool | null = null;

export const getExternalPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: externalConnectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on external idle client", err);
    });
  }
  return pool;
};

export async function queryExternal(text: string, params?: any[]) {
  const start = Date.now();
  const pool = getExternalPool();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed external query", { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error("External Query Error:", err);
    throw err;
  }
}
