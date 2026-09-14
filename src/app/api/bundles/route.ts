import { NextResponse } from 'next/server';
import { queryBundles } from '@/lib/bundles';

export async function GET() {
  const bundles = await queryBundles();
  return NextResponse.json({ bundles });
}
