import { NextResponse } from "next/server";
import { getAllCoupons, createCoupon, deleteCoupon, toggleCouponActive, validateCouponCode } from "@/lib/coupons";
import { requireStudioAuth } from "@/lib/requireStudioAuth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const subtotal = Number(searchParams.get("subtotal") || 0);

    // Public validation endpoint for checkout/cart
    if (code) {
      // Throttle brute-force attempts: max 20 validation checks per minute per IP
      const ip = clientIp(request);
      const rl = rateLimit(`coupon-validate:${ip}`, 20, 60_000);
      if (!rl.ok) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
        );
      }

      const result = await validateCouponCode(code, subtotal);
      if (!result.valid) {
        return NextResponse.json({ error: result.error || "Invalid coupon code." }, { status: 400 });
      }
      return NextResponse.json({ coupon: result.coupon });
    }

    // Studio admin listing endpoint
    const unauthorized = await requireStudioAuth();
    if (unauthorized) return unauthorized;

    const coupons = await getAllCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("GET /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const {
      code,
      discountType = "PERCENTAGE",
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount,
      usageLimit,
      expiresAt,
    } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    const val = Number(discountValue);
    if (discountType !== "FREE_SHIPPING" && (!Number.isFinite(val) || val <= 0)) {
      return NextResponse.json({ error: "A positive discount value is required." }, { status: 400 });
    }

    const result = await createCoupon({
      code: code.trim(),
      discountType: discountType as "PERCENTAGE" | "FIXED" | "FREE_SHIPPING",
      discountValue: discountType === "FREE_SHIPPING" ? 80 : val,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? String(expiresAt) : null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to create coupon." }, { status: 400 });
    }

    return NextResponse.json({ coupon: result.coupon }, { status: 201 });
  } catch (error) {
    console.error("POST /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to create coupon." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { id, isActive } = body;
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Coupon ID and isActive boolean required." }, { status: 400 });
    }

    const ok = await toggleCouponActive(id, isActive);
    if (!ok) {
      return NextResponse.json({ error: "Failed to update coupon status." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to update coupon." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
    }

    const ok = await deleteCoupon(id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
}
