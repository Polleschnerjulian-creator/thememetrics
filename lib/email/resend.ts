import { Resend } from 'resend';

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
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
      replyTo,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
