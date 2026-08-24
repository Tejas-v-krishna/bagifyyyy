import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalCategory } from '@/lib/categories';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, image, collectionTag, isNew, isSoldOut, category } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        // category was never read here, so changing a product's category in the
        // studio returned 200 and changed nothing.
        ...(category !== undefined && { category: canonicalCategory(category) }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(collectionTag !== undefined && { brand: collectionTag }),
        ...(isNew !== undefined && { isNew }),
        ...(isSoldOut !== undefined && { isSoldOut }),
      },
    });

    if (image) {
      const existingImages = await prisma.image.findMany({
        where: { productId: id },
        orderBy: { id: 'asc' },
        take: 1,
      });

      if (existingImages.length > 0) {
        await prisma.image.update({
          where: { id: existingImages[0].id },
          data: { url: image },
        });
      } else {
        await prisma.image.create({
          data: { url: image, productId: id },
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
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
