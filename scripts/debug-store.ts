/**
 * Debug-Script um Store-Daten zu prüfen
 *
 * npx tsx scripts/debug-store.ts SHOP.myshopify.com
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

async function main() {
  const shopDomain = process.argv[2];

  if (!shopDomain) {
    console.error('Usage: npx tsx scripts/debug-store.ts SHOP.myshopify.com');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log(`\n🔍 Debugging store: ${shopDomain}\n`);

  // 1. Find store
  const store = await db.query.stores.findFirst({
    where: eq(schema.stores.shopDomain, shopDomain),
  });

  if (!store) {
    console.error('❌ Store NOT FOUND in database!');
    console.log('\nDer Store muss erst die App installieren.');
    process.exit(1);
  }

  console.log('✅ Store found:');
  console.log(`   ID: ${store.id}`);
  console.log(`   Domain: ${store.shopDomain}`);
  console.log(`   Plan: ${store.plan}`);
  console.log(`   Status: ${store.status}`);
  console.log(`   Installed: ${store.installedAt}`);
  console.log(`   Access Token: ${store.accessToken ? `${store.accessToken.substring(0, 10)}...` : '❌ MISSING!'}`);
  console.log(`   Scopes: ${store.scope || '❌ MISSING!'}`);

  // 2. Check subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.storeId, store.id),
  });

  if (subscription) {
    console.log('\n✅ Subscription found:');
    console.log(`   Plan: ${subscription.plan}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Period End: ${subscription.currentPeriodEnd}`);
  } else {
    console.log('\n⚠️  No subscription found');
  }

  // 3. Test Shopify API connection
  if (store.accessToken) {
    console.log('\n🔄 Testing Shopify API connection...');

    try {
      const response = await fetch(`https://${store.shopDomain}/admin/api/2024-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': store.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shopify API connection successful!');
        console.log(`   Shop Name: ${data.shop.name}`);
        console.log(`   Shop Email: ${data.shop.email}`);
      } else {
        const error = await response.text();
        console.error('❌ Shopify API error:', response.status);
        console.error('   Response:', error);

        if (response.status === 401) {
          console.log('\n⚠️  Access Token ist ungültig! App muss neu installiert werden.');
        }
      }
    } catch (err) {
      console.error('❌ Shopify API request failed:', err);
    }
  }

  // 4. Check themes
  if (store.accessToken) {
    console.log('\n🔄 Checking themes...');

    try {
      const response = await fetch(`https://${store.shopDomain}/admin/api/2024-10/themes.json`, {
        headers: {
          'X-Shopify-Access-Token': store.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Themes found:');
        data.themes.forEach((theme: any) => {
          console.log(`   - ${theme.name} (${theme.role}) [ID: ${theme.id}]`);
        });
      } else {
        console.error('❌ Could not fetch themes:', response.status);
      }
    } catch (err) {
      console.error('❌ Themes request failed:', err);
    }
  }

  console.log('\n✅ Debug complete!\n');
}

main().catch(console.error);
