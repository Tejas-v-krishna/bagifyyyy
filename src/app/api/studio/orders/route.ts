import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Studio-auth guard helper
async function isStudioAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('studio-auth')?.value === 'authenticated';
}

export async function GET() {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Studio orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
