import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudioAuth } from '@/lib/requireStudioAuth';

// GET /api/studio/bundles — List all bundles with attached products
export async function GET() {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const bundles = await prisma.bundle.findMany({
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = bundles.map((b) => {
      const items = b.products.map((bp) => ({
        id: bp.product.id,
        name: bp.product.name,
        price: bp.product.price,
        image: bp.product.images[0]?.url || '/placeholder.jpg',
        isSoldOut: bp.product.isSoldOut,
        category: bp.product.category,
      }));

      const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
      const bundlePrice = Math.round(originalTotal * (1 - b.discount / 100) * 100) / 100;
      const savings = Math.round((originalTotal - bundlePrice) * 100) / 100;

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        discount: b.discount,
        createdAt: b.createdAt,
        products: items,
        originalTotal,
        bundlePrice,
        savings,
      };
    });

    return NextResponse.json({ bundles: formatted });
  } catch (error) {
    console.error('Error fetching studio bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}

// POST /api/studio/bundles — Create a new bundle
export async function POST(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { name, description, discount, productIds } = body;

    if (!name || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Bundle name and at least one product are required.' },
        { status: 400 }
      );
    }

    const parsedDiscount = Number(discount) >= 0 && Number(discount) <= 90 ? Number(discount) : 15;

    // Create bundle and its relations in transaction
    const newBundle = await prisma.bundle.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        discount: parsedDiscount,
        products: {
          create: productIds.map((productId: string) => ({
            productId,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: {
              include: { images: { take: 1 } },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, bundle: newBundle }, { status: 201 });
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
  }
}
