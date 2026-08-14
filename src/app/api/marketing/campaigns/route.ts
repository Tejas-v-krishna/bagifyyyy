import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const subscriberCount = await prisma.subscriber.count();
    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const recentSubscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      subscriberCount,
      campaigns,
      recentSubscribers,
    });
  } catch (error: any) {
    console.error('Error fetching marketing stats:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
