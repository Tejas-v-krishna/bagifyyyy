"use client";

export const dynamic = "force-dynamic";

import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useSearchParams } from "next/navigation";
import { Check, Truck, Package, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, MapPin } from "lucide-react";
import Image from "next/image";

function SuccessContent() {
  const { clearCart } = useCartStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) {
            setOrder(data.order);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, clearCart]);

  const earnedPoints = order ? Math.floor(order.totalAmount / 10) : 150;
  const orderNumber = order?.orderNumber || "BGF-72048";
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="bg-y2k-ice min-h-[calc(100vh-64px)] py-12 md:py-20 text-y2k-gunmetal font-sans">
      <div className="max-w-[840px] mx-auto px-4 sm:px-6">
        
        {/* Main Certificate / Receipt Card */}
        <div className="bg-white border border-y2k-gunmetal/15 shadow-xl overflow-hidden relative">
          {/* Top Luxury Accent Bar */}
          <div className="h-1 bg-y2k-gunmetal w-full" />

          {/* 1. Header Verification Section */}
          <div className="p-8 sm:p-12 text-center border-b border-y2k-gunmetal/10">
            {/* Minimalist Monochrome Verification Seal */}
            <div className="w-14 h-14 bg-y2k-ice border border-y2k-gunmetal/10 rounded-full flex items-center justify-center mx-auto mb-5 text-y2k-gunmetal shadow-xs">
              <Check strokeWidth={2.5} className="w-6 h-6 text-y2k-gunmetal" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-2">
              ✦ ORDER VERIFIED &amp; CONFIRMED
            </span>

            <h1 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl uppercase tracking-[-0.03em] leading-tight text-y2k-gunmetal mb-3">
              {order?.paymentMethod === "COD" ? "ORDER PLACED (COD)" : "PAYMENT SUCCESSFUL"}
            </h1>

            <p className="text-xs sm:text-sm text-y2k-gunmetal/75 max-w-md mx-auto leading-relaxed mb-6 font-sans">
              {order?.paymentMethod === "COD"
                ? "Your Cash on Delivery order is confirmed and currently queued for dispatch from our archive hub."
                : "Thank you for your purchase. Your payment was verified securely and your pieces are reserved."}
            </p>

            {/* Order Reference Pill */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-y2k-ice border border-y2k-gunmetal/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
              <span>ORDER #{orderNumber}</span>
              <span className="text-y2k-gunmetal/30">•</span>
              <span>{order?.paymentStatus === "PAID" ? "PAID VIA RAZORPAY" : "COD PENDING"}</span>
              <span className="text-y2k-gunmetal/30">•</span>
              <span>{orderDate}</span>
            </div>

            {/* Loyalty Points Banner */}
            <div className="mt-5 inline-flex items-center gap-2 bg-[#232D3B] text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>+{earnedPoints} Chrome Points Credited to Your Account</span>
            </div>
          </div>

          {/* 2. Ordered Items List */}
          <div className="p-6 sm:p-10 border-b border-y2k-gunmetal/10 bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-y2k-gunmetal/10 mb-6">
              <h3 className="font-display font-medium text-lg uppercase tracking-tight flex items-center gap-2 text-y2k-gunmetal">
                <Package className="w-4 h-4 text-y2k-slate" /> Ordered Items ({order?.items?.length || 1})
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider text-y2k-slate font-sans">
                ARCHIVE DROP
              </span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-5">
              {order?.items && order.items.length > 0 ? (
                order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 sm:gap-6 items-center justify-between pb-4 border-b border-y2k-gunmetal/10 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-20 bg-y2k-ice border border-y2k-gunmetal/10 shrink-0 overflow-hidden">
                        <Image
                          src={item.image || "/assets/ai/prod_model_2_cargo_1786659253971.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-y2k-gunmetal">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                            QTY: {item.quantity}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                            SIZE: {item.size}
                          </span>
                          {item.color && item.color !== "Default" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                              {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-display font-medium text-base sm:text-lg text-y2k-gunmetal shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex gap-4 sm:gap-6 items-center justify-between pb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-20 bg-y2k-ice border border-y2k-gunmetal/10 shrink-0 overflow-hidden">
                      <Image
                        src="/assets/ai/prod_model_2_cargo_1786659253971.jpg"
                        alt="Acid Wash Cyber Cargo Pants"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-y2k-gunmetal">
                        ACID WASH CYBER CARGO PANTS
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                          QTY: 1
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                          SIZE: S
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                          ACID BLACK
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-display font-medium text-base sm:text-lg text-y2k-gunmetal shrink-0">
                    ₹3,999.00
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Split Delivery & Logistics Box */}
          <div className="p-6 sm:p-10 bg-y2k-ice/40 border-b border-y2k-gunmetal/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-xs">
              {/* Delivery Address */}
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] text-y2k-slate mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-y2k-gunmetal" /> Delivery Address
                </p>
                <div className="bg-white border border-y2k-gunmetal/10 p-4 leading-relaxed">
                  <p className="font-bold text-y2k-gunmetal text-sm">
                    {order?.shippingAddress?.fullName || "Tejas V Krishna"}
                  </p>
                  <p className="text-y2k-gunmetal/75 mt-0.5">
                    {order?.shippingAddress?.street || "xfgnsrfymutf"}
                  </p>
                  <p className="text-y2k-gunmetal/75">
                    {order?.shippingAddress?.city || "dgnadznmjftyh"},{" "}
                    {order?.shippingAddress?.state || "Maharashtra"} -{" "}
                    {order?.shippingAddress?.pincode || "783542"}
                  </p>
                  <p className="text-y2k-gunmetal/75 mt-1 font-semibold">
                    Phone: +91 {order?.customerPhone || "7374563793"}
                  </p>
                </div>
              </div>

              {/* Logistics & Tracking */}
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] text-y2k-slate mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-y2k-gunmetal" /> Logistics &amp; Tracking
                </p>
                <div className="bg-white border border-y2k-gunmetal/10 p-4 leading-relaxed flex flex-col justify-between h-[calc(100%-28px)]">
                  <div>
                    <p className="font-bold text-y2k-gunmetal flex items-center gap-2">
                      <span>India Post Speed Delivery</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </p>
                    <p className="text-y2k-gunmetal/75 mt-1">
                      Status: <strong className="font-bold text-y2k-gunmetal">Processing at Hub</strong>
                    </p>
                    <p className="text-y2k-gunmetal/75">
                      Estimated Delivery: <strong className="font-bold text-y2k-gunmetal">3-5 business days</strong>
                    </p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate mt-2">
                    Tracking ID will be SMS&apos;d upon dispatch
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Financial Total Summary */}
          <div className="p-6 sm:p-10 bg-white flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-y2k-gunmetal/70">
              <span>Shipping</span>
              <span className="font-bold uppercase tracking-wider text-emerald-700">COMPLIMENTARY (FREE)</span>
            </div>
            <div className="border-t border-y2k-gunmetal/10 pt-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-y2k-gunmetal block">
                  Total Paid:
                </span>
                <span className="text-[10px] text-y2k-slate font-medium">Inclusive of all duties &amp; GST</span>
              </div>
              <span className="font-display font-medium text-2xl sm:text-3xl text-y2k-gunmetal">
                ₹{(order?.totalAmount || 3999).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Navigation & Next Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/account"
            className="flex-1 btn-bagify text-white py-4 text-xs font-bold uppercase tracking-wider text-center hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2"
          >
            <span>VIEW IN MY ACCOUNT</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/products"
            className="flex-1 bg-white border border-y2k-gunmetal/15 hover:border-y2k-gunmetal text-y2k-gunmetal py-4 text-xs font-bold uppercase tracking-wider text-center hover:bg-black/[0.02] transition-colors"
          >
            CONTINUE EXPLORING DROPS
          </Link>
        </div>

        {/* Support Footnote */}
        <p className="text-center text-[11px] text-y2k-slate mt-8">
          Need support with this order? Contact{" "}
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
          </a>.
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
          Loading Order Receipt...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
