import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cleanupAbandonedOrders, retryPendingRefunds } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

/**
 * Scheduled maintenance: retry failed refunds and delete abandoned checkouts.
 *
 * Protected by CRON_SECRET (Vercel sends `Authorization: Bearer $CRON_SECRET`
 * for cron invocations). Without the env var the endpoint refuses to run, so a
 * missing configuration can never leave it open on the public internet.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return false;
  const provided = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const refunds = await retryPendingRefunds();
    const cleanup = await cleanupAbandonedOrders();
    return NextResponse.json({ success: true, refunds, cleanup });
  } catch (error) {
    console.error('Maintenance cron failed:', error);
    return NextResponse.json({ error: 'Maintenance run failed' }, { status: 500 });
  }
}

