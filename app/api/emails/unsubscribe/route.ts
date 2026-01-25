import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe, updateEmailPreferences } from '@/lib/email';

// GET - Unsubscribe page (one-click unsubscribe)
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  // Simple unsubscribe - in production, verify token
  const success = await unsubscribe(email);

  if (success) {
    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      new URL('/unsubscribed?success=true', request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL('/unsubscribed?success=false', request.url)
    );
  }
}

// POST - Update preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action, preferences } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
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
    console.error('Unsubscribe API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
