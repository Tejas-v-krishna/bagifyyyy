import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function getAuthedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user-session');
  if (!sessionCookie?.value) return null;
  return prisma.user.findUnique({ where: { id: sessionCookie.value } });
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
  } catch (error: any) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Failed to delete address.' }, { status: 500 });
  }
}
