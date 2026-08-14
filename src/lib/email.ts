import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { 
  generateDropAnnouncementEmailHtml, 
  generateOrderConfirmationEmailHtml, 
  generateWelcomeEmailHtml, 
  DropCampaignOptions 
} from './email-templates';

// 1. Resend Setup
const resendApiKey = process.env.RESEND_API_KEY;
const isRealResend = resendApiKey && !resendApiKey.includes('mock') && !resendApiKey.includes('placeholder') && resendApiKey.startsWith('re_');

let resendClient: Resend | null = null;
if (isRealResend) {
  resendClient = new Resend(resendApiKey);
}

// 2. SMTP / Gmail Setup
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

let smtpTransporter: nodemailer.Transporter | null = null;
if (smtpUser && smtpPass) {
  smtpTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

const FROM_EMAIL = process.env.EMAIL_FROM || (smtpUser ? `BAGIFYYYY <${smtpUser}>` : 'BAGIFYYYY <onboarding@resend.dev>');

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Universal email sender with Resend & SMTP/Gmail fallbacks
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // Option A: Send via Resend
  if (isRealResend && resendClient) {
    try {
      const data = await resendClient.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log('[RESEND SUCCESS]', data);
      return { success: true, provider: 'resend', data };
    } catch (error: any) {
      console.error('Resend delivery error:', error);
      return { success: false, error: error.message || 'Resend error' };
    }
  }

  // Option B: Send via SMTP / Gmail / Google Workspace
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      });
      console.log('[SMTP SUCCESS] Message ID:', info.messageId);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (error: any) {
      console.error('SMTP delivery error:', error);
      return { success: false, error: error.message || 'SMTP error' };
    }
  }

  // Option C: Simulation Mode (No real credentials provided yet)
  console.log(`[EMAIL SIMULATION] (No live key set) To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: "${subject}"`);
  return { 
    success: true, 
    simulated: true, 
    message: 'Email simulated. Add RESEND_API_KEY or SMTP_USER/SMTP_PASS in .env to deliver to real inboxes.' 
  };
}

/**
 * Dispatch a Fashion Drop Campaign to all subscribers
 */
export async function sendDropCampaignBroadcast(
  recipientEmails: string[],
  campaignOptions: DropCampaignOptions,
  subjectLine?: string
) {
  const html = generateDropAnnouncementEmailHtml(campaignOptions);
  const subject = subjectLine || `✦ NEW DROP LIVE: ${campaignOptions.headline || 'Exclusive Y2K Archive'} (${campaignOptions.promoBadge || 'Limited Drop'})`;

  return await sendEmail({
    to: recipientEmails,
    subject,
    html,
  });
}

/**
 * Send Transactional Order Confirmation Receipt
 */
export async function sendOrderConfirmationEmail(order: any) {
  if (!order.customerEmail) return;

  const html = generateOrderConfirmationEmailHtml(order);
  const subject = `Order Confirmed: #${order.orderNumber} - Thank You for Shopping with BAGIFYYYY!`;

  return await sendEmail({
    to: order.customerEmail,
    subject,
    html,
  });
}

/**
 * Send Welcome Newsletter Email with Discount Code
 */
export async function sendWelcomeNewsletterEmail(email: string) {
  const html = generateWelcomeEmailHtml(email);
  const subject = '✦ Welcome to the BAGIFYYYY Collective (Here is 10% OFF Your First Drop)';

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}
