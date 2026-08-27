import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, productId } = await request.json();

    if (!email || !productId) {
      return NextResponse.json({ error: "Email and productId are required" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existing = await prisma.stockNotification.findFirst({
      where: { email: cleanEmail, productId },
    });
    if (existing) {
      return NextResponse.json({ success: true, message: "Already subscribed for this product." });
    }

    await prisma.stockNotification.create({
      data: {
        email: cleanEmail,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating stock notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
