import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, productId } = await request.json();

    if (!email || !productId) {
      return NextResponse.json({ error: "Email and productId are required" }, { status: 400 });
    }

    await prisma.stockNotification.create({
      data: {
        email,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating stock notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
