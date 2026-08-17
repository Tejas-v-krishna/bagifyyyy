import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function isStudioAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('studio-auth')?.value === 'authenticated';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { orderStatus, trackingId } = body;

    const VALID_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (orderStatus && !VALID_STATUSES.includes(orderStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(trackingId !== undefined && { trackingId }),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    console.error('Studio order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
