import { NextResponse } from 'next/server';
import { queryBundles } from '@/lib/bundles';

export async function GET() {
  const bundles = await queryBundles();
  return NextResponse.json(
    { bundles },
    // Bundles change only when the studio edits them — edge-cache 5 minutes.
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
