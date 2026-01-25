import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = sql ? drizzle(sql, { schema }) : null as any;

export { schema };
