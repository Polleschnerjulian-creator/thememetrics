import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
      get(_, prop) {
        throw new Error(
          `DATABASE_URL is not configured. Cannot access db.${String(prop)}. ` +
          'Ensure DATABASE_URL is set in your environment variables.'
        );
      },
    });
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export const db = createDb();
export { schema };
