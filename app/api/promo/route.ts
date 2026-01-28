export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { captureError } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, shop } = body;

    if (!code || !shop) {
      return NextResponse.json({ error: 'Code und Shop erforderlich' }, { status: 400 });
    }

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shop),
    });

    if (!store) {
      return NextResponse.json({ error: 'Store nicht gefunden' }, { status: 404 });
    }

    // Find promo code
    const promoCode = await db.query.promoCodes.findFirst({
      where: eq(schema.promoCodes.code, code.toUpperCase()),
    });

    if (!promoCode) {
      return NextResponse.json({ error: 'Ungültiger Promo-Code' }, { status: 404 });
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json({ error: 'Dieser Code ist nicht mehr aktiv' }, { status: 400 });
    }

    // Check if expired
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Dieser Code ist abgelaufen' }, { status: 400 });
    }

    // Check max uses
    if (promoCode.maxUses && (promoCode.usedCount || 0) >= promoCode.maxUses) {
      return NextResponse.json({ error: 'Dieser Code wurde bereits zu oft eingelöst' }, { status: 400 });
    }

    // Check if store already used this code
    const existingUse = await db.query.promoCodeUses.findFirst({
      where: and(
        eq(schema.promoCodeUses.promoCodeId, promoCode.id),
        eq(schema.promoCodeUses.storeId, store.id)
      ),
    });

    if (existingUse) {
      return NextResponse.json({ error: 'Du hast diesen Code bereits eingelöst' }, { status: 400 });
    }

    // Calculate expiration date for the subscription
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + (promoCode.durationMonths || 1));

    // Update or create subscription
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.storeId, store.id),
    });

    if (existingSub) {
      await db.update(schema.subscriptions)
        .set({
          plan: promoCode.plan,
          status: 'active',
          currentPeriodEnd: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.subscriptions.id, existingSub.id));
    } else {
      await db.insert(schema.subscriptions).values({
        storeId: store.id,
        plan: promoCode.plan,
        status: 'active',
        currentPeriodEnd: expiresAt,
      });
    }

    // Record the promo code use
    await db.insert(schema.promoCodeUses).values({
      promoCodeId: promoCode.id,
      storeId: store.id,
    });

    // Increment used count
    await db.update(schema.promoCodes)
      .set({ usedCount: (promoCode.usedCount || 0) + 1 })
      .where(eq(schema.promoCodes.id, promoCode.id));

    return NextResponse.json({
      success: true,
      plan: promoCode.plan,
      durationMonths: promoCode.durationMonths,
      expiresAt: expiresAt.toISOString(),
      message: `${promoCode.plan.charAt(0).toUpperCase() + promoCode.plan.slice(1)} Plan für ${promoCode.durationMonths} Monat(e) aktiviert!`,
    });
  } catch (error) {
    captureError(error, { context: 'Promo code error' });
    return NextResponse.json(
      { error: 'Fehler beim Einlösen des Codes' },
      { status: 500 }
    );
  }
}

export { OPTIONS } from '@/lib/auth';
