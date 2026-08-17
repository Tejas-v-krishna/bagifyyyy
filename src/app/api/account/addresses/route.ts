import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function getAuthedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user-session');
  if (!sessionCookie?.value) return null;
  return prisma.user.findUnique({ where: { id: sessionCookie.value } });
}

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
  } catch (error: any) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: 'Failed to save address.' }, { status: 500 });
  }
}
