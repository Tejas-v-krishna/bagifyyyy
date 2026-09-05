import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

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
