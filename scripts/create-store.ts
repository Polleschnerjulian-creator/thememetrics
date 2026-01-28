import { db, schema } from '../lib/db';
import { eq } from 'drizzle-orm';

async function createStore(shopDomain: string, accessToken: string) {
  console.log(`📝 Creating store: ${shopDomain}\n`);

  try {
    // Check if store already exists
    const existing = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shopDomain),
    });

    if (existing) {
      console.log('⚠️  Store already exists! Updating access token...');
      await db.update(schema.stores).set({
        accessToken,
        status: 'active',
        updatedAt: new Date(),
      }).where(eq(schema.stores.id, existing.id));
      console.log('✅ Access token updated!');
      return;
    }

    // Create new store
    const [newStore] = await db.insert(schema.stores).values({
      shopDomain,
      accessToken,
      plan: 'pro', // Give pro for testing
      status: 'active',
      installedAt: new Date(),
    }).returning();

    console.log(`✅ Store created with ID: ${newStore.id}`);

    // Create subscription
    await db.insert(schema.subscriptions).values({
      storeId: newStore.id,
      plan: 'pro',
      status: 'active',
    });

    console.log('✅ Subscription created (Pro plan)');
    console.log('\n🎉 Done! Refresh the app in Shopify Admin.');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

const shopDomain = process.argv[2];
const accessToken = process.argv[3];

if (!shopDomain || !accessToken) {
  console.log('Usage: npx tsx scripts/create-store.ts <shop-domain> <access-token>');
  console.log('Example: npx tsx scripts/create-store.ts thememetrics-test.myshopify.com shpat_xxxxx');
  console.log('\nTo get a new access token:');
  console.log('1. Go to Partner Dashboard → Apps → ThemeMetrics');
  console.log('2. Click "Generate new API token" or check App Setup');
  process.exit(1);
}

createStore(shopDomain, accessToken);
