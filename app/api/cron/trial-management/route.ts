export const dynamic = 'force-dynamic';

/**
 * Trial Management Cron Job (Placeholder)
 *
 * Currently disabled - will be implemented when trial system is set up.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trial management not yet implemented
  return NextResponse.json({
    success: true,
    message: 'Trial management not yet configured',
  });
}
