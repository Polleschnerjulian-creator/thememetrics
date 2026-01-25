import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Only initialize on server-side (when DATABASE_URL exists)
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Use type assertion for client-side where db won't be used
export const db = sql 
  ? drizzle(sql, { schema }) 
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export { schema };
