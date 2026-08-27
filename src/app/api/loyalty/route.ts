import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';
import { isStudioAuthed } from '@/lib/requireStudioAuth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Only owner or admin can view loyalty data
  const authedUser = await getAuthedUser();
  const isAdmin = await isStudioAuthed();
  if (!isAdmin && (!authedUser || authedUser.email.toLowerCase() !== email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  // Only studio admin can award points manually — prevents unauthenticated point injection
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { email, points, reason } = await request.json();

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail || points === undefined || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof points !== 'number' || !Number.isFinite(points) || Math.abs(points) > 10000) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    const account = await prisma.loyaltyAccount.upsert({
      where: { email: cleanEmail },
      create: { email: cleanEmail, points: 0, tier: 'CHROME' },
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
      where: { email: cleanEmail },
      data: {
        points: newPoints,
        tier: newTier,
        history: {
          create: {
            points,
            reason: String(reason).slice(0, 200),
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
