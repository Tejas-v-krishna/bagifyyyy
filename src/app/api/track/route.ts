import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAwaitingPayment } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

/** Same wording whether the order is absent or simply not yours. */
const NOT_FOUND = "No drop shipment found for that order and contact detail.";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

function contactMatchesOrder(
  supplied: string,
  order: { customerEmail: string | null; customerPhone: string | null }
): boolean {
  const normalized = supplied.trim().toLowerCase();
  if (!normalized) return false;

  if (order.customerEmail && normalized === order.customerEmail.trim().toLowerCase()) {
    return true;
  }

  const suppliedDigits = digitsOnly(normalized);
  const orderDigits = order.customerPhone ? digitsOnly(order.customerPhone) : "";
  if (suppliedDigits.length >= 10 && orderDigits.length >= 10) {
    // Compare the last 10 digits so a country code on either side still matches.
    return suppliedDigits.slice(-10) === orderDigits.slice(-10);
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { query, contact } = body as { query?: unknown; contact?: unknown };

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Order number or tracking ID required." }, { status: 400 });
    }

    const suppliedContact = typeof contact === "string" ? contact.trim() : "";

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("user-session")?.value ?? "";

    // Order numbers are five digits, so this used to be a walk from BGF-10000 to
    // BGF-99999 that returned every customer's name, city and order contents.
    // A second factor is now required, and it is demanded *before* the lookup so
    // that the response cannot be used to test whether an order number exists.
    if (!sessionUserId && !suppliedContact) {
      return NextResponse.json(
        { error: "Enter the email address or phone number used on the order." },
        { status: 400 }
      );
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
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    const ownedBySession = Boolean(sessionUserId && order.userId === sessionUserId);
    const authorized = ownedBySession || contactMatchesOrder(suppliedContact, order);

    if (!authorized) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    // A checkout whose payment never completed has no shipment to track. Saying
    // so plainly beats drawing a fulfilment timeline over an order that was
    // never paid for, and beats the flat "not found" that made shoppers think
    // their money had gone somewhere unaccounted for.
    if (isAwaitingPayment(order)) {
      return NextResponse.json(
        {
          error:
            "That checkout was never completed, so there is no shipment yet. If you were charged, contact support@bagifyyyy.com with your order number.",
        },
        { status: 409 }
      );
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
