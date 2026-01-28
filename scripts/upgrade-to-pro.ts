/**
 * Script um einen Store auf Pro zu upgraden (für Testing)
 *
 * Ausführen mit:
 * npx tsx scripts/upgrade-to-pro.ts DEIN-SHOP.myshopify.com
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

async function main() {
  const shopDomain = process.argv[2];

  if (!shopDomain) {
    console.error('Usage: npx tsx scripts/upgrade-to-pro.ts SHOP-DOMAIN.myshopify.com');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Run with: DATABASE_URL=... npx tsx scripts/upgrade-to-pro.ts ...');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log(`Looking for store: ${shopDomain}`);

  // Find store
  const store = await db.query.stores.findFirst({
    where: eq(schema.stores.shopDomain, shopDomain),
  });

  if (!store) {
    console.error(`Store not found: ${shopDomain}`);
    process.exit(1);
  }

  console.log(`Found store: ${store.shopDomain} (ID: ${store.id})`);
  console.log(`Current plan: ${store.plan}`);

  // Update store plan
  await db.update(schema.stores)
    .set({ plan: 'pro' })
    .where(eq(schema.stores.id, store.id));

  // Update or create subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.storeId, store.id),
  });

  if (subscription) {
    await db.update(schema.subscriptions)
      .set({
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      })
      .where(eq(schema.subscriptions.id, subscription.id));
    console.log('Updated existing subscription to Pro');
  } else {
    await db.insert(schema.subscriptions).values({
      storeId: store.id,
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    console.log('Created new Pro subscription');
  }

  console.log(`\n✅ Store ${shopDomain} upgraded to PRO plan!`);
}

main().catch(console.error);
