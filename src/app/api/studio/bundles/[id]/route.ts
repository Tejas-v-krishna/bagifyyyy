import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudioAuth } from '@/lib/requireStudioAuth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, discount, productIds } = body;

    if (!id || !name || !productIds || productIds.length < 2) {
      return NextResponse.json({ error: 'Missing required bundle fields' }, { status: 400 });
    }

    // Update the bundle, and replace all its products
    await prisma.$transaction(async (tx) => {
      // Update bundle details
      await tx.bundle.update({
        where: { id },
        data: {
          name,
          description,
          discount: parseFloat(discount.toString()),
        },
      });

      // Delete existing bundle products
      await tx.bundleProduct.deleteMany({
        where: { bundleId: id },
      });

      // Add new bundle products
      await tx.bundleProduct.createMany({
        data: productIds.map((productId: string) => ({
          bundleId: id,
          productId,
        })),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Bundle ID is required' }, { status: 400 });
    }

    await prisma.bundle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 });
  }
}
