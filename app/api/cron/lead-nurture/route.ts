import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailLeads, scheduledEmails } from '@/lib/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/resend';
import { leadNurtureDay1, leadNurtureDay3, leadNurtureDay7 } from '@/lib/email/templates';
import { captureError } from '@/lib/monitoring';

// Vercel Cron: runs every hour
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    let sentCount = 0;
    let errorCount = 0;

    // Get all scheduled emails that are due
    const dueEmails = await db
      .select()
      .from(scheduledEmails)
      .where(
        and(
          eq(scheduledEmails.sent, false),
          lte(scheduledEmails.scheduledFor, now)
        )
      )
      .limit(50); // Process max 50 per run

    for (const scheduled of dueEmails) {
      try {
        // Get lead info if it's a lead email
        let leadData = null;
        if (scheduled.leadId) {
          const [lead] = await db
            .select()
            .from(emailLeads)
            .where(eq(emailLeads.id, scheduled.leadId));
          
          if (!lead || lead.status !== 'subscribed') {
            // Mark as sent to skip it
            await db
              .update(scheduledEmails)
              .set({ sent: true, sentAt: now })
              .where(eq(scheduledEmails.id, scheduled.id));
            continue;
          }
          leadData = lead;
        }

        // Generate email based on template
        let html: string;
        let subject: string;

        const data = {
          email: scheduled.email,
          shopUrl: leadData?.shopUrl || undefined,
          score: leadData?.speedScore || undefined,
        };

        switch (scheduled.template) {
          case 'lead-nurture-day1':
            html = leadNurtureDay1(data);
            subject = '3 Theme-Fehler, die dich Umsatz kosten 💸';
            break;
          case 'lead-nurture-day3':
            html = leadNurtureDay3(data);
            subject = 'Wie ein Store seinen Score um 40 Punkte verbesserte 📈';
            break;
          case 'lead-nurture-day7':
            html = leadNurtureDay7(data);
            subject = 'Exklusiv für dich: 20% Rabatt 🎁';
            break;
          default:
            continue;
        }

        await sendEmail({
          to: scheduled.email,
          subject,
          html,
        });

        // Mark as sent
        await db
          .update(scheduledEmails)
          .set({ sent: true, sentAt: now })
          .where(eq(scheduledEmails.id, scheduled.id));

        // Update lead's sequence step if applicable
        if (leadData) {
          const step = scheduled.template === 'lead-nurture-day1' ? 1 
            : scheduled.template === 'lead-nurture-day3' ? 3 
            : 7;
          
          await db
            .update(emailLeads)
            .set({
              welcomeSequenceStep: step,
              lastEmailSentAt: now,
              updatedAt: now,
            })
            .where(eq(emailLeads.id, leadData.id));
        }

        sentCount++;
      } catch (error) {
        captureError(error, { context: `Failed to send scheduled email ${scheduled.id}` });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      processed: dueEmails.length,
    });
  } catch (error) {
    captureError(error, { context: 'Lead nurture cron error' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
