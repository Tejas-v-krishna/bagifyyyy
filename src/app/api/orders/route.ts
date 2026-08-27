import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AWAITING_PAYMENT } from '@/lib/orderStatus';
import { getAuthedUser } from '@/lib/userSession';

export async function GET() {
  try {
    const user = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ orders: [] });
    }

    if (!user) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          { customerEmail: user.email },
        ],
        // A checkout that never got past the payment sheet is not something the
        // shopper committed to, so it is not listed as one of their orders.
        NOT: { orderStatus: AWAITING_PAYMENT },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ orders: [] });
  }
}
