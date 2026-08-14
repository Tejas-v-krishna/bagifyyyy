import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Returns raw image records (id + url) for a product — used by studio edit page
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const images = await prisma.image.findMany({
      where: { productId: id },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
