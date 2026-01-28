import { db } from '../lib/db';
import { stores, subscriptions, themes, themeAnalyses, sections, recommendations, performanceSnapshots, sectionAnalyses } from '../lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

async function resetStore(shopDomain: string) {
  console.log(`🗑️  Resetting store: ${shopDomain}\n`);

  try {
    // Find the store
    const store = await db.query.stores.findFirst({
      where: eq(stores.shopDomain, shopDomain),
    });

    if (!store) {
      console.log('❌ Store not found in database');
      return;
    }

    console.log(`Found store ID: ${store.id}`);
    console.log('\n🔄 Deleting related data...');

    // Get theme IDs for this store
    const storeThemes = await db.query.themes.findMany({
      where: eq(themes.storeId, store.id),
    });
    const themeIds = storeThemes.map(t => t.id);
    console.log(`   Found ${themeIds.length} themes`);

    // Get analysis IDs for this store
    const storeAnalyses = await db.query.themeAnalyses.findMany({
      where: eq(themeAnalyses.storeId, store.id),
    });
    const analysisIds = storeAnalyses.map(a => a.id);
    console.log(`   Found ${analysisIds.length} analyses`);

    // Helper function to safely delete from a table
    async function safeDelete(tableName: string, deletePromise: Promise<any>) {
      try {
        await deletePromise;
        console.log(`   ✅ ${tableName} deleted`);
      } catch (error: any) {
        if (error.code === '42P01') {
          console.log(`   ⏭️  ${tableName} - table doesn't exist, skipping`);
        } else {
          console.log(`   ⚠️  ${tableName} - ${error.message}`);
        }
      }
    }

    // Delete in correct order (respecting foreign keys)

    // 1. Delete section analyses (depends on themeAnalyses)
    if (analysisIds.length > 0) {
      await safeDelete('Section analyses',
        db.delete(sectionAnalyses).where(inArray(sectionAnalyses.analysisId, analysisIds))
      );
    }

    // 2. Delete sections (depends on themes)
    if (themeIds.length > 0) {
      await safeDelete('Sections',
        db.delete(sections).where(inArray(sections.themeId, themeIds))
      );
    }

    // 3. Delete performance snapshots (depends on themes)
    if (themeIds.length > 0) {
      await safeDelete('Performance snapshots',
        db.delete(performanceSnapshots).where(inArray(performanceSnapshots.themeId, themeIds))
      );
    }

    // 4. Try to delete from optional tables using raw SQL (they may not exist)
    const optionalTables = [
      { name: 'image_analyses', column: 'store_id' },
      { name: 'usage_tracking', column: 'store_id' },
      { name: 'promo_code_uses', column: 'store_id' },
      { name: 'email_subscriptions', column: 'store_id' },
      { name: 'email_leads', column: 'shop_url' }, // Different column
    ];

    for (const table of optionalTables) {
      try {
        if (table.name === 'email_leads') {
          await db.execute(sql.raw(`DELETE FROM ${table.name} WHERE ${table.column} LIKE '%${shopDomain}%'`));
        } else {
          await db.execute(sql.raw(`DELETE FROM ${table.name} WHERE ${table.column} = ${store.id}`));
        }
        console.log(`   ✅ ${table.name} deleted`);
      } catch (error: any) {
        if (error.code === '42P01') {
          console.log(`   ⏭️  ${table.name} - table doesn't exist, skipping`);
        } else {
          console.log(`   ⚠️  ${table.name} - ${error.message}`);
        }
      }
    }

    // 5. Delete recommendations
    await safeDelete('Recommendations',
      db.delete(recommendations).where(eq(recommendations.storeId, store.id))
    );

    // 6. Delete theme analyses
    await safeDelete('Theme analyses',
      db.delete(themeAnalyses).where(eq(themeAnalyses.storeId, store.id))
    );

    // 7. Delete themes
    await safeDelete('Themes',
      db.delete(themes).where(eq(themes.storeId, store.id))
    );

    // 8. Delete subscriptions
    await safeDelete('Subscriptions',
      db.delete(subscriptions).where(eq(subscriptions.storeId, store.id))
    );

    // 9. Delete the store itself
    await db.delete(stores).where(eq(stores.id, store.id));
    console.log('   ✅ Store deleted');

    console.log('\n✅ Store reset complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to: https://thememetrics-test.myshopify.com/admin/settings/apps');
    console.log('   2. Uninstall ThemeMetrics if still shown');
    console.log('   3. Reinstall the app via Partner Dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

// Get shop domain from command line
const shopDomain = process.argv[2];

if (!shopDomain) {
  console.log('Usage: npx tsx scripts/reset-store.ts <shop-domain>');
  console.log('Example: npx tsx scripts/reset-store.ts thememetrics-test.myshopify.com');
  process.exit(1);
}

resetStore(shopDomain);
