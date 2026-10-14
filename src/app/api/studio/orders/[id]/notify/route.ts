import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';
import {
  twilioConfigured,
  sendViaTwilio,
  buildWhatsAppLink,
  buildSmsLink,
} from '@/lib/whatsapp';
import { waDigits } from '@/lib/whatsapp';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      customerPhone: true,
      customerEmail: true,
      totalAmount: true,
      orderStatus: true,
      paymentMethod: true,
      paymentId: true,
      trackingId: true,
      shippingAddress: { select: { fullName: true, city: true, state: true, pincode: true } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const { defaultMessageForStatus } = await import('@/lib/whatsapp');
  const message = defaultMessageForStatus(order);
  const phone = waDigits(order.customerPhone);
  return NextResponse.json({
    order: { ...order, customerName: order.shippingAddress?.fullName || order.customerEmail },
    message,
    phone: `+${phone}`,
    manualLinks: {
      whatsapp: buildWhatsAppLink(order.customerPhone, message),
      sms: buildSmsLink(order.customerPhone, message),
    },
    twilio: twilioConfigured(),
    orderNumber: order.orderNumber,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  let body: { channel?: string; message?: string; auto?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // Allow empty body.
  }
  const channel = body.channel === 'SMS' ? 'SMS' : 'WHATSAPP';
  const message = (body.message || '').trim();
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, customerPhone: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const cfg = twilioConfigured();
  const canAuto = body.auto === true && (channel === 'WHATSAPP' ? cfg.whatsapp : cfg.sms);

  if (canAuto) {
    try {
      const sid = await sendViaTwilio({
        channel,
        to: waDigits(order.customerPhone),
        body: message,
      });
      console.log(`Studio notify sent (${channel}) to ${order.orderNumber}: ${sid}`);
      return NextResponse.json({ success: true, provider: 'twilio', sid });
    } catch (error) {
      console.error('Twilio send failed:', error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Send failed', manualLinks: {
          whatsapp: buildWhatsAppLink(order.customerPhone, message),
          sms: buildSmsLink(order.customerPhone, message),
        } },
        { status: 502 }
      );
    }
  }

  // No provider configured: hand the operator a ready-to-open link.
  return NextResponse.json({
    success: true,
    provider: 'manual',
    manualLinks: {
      whatsapp: buildWhatsAppLink(order.customerPhone, message),
      sms: buildSmsLink(order.customerPhone, message),
    },
  });
}
