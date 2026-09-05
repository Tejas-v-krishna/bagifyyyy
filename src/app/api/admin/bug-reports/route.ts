import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';

/** Studio: user-filed bug reports, newest first, with the open count. */
export async function GET() {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [reports, openCount] = await Promise.all([
      prisma.bugReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.bugReport.count({ where: { status: 'OPEN' } }),
    ]);
    return NextResponse.json({ reports, openCount });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
