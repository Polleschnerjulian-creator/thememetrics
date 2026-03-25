export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { captureError } from '@/lib/monitoring';
import { authenticateRequest, withCors } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code erforderlich' }, { status: 400 });
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

    // Atomically increment used_count ONLY if under maxUses limit
    // PostgreSQL row-level locking prevents race conditions
    const incrementResult = await db.execute<{ id: number }>(sql`
      UPDATE promo_codes
      SET used_count = COALESCE(used_count, 0) + 1
      WHERE id = ${promoCode.id}
        AND (max_uses IS NULL OR COALESCE(used_count, 0) < max_uses)
      RETURNING id
    `);

    if (incrementResult.rows.length === 0) {
      return NextResponse.json({ error: 'Dieser Code wurde bereits zu oft eingelöst' }, { status: 400 });
    }

    // Record the promo code use (unique constraint prevents double-redemption)
    try {
      await db.insert(schema.promoCodeUses).values({
        promoCodeId: promoCode.id,
        storeId: store.id,
      });
    } catch (insertError: any) {
      // If unique constraint violation, another request already redeemed
      if (insertError?.code === '23505') {
        // Compensate: decrement the count we just incremented
        await db.execute(sql`
          UPDATE promo_codes SET used_count = GREATEST(COALESCE(used_count, 1) - 1, 0)
          WHERE id = ${promoCode.id}
        `);
        return NextResponse.json({ error: 'Du hast diesen Code bereits eingelöst' }, { status: 400 });
      }
      throw insertError;
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

    // Also update stores.plan to keep both tables in sync
    await db.update(schema.stores)
      .set({ plan: promoCode.plan })
      .where(eq(schema.stores.id, store.id));

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
