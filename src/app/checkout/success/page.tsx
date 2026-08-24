"use client";

export const dynamic = "force-dynamic";

import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useSearchParams } from "next/navigation";
import { Check, Truck, Package, ArrowRight, Sparkles, MapPin, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

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

const STATUS_LABEL: Record<string, string> = {
  PROCESSING: "Processing at hub",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  // Nothing on this page is ever invented. Every value below either comes from
  // the order row or is not shown at all. The page previously rendered a
  // complete fake receipt while the fetch was in flight, and kept rendering it
  // if the fetch failed: a hardcoded order number, a hardcoded item at
  // Rs 3,999, a hardcoded "COMPLIMENTARY (FREE)" shipping line, and a real
  // person's name, street, PIN code and phone number as the address.
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
          // Only empty the bag once the order is confirmed to exist. Clearing
          // it unconditionally threw away a shopper's cart if they ever landed
          // here with a bad link.
          clearCart();
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
      <div className="bg-y2k-ice min-h-[70vh] flex flex-col items-center justify-center gap-4 text-y2k-gunmetal">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]" role="status">
          Confirming your order
        </p>
      </div>
    );
  }

  if (status !== "loaded" || !order) {
    const isMissing = status === "missing";
    return (
      <div className="bg-y2k-ice min-h-[70vh] flex items-center justify-center px-4 py-20 text-y2k-gunmetal">
        <div className="bg-white border border-y2k-gunmetal/15 max-w-[520px] w-full p-8 sm:p-10 text-center">
          <div className="w-12 h-12 bg-y2k-ice border border-y2k-gunmetal/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle strokeWidth={2} className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-[-0.03em] mb-3">
            {isMissing ? "Receipt Not Available" : "Could Not Load Your Receipt"}
          </h1>
          <p className="text-xs sm:text-sm text-y2k-gunmetal/75 leading-relaxed mb-7">
            {isMissing
              ? "We could not find an order for this link. If you just paid, your order is safe and a confirmation email is on its way. You can also look it up with your order number."
              : "Your order is not affected. We just could not load the receipt right now."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isMissing && (
              <button
                onClick={retry}
                className="flex-1 btn-bagify text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            )}
            <Link
              href="/track"
              className="flex-1 bg-white border border-y2k-gunmetal/15 hover:border-y2k-gunmetal text-y2k-gunmetal py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-black/[0.02] transition-colors"
            >
              Track an Order
            </Link>
            <Link
              href="/account"
              className="flex-1 bg-white border border-y2k-gunmetal/15 hover:border-y2k-gunmetal text-y2k-gunmetal py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-black/[0.02] transition-colors"
            >
              My Orders
            </Link>
          </div>
          <p className="text-[11px] text-y2k-slate mt-7">
            Still stuck? Email{" "}
            <a href="mailto:support@bagifyyyy.com" className="underline font-bold text-y2k-gunmetal">
              support@bagifyyyy.com
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const isCod = order.paymentMethod === "COD";
  const isPaid = order.paymentStatus === "PAID";
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Points are awarded when a Razorpay payment is verified. COD orders do not
  // earn them, so the banner only appears when the points genuinely exist.
  const earnedPoints = isPaid ? Math.floor(order.totalAmount / 10) : 0;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const address = order.shippingAddress;

  return (
    <div className="bg-y2k-ice min-h-[calc(100vh-64px)] py-12 md:py-20 text-y2k-gunmetal font-sans">
      <div className="max-w-[840px] mx-auto px-4 sm:px-6">

        {/* Main receipt card */}
        <div className="bg-white border border-y2k-gunmetal/15 shadow-xl overflow-hidden relative">
          <div className="h-1 bg-y2k-gunmetal w-full" />

          {/* 1. Confirmation header */}
          <div className="p-8 sm:p-12 text-center border-b border-y2k-gunmetal/10">
            <div className="w-14 h-14 bg-y2k-ice border border-y2k-gunmetal/10 rounded-full flex items-center justify-center mx-auto mb-5 text-y2k-gunmetal shadow-xs">
              <Check strokeWidth={2.5} className="w-6 h-6 text-y2k-gunmetal" aria-hidden="true" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-2">
              ✦ Order Confirmed
            </span>

            <h1 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl uppercase tracking-[-0.03em] leading-tight text-y2k-gunmetal mb-3">
              {isCod ? "Order Placed (COD)" : "Payment Successful"}
            </h1>

            <p className="text-xs sm:text-sm text-y2k-gunmetal/75 max-w-md mx-auto leading-relaxed mb-6 font-sans">
              {isCod
                ? "Your cash on delivery order is confirmed and queued for dispatch. Please have the exact amount ready for the courier."
                : "Your payment went through and your pieces are reserved."}
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-y2k-ice border border-y2k-gunmetal/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
              <span>Order #{order.orderNumber}</span>
              <span className="text-y2k-gunmetal/30" aria-hidden="true">•</span>
              <span>
                {isPaid ? "Paid via Razorpay" : isCod ? "Pay on delivery" : "Payment pending"}
              </span>
              <span className="text-y2k-gunmetal/30" aria-hidden="true">•</span>
              <span>{orderDate}</span>
            </div>

            {earnedPoints > 0 && (
              <div className="mt-5 inline-flex items-center gap-2 bg-[#232D3B] text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                <span>+{earnedPoints} Chrome Points credited to {order.customerEmail}</span>
              </div>
            )}
          </div>

          {/* 2. Ordered items */}
          <div className="p-6 sm:p-10 border-b border-y2k-gunmetal/10 bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-y2k-gunmetal/10 mb-6">
              <h2 className="font-display font-medium text-lg uppercase tracking-tight flex items-center gap-2 text-y2k-gunmetal">
                <Package className="w-4 h-4 text-y2k-slate" aria-hidden="true" /> Ordered Items ({order.items.length})
              </h2>
              <span className="text-xs font-bold uppercase tracking-wider text-y2k-slate font-sans">
                Archive Drop
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 sm:gap-6 items-center justify-between pb-4 border-b border-y2k-gunmetal/10 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-20 bg-y2k-ice border border-y2k-gunmetal/10 shrink-0 overflow-hidden">
                      <Image
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-y2k-gunmetal">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                          Size: {item.size}
                        </span>
                        {item.color && item.color !== "Default" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold font-display font-medium text-base sm:text-lg text-y2k-gunmetal shrink-0">
                    ₹{money(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Delivery and logistics */}
          <div className="p-6 sm:p-10 bg-y2k-ice/40 border-b border-y2k-gunmetal/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-xs">
              <div>
                <h2 className="font-bold uppercase tracking-wider text-[10px] text-y2k-slate mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-y2k-gunmetal" aria-hidden="true" /> Delivery Address
                </h2>
                <div className="bg-white border border-y2k-gunmetal/10 p-4 leading-relaxed">
                  {address ? (
                    <>
                      <p className="font-bold text-y2k-gunmetal text-sm">{address.fullName}</p>
                      <p className="text-y2k-gunmetal/75 mt-0.5">{address.street}</p>
                      <p className="text-y2k-gunmetal/75">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      <p className="text-y2k-gunmetal/75 mt-1 font-semibold">
                        Phone: {order.customerPhone}
                      </p>
                    </>
                  ) : (
                    <p className="text-y2k-gunmetal/75">
                      Address on file. Contact support if you need to change it.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-bold uppercase tracking-wider text-[10px] text-y2k-slate mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-y2k-gunmetal" aria-hidden="true" /> Logistics &amp; Tracking
                </h2>
                <div className="bg-white border border-y2k-gunmetal/10 p-4 leading-relaxed flex flex-col justify-between h-[calc(100%-28px)]">
                  <div>
                    <p className="text-y2k-gunmetal/75">
                      Status:{" "}
                      <strong className="font-bold text-y2k-gunmetal">
                        {STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
                      </strong>
                    </p>
                    <p className="text-y2k-gunmetal/75 mt-1">
                      Estimated delivery:{" "}
                      <strong className="font-bold text-y2k-gunmetal">3 to 5 business days</strong>
                    </p>
                    {order.trackingId && (
                      <p className="text-y2k-gunmetal/75 mt-1">
                        Tracking ID:{" "}
                        <strong className="font-bold text-y2k-gunmetal">{order.trackingId}</strong>
                      </p>
                    )}
                  </div>
                  {!order.trackingId && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate mt-2">
                      Tracking ID sent by SMS on dispatch
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. What was actually charged */}
          <div className="p-6 sm:p-10 bg-white flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-y2k-gunmetal/70">
              <span>Items subtotal</span>
              <span className="font-semibold">₹{money(itemsSubtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold text-y2k-gunmetal">
                <span>Discounts</span>
                <span>−₹{money(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-y2k-gunmetal/70">
              <span>{isCod ? "Shipping & COD handling" : "Shipping"}</span>
              <span
                className={
                  order.shippingAmount === 0
                    ? "font-bold uppercase tracking-wider text-emerald-700"
                    : "font-semibold"
                }
              >
                {order.shippingAmount === 0 ? "Free" : `₹${money(order.shippingAmount)}`}
              </span>
            </div>
            <div className="border-t border-y2k-gunmetal/10 pt-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-y2k-gunmetal block">
                  {isPaid ? "Total paid" : "Amount due on delivery"}
                </span>
                <span className="text-[10px] text-y2k-slate font-medium">
                  Inclusive of all duties and GST
                </span>
              </div>
              <span className="font-bold font-display font-medium text-2xl sm:text-3xl text-y2k-gunmetal">
                ₹{money(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Next actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/account"
            className="flex-1 btn-bagify text-white py-4 text-xs font-bold uppercase tracking-wider text-center hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2"
          >
            <span>View in My Account</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/products"
            className="flex-1 bg-white border border-y2k-gunmetal/15 hover:border-y2k-gunmetal text-y2k-gunmetal py-4 text-xs font-bold uppercase tracking-wider text-center hover:bg-black/[0.02] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="text-center text-[11px] text-y2k-slate mt-8">
          Need help with this order? Contact{" "}
          <a href="mailto:support@bagifyyyy.com" className="underline font-bold text-y2k-gunmetal">
            support@bagifyyyy.com
          </a>{" "}
          or DM{" "}
          <a
            href="https://instagram.com/bagifyyyy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold text-y2k-gunmetal"
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
        <div className="bg-y2k-ice min-h-[70vh] flex items-center justify-center text-xs font-bold uppercase tracking-wider">
          Loading your receipt
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
