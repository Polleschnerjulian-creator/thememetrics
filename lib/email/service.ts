import { db } from '@/lib/db';
import { emailSubscriptions, emailLogs, scheduledEmails, emailLeads, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from './resend';
import {
  welcomeEmail,
  analysisCompleteEmail,
  weeklyReportEmail,
  scoreAlertEmail,
  leadNurtureDay1,
  leadNurtureDay3,
  leadNurtureDay7,
  WelcomeEmailData,
  AnalysisCompleteEmailData,
  WeeklyReportEmailData,
  ScoreAlertEmailData,
  LeadNurtureEmailData,
} from './templates';

// ==========================================
// SUBSCRIPTION MANAGEMENT
// ==========================================

export async function createEmailSubscription(
  email: string,
  storeId?: number,
  type: 'lead' | 'user' | 'agency' = 'user'
) {
  try {
    const [subscription] = await db
      .insert(emailSubscriptions)
      .values({
        email,
        storeId,
        type,
      })
      .onConflictDoNothing()
      .returning();

    return subscription;
  } catch (error) {
    console.error('Failed to create email subscription:', error);
    return null;
  }
}

export async function updateEmailPreferences(
  email: string,
  preferences: {
    weeklyReports?: boolean;
    scoreAlerts?: boolean;
    productUpdates?: boolean;
  }
) {
  try {
    await db
      .update(emailSubscriptions)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(emailSubscriptions.email, email));

    return true;
  } catch (error) {
    console.error('Failed to update email preferences:', error);
    return false;
  }
}

