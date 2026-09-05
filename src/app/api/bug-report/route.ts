import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Public: shoppers file a bug. Validated hard; shown in studio as notifications. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
    }

    // Honeypot: bots fill it, humans never see it.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (message.length < 10) {
      return NextResponse.json({ error: 'Describe the bug in a little more detail (10+ characters).' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Keep the report under 2000 characters.' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'That email does not look valid.' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const page = typeof body.page === 'string' ? body.page.trim().slice(0, 500) : '';

    await prisma.bugReport.create({
      data: {
        name: name || null,
        email: email || null,
        page,
        message,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving bug report:', error);
    return NextResponse.json({ error: 'Could not send the report. Please try again.' }, { status: 500 });
  }
}
