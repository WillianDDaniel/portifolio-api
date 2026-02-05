import 'dotenv-flow/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Create HTTP client (no TCP pool)
const sql = neon(process.env.DATABASE_URL!);

// Drizzle instance
export const db = drizzle(sql, { schema });
