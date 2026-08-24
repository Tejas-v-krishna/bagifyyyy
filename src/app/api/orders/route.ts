import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AWAITING_PAYMENT } from '@/lib/orderStatus';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ orders: [] });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    });

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
