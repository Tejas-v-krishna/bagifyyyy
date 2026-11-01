import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudioAuth } from '@/lib/requireStudioAuth';
import { AWAITING_PAYMENT } from '@/lib/orderStatus';

// Order counts and revenue are live figures; never let a CDN or the browser
// hand back yesterday's totals.
export const dynamic = 'force-dynamic';

/**
 * GET /api/studio/orders/stats
 *
 * Aggregate the whole Order table on the database instead of asking the
 * browser to add up a page of rows. The orders list endpoint is paginated
 * (100 rows by default), so summing whatever page it returned silently
 * under-reported both revenue and order counts once the store passed 100
 * real orders.
 */
export async function GET() {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    // A checkout that never got past the payment sheet is not an order.
    const realOrders = { NOT: { orderStatus: AWAITING_PAYMENT } };

    // Mirrors countsAsRevenue() in lib/orderStatus.ts: captured payments count
    // always, cash on delivery counts until the order is cancelled.
    const revenueOrders = {
      AND: [
        realOrders,
        {
          OR: [
            { paymentStatus: 'PAID' },
            { paymentMethod: 'COD', orderStatus: { not: 'CANCELLED' } },
          ],
        },
      ],
    };

    const [totalOrders, revenue, byStatus] = await Promise.all([
      prisma.order.count({ where: realOrders }),
      prisma.order.aggregate({
        where: revenueOrders,
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['orderStatus'],
        where: realOrders,
        _count: { _all: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.orderStatus] = row._count._all;
    }

    return NextResponse.json(
      {
        totalOrders,
        totalRevenue: Math.round((revenue._sum.totalAmount ?? 0) * 100) / 100,
        processing: statusCounts.PROCESSING ?? 0,
        shipped: statusCounts.SHIPPED ?? 0,
        delivered: statusCounts.DELIVERED ?? 0,
        cancelled: statusCounts.CANCELLED ?? 0,
        statusCounts,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Studio order stats error:', error);
    return NextResponse.json({ error: 'Failed to load order stats' }, { status: 500 });
  }
}
