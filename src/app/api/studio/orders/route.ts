import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';
import { AWAITING_PAYMENT } from '@/lib/orderStatus';

export async function GET(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(200, Math.max(1, parseInt(searchParams.get('take') || '100', 10) || 100));
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10) || 0);

    const orders = await prisma.order.findMany({
      where: { NOT: { orderStatus: AWAITING_PAYMENT } },
      take,
      skip,
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Studio orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
