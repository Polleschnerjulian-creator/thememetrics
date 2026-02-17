import { NextRequest, NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendAnalysisCompleteEmail,
  sendScoreAlertEmail,
  sendLeadNurtureEmail,
} from '@/lib/email';
import { captureError } from '@/lib/monitoring';
import { authenticateRequest, withCors } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication — only authenticated stores can trigger emails
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }

    const body = await request.json();
    const { type, ...data } = body;

    let result;

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(data.storeId);
        break;

      case 'analysis-complete':
        result = await sendAnalysisCompleteEmail(
          data.storeId,
          data.themeName,
          data.score,
          data.criticalCount
        );
        break;

      case 'score-alert':
        result = await sendScoreAlertEmail(
          data.storeId,
          data.oldScore,
          data.newScore,
          data.changeReason
        );
        break;

      case 'lead-nurture':
        result = await sendLeadNurtureEmail(data.leadId, data.step);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true, id: result.id });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    captureError(error as Error, { tags: { route: 'emails/send' } });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { OPTIONS } from '@/lib/auth';
