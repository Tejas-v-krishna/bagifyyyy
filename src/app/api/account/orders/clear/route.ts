import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';

// POST: clear the member's own order-history view. Only hides orders placed
// before now from /api/orders — studio, fulfillment, and revenue keep them.
export async function POST() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { orderHistoryClearedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear order history error:', error);
    return NextResponse.json({ error: 'Failed to clear order history.' }, { status: 500 });
  }
}
