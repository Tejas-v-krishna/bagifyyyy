import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudioAuth } from '@/lib/requireStudioAuth';

// POST — add a new image to a product
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const url = body && typeof body === 'object' && typeof (body as { url?: unknown }).url === 'string'
      ? (body as { url: string }).url.trim()
      : '';

    if (!url || !/^https?:\/\/[^\s]+$/i.test(url) && !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const image = await prisma.image.create({
      data: { url, productId: id },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error adding image:', error);
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
  }
}

// DELETE — delete a specific image by imageId (passed in body)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id: productId } = await params;
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Make sure image belongs to this product
    const image = await prisma.image.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    await prisma.image.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
