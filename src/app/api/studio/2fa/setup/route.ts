import { NextResponse } from 'next/server';
import { requireStudioAuth } from '@/lib/requireStudioAuth';
import { buildOtpauthUri, generateTotpSecret, verifyTOTP } from '@/lib/totp';

export async function GET() {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  const existingSecret = process.env.ADMIN_TOTP_SECRET?.trim();
  const secret = existingSecret || generateTotpSecret(20);
  const otpauthUri = buildOtpauthUri(secret);

  return NextResponse.json({
    configured: Boolean(existingSecret),
    secret,
    otpauthUri,
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { secret, code } = await request.json();
    if (!secret || !code) {
      return NextResponse.json({ error: 'Secret and code are required' }, { status: 400 });
    }

    const isValid = verifyTOTP(String(code), String(secret));
    return NextResponse.json({ valid: isValid });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
