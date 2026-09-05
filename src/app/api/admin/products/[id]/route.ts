import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalCategory } from '@/lib/categories';
import { requireStudioAuth } from '@/lib/requireStudioAuth';

type ProductPatchBody = {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  image?: unknown;
  collectionTag?: unknown;
  isNew?: unknown;
  isSoldOut?: unknown;
  isBestSeller?: unknown;
  category?: unknown;
};

function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  return /^https:\/\//i.test(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as ProductPatchBody | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, description, price, image, collectionTag, isNew, isSoldOut, isBestSeller, category } = body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be text' }, { status: 400 });
    }
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json({ error: 'Price must be greater than zero' }, { status: 400 });
      }
    }
    if (category !== undefined && (typeof category !== 'string' || !canonicalCategory(category))) {
      return NextResponse.json({ error: 'A valid category is required' }, { status: 400 });
    }
    if (image !== undefined && (typeof image !== 'string' || !isSafeImageUrl(image.trim()))) {
      return NextResponse.json({ error: 'Image must be a secure URL or an uploaded path' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: (name as string).trim() }),
        ...(category !== undefined && { category: canonicalCategory(category as string) }),
        ...(description !== undefined && { description: (description as string).trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(collectionTag !== undefined && {
          brand: typeof collectionTag === 'string' && collectionTag.trim() ? collectionTag.trim() : 'BAGIFYYYY',
        }),
        ...(isNew !== undefined && { isNew: Boolean(isNew) }),
        ...(isSoldOut !== undefined && { isSoldOut: Boolean(isSoldOut) }),
        ...(isBestSeller !== undefined && { isBestSeller: Boolean(isBestSeller) }),
      },
    });

    if (typeof image === 'string' && image.trim()) {
      const url = image.trim();
      const existingImages = await prisma.image.findMany({
        where: { productId: id },
        orderBy: { id: 'asc' },
        take: 1,
      });

      if (existingImages.length > 0) {
        await prisma.image.update({
          where: { id: existingImages[0].id },
          data: { url },
        });
      } else {
        await prisma.image.create({
          data: { url, productId: id },
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
