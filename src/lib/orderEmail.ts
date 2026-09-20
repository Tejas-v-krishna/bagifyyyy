import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail, sendEmail } from '@/lib/email';

/**
 * Email the ops inbox when a captured payment needs a human (the automatic
 * refund could not be issued). Best-effort — a mail failure must never mask
 * the original error, which callers still log.
 */
export async function alertManualRefundRequired(input: {
  paymentId: string;
  orderNumber: string;
  amountInPaise: number | null;
  reason: string;
}): Promise<void> {
  const to =
    process.env.SUPPORT_ALERT_EMAIL || process.env.ADMIN_EMAIL || 'support@bagifyyyy.com';
  const amount =
    typeof input.amountInPaise === 'number' ? `₹${(input.amountInPaise / 100).toFixed(2)}` : 'unknown';
  try {
    await sendEmail({
      to,
      subject: `[ACTION REQUIRED] Manual refund needed — ${input.orderNumber}`,
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f5e9;">
          <h2 style="font-family: sans-serif; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #b00020;">
            Manual refund required
          </h2>
          <p style="color: #232D3B; line-height: 1.7;">
            A captured payment could not be refunded automatically. Please issue the refund in the
            Razorpay dashboard.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 6px 0; color: #666; font-size: 12px;">Order</td><td style="padding: 6px 0; font-weight: bold; color: #232D3B;">${input.orderNumber}</td></tr>
            <tr><td style="padding: 6px 0; color: #666; font-size: 12px;">Payment ID</td><td style="padding: 6px 0; font-weight: bold; color: #232D3B;">${input.paymentId}</td></tr>
            <tr><td style="padding: 6px 0; color: #666; font-size: 12px;">Amount</td><td style="padding: 6px 0; font-weight: bold; color: #232D3B;">${amount}</td></tr>
            <tr><td style="padding: 6px 0; color: #666; font-size: 12px;">Reason</td><td style="padding: 6px 0; color: #232D3B;">${input.reason}</td></tr>
          </table>
          <p style="margin-top: 20px; font-size: 11px; color: #999;">
            Sent automatically by BAGIFYYYY payment recovery. The address above is
            SUPPORT_ALERT_EMAIL or ADMIN_EMAIL.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.warn('Manual-refund alert email failed:', error);
  }
}

/** Send a receipt for a committed order and make repeated callbacks harmless. */
export async function sendOrderConfirmationIfNeeded(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shippingAddress: true },
  });

  if (!order || order.confirmationSentAt || !order.customerEmail) return false;

  const result = await sendOrderConfirmationEmail(order);
  if (!result?.success) return false;

  await prisma.order.updateMany({
    where: { id: orderId, confirmationSentAt: null },
    data: { confirmationSentAt: new Date() },
  });
  return true;
}
