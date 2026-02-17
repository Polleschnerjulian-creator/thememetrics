import { Resend } from 'resend';
import { captureError } from '@/lib/monitoring';
import { getUnsubscribeUrl } from './templates';

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY);

// Default from address
export const FROM_EMAIL = 'ThemeMetrics <hello@thememetrics.de>';
export const REPLY_TO = 'support@thememetrics.de';

// Email sending wrapper with error handling
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = REPLY_TO,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  try {
    // Inject signed unsubscribe URL into template
    const unsubscribeUrl = getUnsubscribeUrl(to);
    const processedHtml = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: processedHtml,
      text,
      replyTo: replyTo,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    captureError(error, 'Failed to send email');
    return { success: false, error };
  }
}
