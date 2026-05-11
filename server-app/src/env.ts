import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const ENV = {
  port: parseInt(process.env.PORT || '3737'),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/onesoft_erp',
  jwtSecret: process.env.JWT_SECRET || 'onesoft-erp-secret-2024',
  cookieName: 'onesoft_session',
  sessionExpiry: 30 * 24 * 60 * 60 * 1000, // 30 يوم
};
