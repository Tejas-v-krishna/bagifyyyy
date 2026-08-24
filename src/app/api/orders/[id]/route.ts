import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Looked up by primary key only. Also accepting the human-facing order
    // number made every order on the site readable by counting up from
    // BGF-10000, which exposed each customer's name, address, phone and email.
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // A guest order is reachable by whoever holds its id, which is the only
    // credential a guest ever gets. Once an order belongs to an account, the
    // account holder is the only one who can read it. The response is a 404
    // either way so this endpoint never confirms that an order exists.
    if (order.userId) {
      const cookieStore = await cookies();
      const sessionUserId = cookieStore.get('user-session')?.value;
      if (!sessionUserId || sessionUserId !== order.userId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to retrieve order' }, { status: 500 });
  }
}
