import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Studio-auth guard helper
async function isStudioAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('studio-auth')?.value === 'authenticated';
}

export async function POST(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
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
