import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';

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
