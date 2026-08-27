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
    const { authorName, rating, body: reviewBody } = body;
    const { getAuthedUser } = await import('@/lib/userSession');
    const authedUser = await getAuthedUser();

    if (!authorName || !rating || !reviewBody) {
      return NextResponse.json({ error: 'Name, rating, and review text are required.' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }
    if (reviewBody.trim().length < 10) {
      return NextResponse.json({ error: 'Review must be at least 10 characters.' }, { status: 400 });
    }
    // Require login for reviews to prevent spam (or at least rate-limit anon)
    // Keep anon allowed but fingerprint by IP? For now allow anon but enforce userId from session if present
    const effectiveUserId = authedUser?.id ?? null;

    // Prevent duplicate: if authenticated, use userId, else allow one per IP? Simple: check existing by userId or by authorName+product
    if (effectiveUserId) {
      const existing = await prisma.review.findFirst({ where: { productId: id, userId: effectiveUserId } });
      if (existing) return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: effectiveUserId,
        authorName: authorName.trim().slice(0, 50),
        rating: Number(rating),
        body: reviewBody.trim().slice(0, 2000),
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