export async function unsubscribe(email: string) {
  try {
    await db
      .update(emailSubscriptions)
      .set({
        status: 'unsubscribed',
        updatedAt: new Date(),
      })
      .where(eq(emailSubscriptions.email, email));

    // Also update leads table if exists
    await db
      .update(emailLeads)
      .set({
        status: 'unsubscribed',
        updatedAt: new Date(),
      })
      .where(eq(emailLeads.email, email));

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

// ==========================================
// EMAIL LOGGING
// ==========================================

async function logEmail(
  email: string,
  template: string,
  subject: string,
  resendId?: string,
  subscriptionId?: number,
  leadId?: number
) {
  try {
    await db.insert(emailLogs).values({
      email,
      template,
      subject,
      resendId,
      subscriptionId,
      leadId,
      status: 'sent',
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

// ==========================================
// TRANSACTIONAL EMAILS
// ==========================================

export async function sendWelcomeEmail(storeId: number) {
  try {
    // Get store info
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) return { success: false, error: 'Store not found' };

    // Extract shop name from domain
    const storeName = store.shopDomain.replace('.myshopify.com', '');
    const dashboardUrl = `https://thememetrics.de/dashboard?shop=${store.shopDomain}`;

    const data: WelcomeEmailData = {
      storeName,
      dashboardUrl,
    };

    const html = welcomeEmail(data);
    const subject = `Willkommen bei ThemeMetrics, ${storeName}! 🎉`;

    // Get or create email from store (we'd need to store email in stores table ideally)
    // For now, we'll skip if no email - in production, get from Shopify API
    const email = `${storeName}@example.com`; // Placeholder - replace with actual email

    const result = await sendEmail({
      to: email,
      subject,
      html,
    });

    if (result.success) {
      // Create subscription
      const subscription = await createEmailSubscription(email, storeId, 'user');
      
      // Log the email
      await logEmail(email, 'welcome', subject, result.id, subscription?.id);
    }

    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

export async function sendAnalysisCompleteEmail(
  storeId: number,
  themeName: string,
  score: number,
  criticalCount: number
) {
  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) return { success: false, error: 'Store not found' };

    const storeName = store.shopDomain.replace('.myshopify.com', '');
    const dashboardUrl = `https://thememetrics.de/dashboard?shop=${store.shopDomain}`;

    const data: AnalysisCompleteEmailData = {
      storeName,
      themeName,
      score,
      criticalCount,
      dashboardUrl,
    };

    const html = analysisCompleteEmail(data);
    const subject = `Analyse fertig: Score ${score} für ${themeName} 📊`;

    // Get subscriber email
    const [subscription] = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.storeId, storeId));

    if (!subscription) return { success: false, error: 'No subscription found' };

    const result = await sendEmail({
      to: subscription.email,
      subject,
      html,
    });

    if (result.success) {
      await logEmail(subscription.email, 'analysis-complete', subject, result.id, subscription.id);
    }

    return result;
  } catch (error) {
    console.error('Failed to send analysis complete email:', error);
    return { success: false, error };
  }
}

export async function sendScoreAlertEmail(
  storeId: number,
  oldScore: number,
  newScore: number,
  changeReason?: string
) {
  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) return { success: false, error: 'Store not found' };

    // Check if user has alerts enabled
    const [subscription] = await db
      .select()
      .from(emailSubscriptions)
      .where(
        and(
          eq(emailSubscriptions.storeId, storeId),
          eq(emailSubscriptions.scoreAlerts, true)
        )
      );

    if (!subscription) return { success: false, error: 'Alerts disabled or no subscription' };

    const storeName = store.shopDomain.replace('.myshopify.com', '');
    const dashboardUrl = `https://thememetrics.de/dashboard?shop=${store.shopDomain}`;

    const data: ScoreAlertEmailData = {
      storeName,
      oldScore,
      newScore,
      changeReason,
      dashboardUrl,
    };

    const html = scoreAlertEmail(data);
    const scoreDiff = newScore - oldScore;
    const subject = scoreDiff > 0
      ? `🎉 Dein Score ist gestiegen: ${oldScore} → ${newScore}`
      : `⚠️ Score-Drop erkannt: ${oldScore} → ${newScore}`;

    const result = await sendEmail({
      to: subscription.email,
      subject,
      html,
    });

    if (result.success) {
      await logEmail(subscription.email, 'score-alert', subject, result.id, subscription.id);
    }

    return result;
  } catch (error) {
    console.error('Failed to send score alert email:', error);
    return { success: false, error };
  }
}

// ==========================================
// LEAD NURTURE EMAILS
// ==========================================

export async function sendLeadNurtureEmail(leadId: number, step: number) {
  try {
    const [lead] = await db
      .select()
      .from(emailLeads)
      .where(eq(emailLeads.id, leadId));

    if (!lead || lead.status !== 'subscribed') {
      return { success: false, error: 'Lead not found or unsubscribed' };
    }

    const data: LeadNurtureEmailData = {
      email: lead.email,
      shopUrl: lead.shopUrl || undefined,
      score: lead.speedScore || undefined,
    };

    let html: string;
    let subject: string;
    let template: string;

    switch (step) {
      case 1:
        html = leadNurtureDay1(data);
        subject = '3 Theme-Fehler, die dich Umsatz kosten 💸';
        template = 'lead-nurture-day1';
        break;
      case 3:
        html = leadNurtureDay3(data);
        subject = 'Wie ein Store seinen Score um 40 Punkte verbesserte 📈';
        template = 'lead-nurture-day3';
        break;
      case 7:
        html = leadNurtureDay7(data);
        subject = 'Exklusiv für dich: 20% Rabatt 🎁';
        template = 'lead-nurture-day7';
        break;
      default:
        return { success: false, error: 'Invalid step' };
    }

    const result = await sendEmail({
      to: lead.email,
      subject,
      html,
    });

    if (result.success) {
      await logEmail(lead.email, template, subject, result.id, undefined, lead.id);

      // Update lead's sequence step
      await db
        .update(emailLeads)
        .set({
          welcomeSequenceStep: step,
          lastEmailSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailLeads.id, leadId));
    }

    return result;
  } catch (error) {
    console.error('Failed to send lead nurture email:', error);
    return { success: false, error };
  }
}

// ==========================================
// SCHEDULED EMAILS (for Cron Jobs)
// ==========================================

export async function scheduleEmail(
  email: string,
  template: string,
  scheduledFor: Date,
  subscriptionId?: number,
  leadId?: number
) {
  try {
    await db.insert(scheduledEmails).values({
      email,
      template,
      scheduledFor,
      subscriptionId,
      leadId,
    });
    return true;
  } catch (error) {
    console.error('Failed to schedule email:', error);
    return false;
  }
}

export async function scheduleLeadNurtureSequence(leadId: number, email: string) {
  const now = new Date();

  // Day 1 - immediately or next day
  const day1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await scheduleEmail(email, 'lead-nurture-day1', day1, undefined, leadId);

  // Day 3
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  await scheduleEmail(email, 'lead-nurture-day3', day3, undefined, leadId);

  // Day 7
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await scheduleEmail(email, 'lead-nurture-day7', day7, undefined, leadId);
}
