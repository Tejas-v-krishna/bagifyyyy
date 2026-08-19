import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Order number or tracking ID required." }, { status: 400 });
    }

    const cleanQuery = query.trim().replace(/^#/g, "");

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: cleanQuery },
          { id: cleanQuery },
          { trackingId: cleanQuery },
        ],
      },
      include: {
        items: true,
        shippingAddress: {
          select: {
            fullName: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "No drop shipment found for this order ID." }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        trackingId: order.trackingId,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        items: order.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          image: it.image,
        })),
      },
    });
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json({ error: "Failed to locate shipment." }, { status: 500 });
  }
}
