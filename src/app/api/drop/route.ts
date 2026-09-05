import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';

const KEY = 'dropCountdown';

type DropPayload = {
  targetAt: string;
  label: string;
};

async function readDrop(): Promise<DropPayload | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row) return null;
    const parsed = JSON.parse(row.value) as Partial<DropPayload>;
    if (typeof parsed.targetAt !== 'string' || Number.isNaN(Date.parse(parsed.targetAt))) return null;
    return {
      targetAt: parsed.targetAt,
      label: typeof parsed.label === 'string' ? parsed.label : '',
    };
  } catch {
    return null;
  }
}

/** Public: the live countdown target, or null when none is set. */
export async function GET() {
  const drop = await readDrop();
  if (!drop) return NextResponse.json({ targetAt: null, label: null });
  // Expired drops behave as unset so the band disappears on its own.
  if (Date.parse(drop.targetAt) <= Date.now()) {
    return NextResponse.json({ targetAt: null, label: null });
  }
  return NextResponse.json(drop);
}

/** Studio: set (or clear with { targetAt: null }) the drop countdown. */
export async function PUT(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      targetAt?: unknown;
      label?: unknown;
    } | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (body.targetAt === null) {
      await prisma.siteSetting.delete({ where: { key: KEY } }).catch(() => {});
      return NextResponse.json({ targetAt: null, label: null });
    }

    if (typeof body.targetAt !== 'string' || Number.isNaN(Date.parse(body.targetAt))) {
      return NextResponse.json({ error: 'A valid date and time is required' }, { status: 400 });
    }
    const target = new Date(body.targetAt);
    if (target.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Pick a date and time in the future' }, { status: 400 });
    }
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 60) : '';

    await prisma.siteSetting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: JSON.stringify({ targetAt: target.toISOString(), label }) },
      update: { value: JSON.stringify({ targetAt: target.toISOString(), label }) },
    });
    return NextResponse.json({ targetAt: target.toISOString(), label });
  } catch (error) {
    console.error('Error saving drop countdown:', error);
    return NextResponse.json({ error: 'Failed to save countdown' }, { status: 500 });
  }
}
