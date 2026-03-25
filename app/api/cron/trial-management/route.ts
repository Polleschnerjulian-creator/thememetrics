export const dynamic = 'force-dynamic';

/**
 * Trial Management Cron Job (Placeholder)
 *
 * Currently disabled - will be implemented when trial system is set up.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { timingSafeEqual } = await import('crypto');
    if (!timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trial management not yet implemented
  return NextResponse.json({
    success: true,
    message: 'Trial management not yet configured',
  });
}
