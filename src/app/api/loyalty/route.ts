import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const account = await prisma.loyaltyAccount.upsert({
      where: { email },
      create: { email, points: 0, tier: 'CHROME' },
      update: {},
      include: { history: { orderBy: { createdAt: 'desc' }, take: 10 } }
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error in loyalty GET:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty account' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, points, reason } = await request.json();

    if (!email || points === undefined || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const account = await prisma.loyaltyAccount.upsert({
      where: { email },
      create: { email, points: 0, tier: 'CHROME' },
      update: {},
    });

    const newPoints = account.points + points;
    
    let newTier = 'CHROME';
    if (newPoints >= 2000) {
      newTier = 'GOLD';
    } else if (newPoints >= 500) {
      newTier = 'STEEL';
    }

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { email },
      data: {
        points: newPoints,
        tier: newTier,
        history: {
          create: {
            points,
            reason,
          }
        }
      },
      include: { history: { orderBy: { createdAt: 'desc' }, take: 10 } }
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error in loyalty POST:', error);
    return NextResponse.json({ error: 'Failed to add points' }, { status: 500 });
  }
}
