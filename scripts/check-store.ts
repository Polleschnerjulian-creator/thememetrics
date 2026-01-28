import { db } from '../lib/db';
import { stores, subscriptions } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkStore(shopDomain: string) {
  console.log(`🔍 Checking store: ${shopDomain}\n`);

  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.shopDomain, shopDomain),
    });

    if (!store) {
      console.log('❌ Store NOT FOUND in database!');
      console.log('\n🔍 Listing all stores in database:');

      const allStores = await db.query.stores.findMany();
      if (allStores.length === 0) {
        console.log('   (no stores found)');
      } else {
        allStores.forEach(s => {
          console.log(`   - ${s.shopDomain} (ID: ${s.id}, Status: ${s.status})`);
        });
      }
    } else {
      console.log('✅ Store found:');
      console.log(`   ID: ${store.id}`);
      console.log(`   Domain: ${store.shopDomain}`);
      console.log(`   Plan: ${store.plan}`);
      console.log(`   Status: ${store.status}`);
      console.log(`   Access Token: ${store.accessToken?.substring(0, 10)}...`);
      console.log(`   Installed: ${store.installedAt}`);

      // Check subscription
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.storeId, store.id),
      });

      if (sub) {
        console.log('\n✅ Subscription found:');
        console.log(`   Plan: ${sub.plan}`);
        console.log(`   Status: ${sub.status}`);
      } else {
        console.log('\n❌ No subscription found!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

const shopDomain = process.argv[2] || 'thememetrics-test.myshopify.com';
checkStore(shopDomain);
