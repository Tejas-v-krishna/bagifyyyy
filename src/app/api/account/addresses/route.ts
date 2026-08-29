import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';

// GET: list all addresses for logged-in user
export async function GET() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ addresses });
}

// POST: create a new address
export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { fullName, phone, street, city, state, pincode } = body;

    if (!fullName || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json({ error: 'All address fields are required.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      return NextResponse.json({ error: 'Enter a valid 6-digit PIN code.' }, { status: 400 });
    }
    if (!/^[+\d][\d\s-]{7,15}$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: 'India',
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: 'Failed to save address.' }, { status: 500 });
  }
}
