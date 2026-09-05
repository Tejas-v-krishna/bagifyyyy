"use client";

export const dynamic = "force-dynamic";

import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useSearchParams } from "next/navigation";
import { Check, Truck, Package, ArrowRight, ArrowLeft, Sparkles, MapPin, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { isAwaitingPayment, orderStatusLabel } from "@/lib/orderStatus";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
};

type ShippingAddress = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  trackingId: string | null;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null;
};

const money = (value: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "missing" | "failed">(
    orderId ? "loading" : "missing"
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.order) {
          setOrder(data.order);
          setStatus("loaded");
          if (!isAwaitingPayment(data.order)) clearCart();
        } else {
          setStatus(res.status === 404 ? "missing" : "failed");
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, clearCart, reloadKey]);

  const retry = () => {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex flex-col items-center justify-center gap-4 text-black font-sans px-4">
        <div className="w-14 h-14 rounded-full border border-black/15 bg-white flex items-center justify-center shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-black" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/60" role="status">
          Confirming your order receipt…
        </p>
      </div>
    );
  }

  if (status !== "loaded" || !order) {
    const isMissing = status === "missing";
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center px-4 py-20 text-black font-sans">
        <div className="bg-white border border-black/10 rounded-2xl max-w-[540px] w-full p-8 sm:p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
          <div className="w-14 h-14 bg-[#f5f5f2] border border-black/15 rounded-full flex items-center justify-center mx-auto mb-5 text-black">
            <AlertCircle strokeWidth={2} className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/45 mb-2">
            ORDER LOOKUP // NOTICE
          </p>
          <h1 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mb-3">
            {isMissing ? "Receipt Not Found" : "Could Not Load Receipt"}
          </h1>
          <p className="text-xs sm:text-sm text-black/60 leading-relaxed mb-8 max-w-md mx-auto">
            {isMissing
              ? "We could not find an active order for this reference. If you just paid, your order is safe and your confirmation email is on its way."
               : "Your order went through, but we could not load the receipt right now."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isMissing && (
              <button
                type="button"
                onClick={retry}
                className="flex-1 bg-black text-white py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            )}
            <Link
              href="/"
              className="flex-1 bg-black text-white py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors text-center cursor-pointer"
            >
              Return to Home
            </Link>
            <Link
              href="/checkout"
              className="flex-1 border border-black/15 bg-white text-black py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:border-black hover:bg-black/[0.02] transition-colors text-center cursor-pointer"
            >
              Back to Checkout
            </Link>
          </div>
          <p className="text-[11px] text-black/45 mt-8">
            Need help? Contact{" "}
            <a href="mailto:support@bagifyyyy.com" className="underline font-medium text-black">
              support@bagifyyyy.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const isCod = order.paymentMethod === "COD";
  const isPaid = order.paymentStatus === "PAID";

  if (isAwaitingPayment(order)) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center px-4 py-20 text-black font-sans">
        <div className="bg-white border border-black/10 rounded-2xl max-w-[540px] w-full p-8 sm:p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
          <div className="w-14 h-14 bg-[#f5f5f2] border border-black/15 rounded-full flex items-center justify-center mx-auto mb-5 text-black">
            <AlertCircle strokeWidth={2} className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/45 mb-2">
            TRANSACTION PENDING
          </p>
          <h1 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mb-3">
            Payment Not Completed
          </h1>
          <p className="text-xs sm:text-sm text-black/60 leading-relaxed mb-3 max-w-md mx-auto">
            Order #{order.orderNumber} was initialized, but payment has not been received yet. No funds have been debited.
          </p>
          <p className="text-xs sm:text-sm text-black/60 leading-relaxed mb-8 max-w-md mx-auto">
            Your cart pieces remain saved. You can pick up where you left off or complete checkout with another method.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/checkout"
              className="flex-1 bg-black text-white py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors text-center cursor-pointer shadow-xs"
            >
              Back to Checkout →
            </Link>
            <Link
              href="/"
              className="flex-1 border border-black/15 bg-white text-black py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:border-black hover:bg-black/[0.02] transition-colors text-center cursor-pointer"
            >
              Return to Home
            </Link>
          </div>
          <p className="text-[11px] text-black/45 mt-8">
            If your bank shows a deduction, contact{" "}
            <a href="mailto:support@bagifyyyy.com" className="underline font-medium text-black">
              support@bagifyyyy.com
            </a>{" "}
            with order #{order.orderNumber}.
          </p>
        </div>
      </div>
    );
  }

  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const earnedPoints = isPaid ? Math.floor(order.totalAmount / 10) : 0;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const address = order.shippingAddress;

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10">
      <div className="max-w-[840px] mx-auto">

        {/* Top Navigation Bar matching website standard */}
        <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-3">
          <Link
            href="/"
            className="editorial-back inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black/35">
            BAGIFYYYY / ARCHIVE
          </span>
        </div>

        {/* Main receipt card */}
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] relative">
          <div className="h-1 bg-black w-full" />

          {/* 1. Confirmation header */}
          <div className="p-8 sm:p-12 text-center border-b border-black/10">
            <div className="w-14 h-14 bg-[#f5f5f2] border border-black/10 rounded-full flex items-center justify-center mx-auto mb-5 text-black shadow-xs">
              <Check strokeWidth={2.5} className="w-6 h-6 text-black" aria-hidden="true" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-black/45 block mb-2">
              ✦ ORDER CONFIRMED
            </span>

            <h1 className="font-microgramma font-bold text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight leading-tight text-black mb-3">
              {isCod ? "Order Placed (COD)" : "Payment Successful"}
            </h1>

            <p className="text-xs sm:text-sm text-black/60 max-w-md mx-auto leading-relaxed mb-6 font-sans">
              {isCod
                ? "Your cash on delivery order is confirmed and queued for dispatch. Please keep the exact amount ready upon delivery."
                 : "Your payment went through and your pieces are reserved."}
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-[#f5f5f2] border border-black/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black">
              <span>Order #{order.orderNumber}</span>
              <span className="text-black/30" aria-hidden="true">•</span>
              <span>
                {isPaid ? "Paid via Razorpay" : isCod ? "Pay on Delivery" : "Payment Pending"}
              </span>
              <span className="text-black/30" aria-hidden="true">•</span>
              <span>{orderDate}</span>
            </div>

            {earnedPoints > 0 && (
              <div className="mt-5 inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                <span>+{earnedPoints} points added to {order.customerEmail}</span>
              </div>
            )}
          </div>

          {/* 2. Ordered items */}
          <div className="p-6 sm:p-10 border-b border-black/10 bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-6">
              <h2 className="font-sans font-medium text-base sm:text-lg uppercase tracking-tight flex items-center gap-2 text-black">
                <Package className="w-4 h-4 text-black/60" aria-hidden="true" /> Ordered Items ({order.items.length})
              </h2>
              <span className="text-xs font-bold uppercase tracking-wider text-black/45 font-sans">
                Order details
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 sm:gap-6 items-center justify-between pb-4 border-b border-black/10 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-20 bg-[#f5f5f2] border border-black/10 shrink-0 overflow-hidden rounded-xs">
                      <Image
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-tight text-black">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-black/60 bg-[#f5f5f2] px-2 py-0.5 border border-black/10">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-black/60 bg-[#f5f5f2] px-2 py-0.5 border border-black/10">
                          Size: {item.size}
                        </span>
                        {item.color && item.color !== "Default" && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-black/60 bg-[#f5f5f2] px-2 py-0.5 border border-black/10">
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-sans font-medium text-base sm:text-lg text-black shrink-0">
                    ₹{money(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Delivery and logistics */}
          <div className="p-6 sm:p-10 bg-[#f5f5f2]/50 border-b border-black/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-xs">
              <div>
                <h2 className="font-bold uppercase tracking-wider text-[10px] text-black/50 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-black" aria-hidden="true" /> Delivery Address
                </h2>
                <div className="bg-white border border-black/10 p-4 rounded-lg leading-relaxed shadow-2xs">
                  {address ? (
                    <>
                      <p className="font-semibold text-black text-sm">{address.fullName}</p>
                      <p className="text-black/70 mt-0.5">{address.street}</p>
                      <p className="text-black/70">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      <p className="text-black/70 mt-1 font-medium">
                        Phone: {order.customerPhone}
                      </p>
                    </>
                  ) : (
                    <p className="text-black/60">
                      Address on file. Contact support if you need to adjust it.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-bold uppercase tracking-wider text-[10px] text-black/50 mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-black" aria-hidden="true" /> Logistics &amp; Dispatch
                </h2>
                <div className="bg-white border border-black/10 p-4 rounded-lg leading-relaxed flex flex-col justify-between h-[calc(100%-28px)] shadow-2xs">
                  <div>
                    <p className="text-black/70">
                      Status:{" "}
                      <strong className="font-semibold text-black">
                        {orderStatusLabel(order.orderStatus)}
                      </strong>
                    </p>
                    <p className="text-black/70 mt-1">
                      Estimated delivery:{" "}
                      <strong className="font-semibold text-black">3 to 5 business days</strong>
                    </p>
                    {order.trackingId && (
                      <p className="text-black/70 mt-1">
                        Tracking ID:{" "}
                        <strong className="font-semibold text-black">{order.trackingId}</strong>
                      </p>
                    )}
                  </div>
                  {!order.trackingId && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-black/50 mt-2">
                      Tracking updates will be dispatched via SMS
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Payment breakdown */}
          <div className="p-6 sm:p-10 bg-white flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs text-black/65">
              <span>Items Subtotal</span>
              <span className="font-semibold text-black">₹{money(itemsSubtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-semibold text-black">
                <span>Discounts Applied</span>
                <span>−₹{money(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-black/65">
              <span>{isCod ? "Shipping & COD Handling" : "Shipping"}</span>
              <span
                className={
                  order.shippingAmount === 0
                    ? "font-semibold uppercase tracking-wider text-emerald-700"
                    : "font-semibold text-black"
                }
              >
                {order.shippingAmount === 0 ? "Free" : `₹${money(order.shippingAmount)}`}
              </span>
            </div>
            <div className="border-t border-black/10 pt-4 mt-1 flex justify-between items-center">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-black block">
                  {isPaid ? "Total Paid" : "Amount Due on Delivery"}
                </span>
                <span className="text-[10px] text-black/45 font-medium">
                  Inclusive of all taxes &amp; GST
                </span>
              </div>
              <span className="font-sans font-medium text-2xl sm:text-3xl text-black">
                ₹{money(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Navigation actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
          <Link
            href="/"
            className="flex-1 bg-black text-white py-4 text-xs font-semibold uppercase tracking-[0.14em] text-center hover:bg-black/85 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Return to Home Screen</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/account"
            className="flex-1 border border-black/15 bg-white text-black py-4 text-xs font-semibold uppercase tracking-[0.14em] text-center hover:border-black hover:bg-black/[0.02] transition-colors cursor-pointer"
          >
            View in My Account
          </Link>
          <Link
            href="/products"
            className="flex-1 border border-black/15 bg-white text-black py-4 text-xs font-semibold uppercase tracking-[0.14em] text-center hover:border-black hover:bg-black/[0.02] transition-colors cursor-pointer"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="text-center text-[11px] text-black/45 mt-8">
          Need help with this order? Email{" "}
          <a href="mailto:support@bagifyyyy.com" className="underline font-medium text-black">
            support@bagifyyyy.com
          </a>{" "}
          or DM{" "}
          <a
            href="https://instagram.com/bagifyyyy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium text-black"
          >
            @bagifyyyy
          </a>
          .
        </p>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-black/50">
          Loading your receipt…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
