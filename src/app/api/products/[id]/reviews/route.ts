import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviews = await prisma.review.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ reviews });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { authorName, rating, body: reviewBody, userId } = body;

    if (!authorName || !rating || !reviewBody) {
      return NextResponse.json({ error: 'Name, rating, and review text are required.' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: userId ?? null,
        authorName: authorName.trim(),
        rating: Number(rating),
        body: reviewBody.trim(),
      },
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 });
    }
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}
