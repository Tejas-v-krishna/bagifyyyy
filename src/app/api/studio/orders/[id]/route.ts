import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';
import { ORDER_STATUSES } from '@/lib/orderStatus';

const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;

// PATCH /api/studio/orders/[id] — update order status, payment status, tracking, contact
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { orderStatus, paymentStatus, trackingId, customerEmail, customerPhone } = body;

    const VALID_STATUSES: readonly string[] = ORDER_STATUSES;
    if (orderStatus && !VALID_STATUSES.includes(orderStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
        ...(trackingId !== undefined && { trackingId: trackingId ? trackingId.trim() : null }),
        ...(customerEmail && { customerEmail: customerEmail.trim().toLowerCase() }),
        ...(customerPhone && { customerPhone: customerPhone.trim() }),
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Studio order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/studio/orders/[id] — permanently delete an order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { shippingAddress: true, items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const addressId = existingOrder.shippingAddressId;

    await prisma.$transaction(async (tx) => {
      // 1. Remove any remaining stock reservations linked to this order
      await tx.stockReservation.deleteMany({
        where: { orderId: id },
      });

      // 2. Delete the order (cascade deletes OrderItem rows automatically)
      await tx.order.delete({
        where: { id },
      });

      // 3. Clean up orphaned guest address if no other orders use it
      if (addressId) {
        const remainingUses = await tx.order.count({
          where: { shippingAddressId: addressId },
        });
        if (remainingUses === 0 && !existingOrder.userId) {
          await tx.address.delete({
            where: { id: addressId },
          }).catch(() => {});
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Order #${existingOrder.orderNumber} has been permanently deleted.`,
      deletedOrderId: id,
    });
  } catch (error) {
    console.error('Studio order delete error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
