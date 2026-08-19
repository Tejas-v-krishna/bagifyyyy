import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendDropCampaignBroadcast } from '@/lib/email';

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
    const { title, subject, headline, subheadline, promoBadge, productIds, bannerImage, testRecipient } = body;

    // 1. Fetch products
    const dbProducts = await prisma.product.findMany({
      where: productIds?.length ? { id: { in: productIds } } : undefined,
      take: productIds?.length ? undefined : 6,
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    const products = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: Math.round(p.price * 1.5),
      discountBadge: p.isNew ? 'NEW DROP' : 'MIN. 50% OFF',
      image: p.images[0]?.url || '/placeholder.jpg',
      category: p.category,
    }));

    // 2. Fetch recipients (all subscribers or specific test recipient)
    let recipientEmails: string[] = [];

    if (testRecipient) {
      recipientEmails = [testRecipient];
    } else {
      const subscribers = await prisma.subscriber.findMany({
        select: { email: true },
      });
      recipientEmails = subscribers.map((s) => s.email);

      // If no subscribers yet in DB, include default admin fallback
      if (recipientEmails.length === 0) {
        recipientEmails = ['subscribers@bagifyyyy.com'];
      }
    }

    // 3. Dispatch Email
    const result = await sendDropCampaignBroadcast(
      recipientEmails,
      {
        campaignTitle: title,
        headline,
        subheadline,
        promoBadge,
        bannerImage,
        products,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      subject
    );

    // 4. Record Campaign in DB if real broadcast
    let campaign = null;
    if (!testRecipient) {
      campaign = await prisma.marketingCampaign.create({
        data: {
          title: title || headline || 'Fashion Drop Announcement',
          subject: subject || `✦ NEW DROP LIVE: ${headline || 'Collection'}`,
          headline: headline || 'RIGHT TO FASHION DROP',
          promoBadge: promoBadge || '50–80% OFF',
          bannerImage: bannerImage || null,
          productIds: JSON.stringify(productIds || []),
          sentCount: recipientEmails.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sentCount: recipientEmails.length,
      recipients: recipientEmails,
      campaign,
      simulated: result.simulated || false,
      message: testRecipient 
        ? `Test drop email sent to ${testRecipient}` 
        : `Campaign broadcast dispatched to ${recipientEmails.length} subscribers!`,
    });
  } catch (error: any) {
    console.error('Error sending marketing broadcast:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch broadcast' }, { status: 500 });
  }
}
