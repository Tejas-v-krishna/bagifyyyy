import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';
import { FROM_EMAIL, sendEmail } from '@/lib/email';
import { generateDropAnnouncementEmailHtml } from '@/lib/email-templates';

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const RESEND_BATCH_LIMIT = 50;

export async function POST(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      subject,
      headline,
      subheadline,
      promoBadge,
      productIds,
      bannerImage,
      testRecipient,
    } = body;

    if (testRecipient !== undefined && !isValidEmail(testRecipient)) {
      return NextResponse.json({ error: 'A valid test recipient email is required.' }, { status: 400 });
    }

    const selectedProductIds = Array.isArray(productIds)
      ? productIds.filter((id): id is string => typeof id === 'string').slice(0, 20)
      : [];

    const dbProducts = await prisma.product.findMany({
      where: selectedProductIds.length ? { id: { in: selectedProductIds } } : undefined,
      take: selectedProductIds.length ? undefined : 6,
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

    const html = generateDropAnnouncementEmailHtml({
      campaignTitle: title,
      headline,
      subheadline,
      promoBadge,
      bannerImage,
      products,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });
    const subjectLine =
      subject || `✦ NEW DROP LIVE: ${headline || 'Collection'}`;

    if (testRecipient) {
      const result = await sendEmail({ to: testRecipient, subject: subjectLine, html });
      if (!result.success) {
        return NextResponse.json(
          { error: typeof result.error === 'string' ? result.error : 'Test delivery failed' },
          { status: 502 }
        );
      }
      if (result.simulated) {
        return NextResponse.json(
          { error: 'Email provider is not configured; test was only simulated.' },
          { status: 502 }
        );
      }
      return NextResponse.json({
        success: true,
        sentCount: 1,
        simulated: false,
        message: `Test drop email sent to ${testRecipient}`,
      });
    }

    const subscribers = await prisma.subscriber.findMany({ select: { email: true } });
    const recipientEmails = subscribers.map((s) => s.email).filter(isValidEmail);
    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No subscribers to broadcast to.' }, { status: 400 });
    }

    let delivered = 0;
    const failures: string[] = [];
    for (let i = 0; i < recipientEmails.length; i += RESEND_BATCH_LIMIT) {
      const batch = recipientEmails.slice(i, i + RESEND_BATCH_LIMIT);
      const result = await sendEmail({
        to: FROM_EMAIL,
        bcc: batch,
        subject: subjectLine,
        html,
      });
      if (result.success && !result.simulated) {
        delivered += batch.length;
      } else {
        failures.push(`recipients ${i + 1}-${i + batch.length}`);
      }
    }

    if (delivered === 0) {
      return NextResponse.json({ error: 'Broadcast delivery failed for all recipients.' }, { status: 502 });
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        title: title || headline || 'Fashion Drop Announcement',
        subject: subjectLine,
        headline: headline || 'RIGHT TO FASHION DROP',
        promoBadge: promoBadge || '50–80% OFF',
        bannerImage: bannerImage || null,
        productIds: JSON.stringify(selectedProductIds),
        sentCount: delivered,
      },
    });

    return NextResponse.json({
      success: failures.length === 0,
      sentCount: delivered,
      failedBatches: failures,
      campaign,
      simulated: false,
      message:
        failures.length === 0
          ? `Campaign broadcast dispatched to ${delivered} subscribers!`
          : `Campaign partially delivered to ${delivered} subscribers.`,
    });
  } catch (error) {
    console.error('Error sending marketing broadcast:', error);
    const message = error instanceof Error ? error.message : 'Failed to dispatch broadcast';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
