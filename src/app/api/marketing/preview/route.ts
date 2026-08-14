import { NextResponse } from 'next/server';
import { generateDropAnnouncementEmailHtml } from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { headline, subheadline, promoBadge, productIds, bannerImage } = body;

    // Fetch product details from DB
    let products: any[] = [];
    if (productIds && productIds.length > 0) {
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { images: true },
      });

      products = dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: Math.round(p.price * 1.6), // Mock original price for discount comparison
        discountBadge: p.isNew ? 'NEW DROP' : p.isBestSeller ? 'HOT DROP' : 'MIN. 50% OFF',
        image: p.images[0]?.url || '/placeholder.jpg',
        category: p.category,
      }));
    }

    // If no products chosen, get first 4 active products as default
    if (products.length === 0) {
      const defaultProducts = await prisma.product.findMany({
        take: 4,
        include: { images: true },
        orderBy: { createdAt: 'desc' },
      });

      products = defaultProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: Math.round(p.price * 1.5),
        discountBadge: '50% OFF',
        image: p.images[0]?.url || '/placeholder.jpg',
        category: p.category,
      }));
    }

    const html = generateDropAnnouncementEmailHtml({
      headline: headline || 'RIGHT TO FASHION DROP',
      subheadline: subheadline || 'Exclusive Y2K Streetwear & Cyber Archive Collection',
      promoBadge: promoBadge || '50–80% OFF',
      bannerImage,
      products,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    return NextResponse.json({ success: true, html });
  } catch (error: any) {
    console.error('Error generating email preview:', error);
    return NextResponse.json({ error: error.message || 'Failed to preview email' }, { status: 500 });
  }
}
