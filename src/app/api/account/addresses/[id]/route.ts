import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';

// PUT: edit an address (must belong to the logged-in user)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

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

    const updated = await prisma.address.update({
      where: { id },
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
    });

    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Failed to update address.' }, { status: 500 });
  }
}

// DELETE: remove an address (must belong to the logged-in user)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Failed to delete address.' }, { status: 500 });
  }
}
