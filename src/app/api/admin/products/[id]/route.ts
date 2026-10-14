import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalCategory } from '@/lib/categories';
import { requireStudioAuth } from '@/lib/requireStudioAuth';
import { updateProductSubcategory } from '@/lib/subcategories';
import { revalidatePath } from 'next/cache';

type ProductPatchBody = {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  compareAtPrice?: unknown;
  comparePrice?: unknown;
  image?: unknown;
  collectionTag?: unknown;
  isNew?: unknown;
  isSoldOut?: unknown;
  isBestSeller?: unknown;
  isArchived?: unknown;
  category?: unknown;
  subcategory?: unknown;
};

function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  return /^https:\/\//i.test(value);
}

export async function GET(
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching admin product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
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

    const { name, description, price, compareAtPrice, comparePrice, image, collectionTag, isNew, isSoldOut, isBestSeller, isArchived, category, subcategory } = body;

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
    // Original MRP. Accepts compareAtPrice (canonical) or comparePrice (studio
    // form alias). Empty string / null clears it; otherwise must be positive.
    const rawMrp = compareAtPrice !== undefined ? compareAtPrice : comparePrice;
    let parsedMrp: number | null | undefined;
    if (rawMrp === undefined) {
      parsedMrp = undefined;
    } else if (rawMrp === null || rawMrp === '') {
      parsedMrp = null;
    } else {
      const n = Number(rawMrp);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: 'Compare-at price must be a positive number or empty' }, { status: 400 });
      }
      parsedMrp = n;
    }
    if (category !== undefined && (typeof category !== 'string' || !canonicalCategory(category))) {
      return NextResponse.json({ error: 'A valid category is required' }, { status: 400 });
    }
    if (image !== undefined && (typeof image !== 'string' || !isSafeImageUrl(image.trim()))) {
      return NextResponse.json({ error: 'Image must be a secure URL or an uploaded path' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, sku: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Lazy badge: products created before badges existed get one on first edit.
    let backfillSku: string | undefined;
    if (!existing.sku) {
      const { nextSku } = await import('@/lib/sku');
      backfillSku = await nextSku();
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(backfillSku && { sku: backfillSku }),
        ...(name !== undefined && { name: (name as string).trim() }),
        ...(category !== undefined && { category: canonicalCategory(category as string) }),
        ...(description !== undefined && { description: (description as string).trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(parsedMrp !== undefined && { compareAtPrice: parsedMrp }),
        ...(collectionTag !== undefined && {
          brand: typeof collectionTag === 'string' && collectionTag.trim() ? collectionTag.trim() : 'BAGIFYYYY',
        }),
        ...(isNew !== undefined && { isNew: Boolean(isNew) }),
        ...(isSoldOut !== undefined && { isSoldOut: Boolean(isSoldOut) }),
        ...(isBestSeller !== undefined && { isBestSeller: Boolean(isBestSeller) }),
        ...(isArchived !== undefined && { isArchived: Boolean(isArchived) }),
      },
    });

    // If marked Sold Out, zero out variants so stock checks immediately fail/hide the piece.
    // If marked In Stock, ensure at least 1 stock exists so the product can be purchased.
    if (isSoldOut !== undefined) {
      if (Boolean(isSoldOut)) {
        await prisma.variant.updateMany({
          where: { productId: id },
          data: { stock: 0 },
        });
      } else {
        const variants = await prisma.variant.findMany({ where: { productId: id } });
        if (variants.length === 0) {
          await prisma.variant.create({
            data: { productId: id, color: "Default", size: "One Size", stock: 1 },
          });
        } else {
          const hasPositiveStock = variants.some((v) => v.stock > 0);
          if (!hasPositiveStock) {
            await prisma.variant.update({
              where: { id: variants[0].id },
              data: { stock: 1 },
            });
          }
        }
      }
    }

    if (subcategory !== undefined) {
      await updateProductSubcategory(
        id,
        typeof subcategory === 'string' && subcategory.trim() ? subcategory.trim().toLowerCase() : null
      );
    }

    if (typeof image === 'string' && image.trim()) {
      const url = image.trim();
      const existingImages = await prisma.image.findMany({
        where: { productId: id },
        orderBy: { position: 'asc' },
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

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath(`/product/${id}`);
      revalidatePath('/new-arrivals');
      revalidatePath('/curated-grails');
      if (product.category) {
        revalidatePath(`/${product.category}`);
      }
    } catch {
      // Best-effort cache invalidation
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

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Best-effort cache invalidation
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
