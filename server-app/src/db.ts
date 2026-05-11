import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { ENV } from './env.js';
import * as schema from './schema.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: ENV.dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
export { pool };
