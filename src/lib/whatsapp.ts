import crypto from 'crypto';

/** Normalize an Indian/global phone into wa.me/sms: digits. */
export function waDigits(phone: unknown): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: unknown, message: string): string {
  const n = waDigits(phone);
  if (!n) return '';
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function buildSmsLink(phone: unknown, message: string): string {
  const n = waDigits(phone);
  if (!n) return '';
  return `sms:${n}?body=${encodeURIComponent(message)}`;
}

type OrderLike = {
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount?: number;
  trackingId?: string | null;
  orderStatus?: string;
  paymentMethod?: string;
  shippingAddress?: { fullName?: string; city?: string; street?: string; state?: string; pincode?: string } | null;
};

function customerName(order: OrderLike): string {
  return order.shippingAddress?.fullName || order.customerName || order.customerEmail?.split('@')[0] || 'there';
}

export function defaultMessageForStatus(order: OrderLike): string {
  const name = customerName(order);
  const num = order.orderNumber;
  const total = (order.totalAmount ?? 0).toLocaleString('en-IN');
  const track = order.trackingId ? ` Tracking: ${order.trackingId}.` : '';
  const link = ` https://bagifyyyy.in/track?query=${encodeURIComponent(num)}`;
  const status = order.orderStatus || 'PROCESSING';
  if (status === 'SHIPPED') {
    return `Hi ${name}, great news — your BAGIFYYYY order #${num} has shipped!${track} Track here:${link}`;
  }
  if (status === 'DELIVERED') {
    return `Hi ${name}, your BAGIFYYYY order #${num} has been delivered. Thank you for shopping with us!`;
  }
  if (status === 'CANCELLED') {
    return `Hi ${name}, your BAGIFYYYY order #${num} has been cancelled. If you have questions, reply to this message.`;
  }
  return `Hi ${name}, thanks for your BAGIFYYYY order #${num} (₹${total}).${track} Track here:${link}`;
}

export type NotifyPayload = {
  orderId: string;
  channel: 'WHATSAPP' | 'SMS';
  message: string;
  auto?: boolean;
};

/**
 * Provider availability is exposed via env at runtime. Browser decides
 * which button to show; the server re-checks before sending.
 */
export function twilioConfigured(): {
  whatsapp: boolean;
  sms: boolean;
} {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  return {
    whatsapp: Boolean(sid && token && process.env.TWILIO_WHATSAPP_FROM),
    sms: Boolean(sid && token && process.env.TWILIO_SMS_FROM),
  };
}

/** Send through Twilio (server only). Returns message SID or throws. */
export async function sendViaTwilio(params: {
  channel: 'WHATSAPP' | 'SMS';
  to: string;
  body: string;
}): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio not configured');
  const from =
    params.channel === 'WHATSAPP'
      ? process.env.TWILIO_WHATSAPP_FROM
      : process.env.TWILIO_SMS_FROM;
  if (!from) throw new Error(`Twilio ${params.channel} sender not configured`);
  const to = params.channel === 'WHATSAPP' ? `whatsapp:${params.to}` : params.to;
  const body = new URLSearchParams({
    To: to,
    From: params.channel === 'WHATSAPP' ? `whatsapp:${from}` : from,
    Body: params.body,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );
  const data = (await res.json()) as { sid?: string; message?: string; code?: number };
  if (!res.ok || !data.sid) {
    throw new Error(data.message || `Twilio failed (${res.status})`);
  }
  // Silence unused-import lint for crypto (some dep hash needs; defensive).
  void crypto;
  return data.sid;
}
