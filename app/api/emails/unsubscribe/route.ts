import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe, updateEmailPreferences } from '@/lib/email';
import { captureError } from '@/lib/monitoring';
import { verifyHmacToken } from '@/lib/crypto';

// GET - Unsubscribe page (one-click unsubscribe from email links)
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  // Verify HMAC token to prevent unauthorized unsubscribe attacks
  if (!token || !verifyHmacToken(email, token)) {
    return NextResponse.redirect(
      new URL('/unsubscribed?success=false&reason=invalid_token', request.url)
    );
  }

  const success = await unsubscribe(email);

  if (success) {
    return NextResponse.redirect(
      new URL('/unsubscribed?success=true', request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL('/unsubscribed?success=false', request.url)
    );
  }
}

// POST - Update preferences (also requires token verification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, action, preferences } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify HMAC token
    if (!token || !verifyHmacToken(email, token)) {
      return NextResponse.json(
        { error: 'Invalid or missing token' },
        { status: 403 }
      );
    }

    if (action === 'unsubscribe') {
      const success = await unsubscribe(email);
      return NextResponse.json({ success });
    }

    if (action === 'update' && preferences) {
      const success = await updateEmailPreferences(email, preferences);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    captureError(error as Error, { tags: { route: 'emails/unsubscribe' } });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { OPTIONS } from '@/lib/auth';
