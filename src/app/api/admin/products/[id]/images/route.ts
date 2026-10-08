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

    // Explicit position wins (publish sends them in order, killing the
    // concurrent-create race); otherwise append after the current max.
    const rawPosition = body && typeof body === 'object' ? (body as { position?: unknown }).position : undefined;
    let position: number;
    if (typeof rawPosition === 'number' && Number.isInteger(rawPosition) && rawPosition >= 0) {
      position = rawPosition;
    } else {
      const max = await prisma.image.aggregate({
        where: { productId: id },
        _max: { position: true },
      });
      position = (max._max.position ?? -1) + 1;
    }

    const image = await prisma.image.create({
      data: { url, productId: id, position },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error adding image:', error);
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
  }
}

// PUT — persist a studio thumbnail reorder. Body: { order: imageId[] }.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id: productId } = await params;
    const body = await request.json().catch(() => null);
    const order = body && typeof body === 'object' && Array.isArray((body as { order?: unknown }).order)
      ? (body as { order: unknown[] }).order.filter((v): v is string => typeof v === 'string')
      : [];

    if (order.length === 0) {
      return NextResponse.json({ error: 'Non-empty order array is required' }, { status: 400 });
    }

    const existing = await prisma.image.findMany({
      where: { productId },
      select: { id: true },
    });
    const owned = new Set(existing.map((img) => img.id));
    if (order.length !== existing.length || !order.every((imageId) => owned.has(imageId))) {
      return NextResponse.json(
        { error: 'Order must contain exactly the product\u2019s current images' },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      order.map((imageId, position) =>
        prisma.image.update({ where: { id: imageId }, data: { position } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering images:', error);
    return NextResponse.json({ error: 'Failed to reorder images' }, { status: 500 });
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
