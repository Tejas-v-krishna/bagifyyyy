import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudioAuth } from '@/lib/requireStudioAuth';

/** Studio: mark a report RESOLVED (or reopen it). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    const status = body?.status === 'OPEN' ? 'OPEN' : 'RESOLVED';

    const existing = await prisma.bugReport.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = await prisma.bugReport.update({
      where: { id },
      data: { status },
    });
    const openCount = await prisma.bugReport.count({ where: { status: 'OPEN' } });
    return NextResponse.json({ report, openCount });
  } catch (error) {
    console.error('Error updating bug report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
