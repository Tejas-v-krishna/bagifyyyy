import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';
import { canonicalCategory } from '@/lib/categories';

export async function GET() {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { images: true, variants: true },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { name, price, category, description, isNew, isSoldOut, isBestSeller, image, collectionTag } = body as Record<string, unknown>;
    const parsedPrice = Number(price);
    if (typeof name !== 'string' || !name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 ||
        typeof category !== 'string' || !canonicalCategory(category) || typeof description !== 'string' || !description.trim() ||
        typeof image !== 'string' || !image.trim()) {
      return NextResponse.json({ error: 'Name, description, category, image, and a valid price are required.' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parsedPrice,
        // Stored canonically so the storefront breadcrumb and the category
        // route always agree. Clients have sent both "topwear" and "topwears".
        category: canonicalCategory(category),
        description: description.trim(),
        isNew: Boolean(isNew),
        isSoldOut: Boolean(isSoldOut),
        isBestSeller: Boolean(isBestSeller),
        brand: typeof collectionTag === 'string' && collectionTag.trim() ? collectionTag.trim() : "BAGIFYYYY",
        images: {
          create: [{ url: image.trim() }]
        },
        variants: {
          create: [
            { color: "Default", size: "One Size", stock: 1 },
          ]
        }
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
