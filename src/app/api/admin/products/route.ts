import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, category, description, isNew, isSoldOut, image, collectionTag } = body;

    const product = await prisma.product.create({
      data: {
        name,
        price,
        category,
        description,
        isNew: isNew || false,
        isSoldOut: isSoldOut || false,
        brand: collectionTag || "BAGIFYYYY",
        images: {
          create: [{ url: image }]
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

