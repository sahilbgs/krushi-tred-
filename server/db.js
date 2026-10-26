import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.database') });

const { Pool, types } = pg;

// Return PostgreSQL DATE (OID 1082) directly as clean 'YYYY-MM-DD' string
types.setTypeParser(1082, (val) => val);
// Return PostgreSQL NUMERIC (OID 1700) directly as JavaScript float
types.setTypeParser(1700, (val) => val === null ? 0 : parseFloat(val));

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'gtu_admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'krushi_trade',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});
