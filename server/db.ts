import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard PostgreSQL connection for local database
const sql = postgres(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Create a simple connection for session store
export const pool = sql;