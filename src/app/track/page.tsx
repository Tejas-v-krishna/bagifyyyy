"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Package, Truck, CheckCircle2, Clock, Copy, ArrowRight, ArrowLeft } from "lucide-react";

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [copiedTracking, setCopiedTracking] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found. Please verify your order number.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const steps = [
    { label: "CONFIRMED", icon: Clock },
    { label: "PROCESSING", icon: Package },
    { label: "SHIPPED", icon: Truck },
    { label: "DELIVERED", icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    const s = status.toUpperCase();
    if (s === "DELIVERED") return 3;
    if (s === "SHIPPED") return 2;
    return 1; // PROCESSING
  };

  return (
    <div className="bg-y2k-ice min-h-screen text-y2k-gunmetal py-8 sm:py-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">TRACK SHIPMENT</span>
        </div>

        {/* Search Box */}
        <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 shadow-xs mb-6 text-center">
          <Truck className="w-8 h-8 text-y2k-gunmetal/40 mx-auto mb-2" />
          <h1 className="font-display font-medium text-2xl uppercase tracking-tight mb-1 text-y2k-gunmetal">
            TRACK ARCHIVE DROP
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mb-5 max-w-sm mx-auto">
            Enter your order number (e.g. 1001) or airway bill tracking ID, plus the
            email address or phone number you used at checkout.
          </p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-2">
            <div>
              <label htmlFor="track-order" className="sr-only">
                Order number or tracking ID
              </label>
              <input
                required
                id="track-order"
                type="text"
                placeholder="e.g. 1001 or BGF-TRACK-XXXX"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal uppercase font-mono"
              />
            </div>
            <div>
              <label htmlFor="track-contact" className="sr-only">
                Email address or phone number used on the order
              </label>
              <input
                required
                id="track-contact"
                type="text"
                autoComplete="email"
                placeholder="Email or phone used on the order"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-bagify w-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? "Locating…" : "Track"}</span>
            </button>
          </form>

          {error && (
            <p
              role="alert"
              className="text-xs font-bold text-red-600 bg-red-50 p-2.5 border border-red-200 mt-4 max-w-md mx-auto"
            >
              {error}
            </p>
          )}
        </div>

        {/* Order Details Panel */}
        {order && (
          <div className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-y2k-gunmetal/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold">#{order.orderNumber}</span>
                  <span className="text-xs text-y2k-gunmetal/60">·</span>
                  <span className="text-xs text-y2k-gunmetal/70">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-y2k-gunmetal/60 uppercase mt-0.5">
                  Ship to: {order.shippingAddress?.fullName} ({order.shippingAddress?.city}, {order.shippingAddress?.state})
                </p>
              </div>

              <span className="text-[9px] font-bold uppercase px-3 py-1 bg-y2k-gunmetal text-white">
                {order.orderStatus}
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="py-2">
              <div className="grid grid-cols-4 gap-2 relative">
                {steps.map((step, idx) => {
                  const currentIdx = getStepIndex(order.orderStatus);
                  const isDone = idx <= currentIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 text-xs transition-colors ${
                          isDone
                            ? "bg-y2k-gunmetal text-white"
                            : "bg-y2k-ice text-y2k-gunmetal/40 border border-y2k-gunmetal/15"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isDone ? "text-y2k-gunmetal" : "text-y2k-gunmetal/40"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking ID Bar */}
            {order.trackingId && (
              <div className="p-3 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase text-y2k-gunmetal/60 block">Airway Bill Tracking ID</span>
                  <span className="font-mono font-bold text-y2k-gunmetal">{order.trackingId}</span>
                </div>
                <button
                  onClick={() => handleCopy(order.trackingId)}
                  className="btn-bagify text-[8px] font-bold uppercase px-2.5 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>{copiedTracking ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-y2k-gunmetal/5">
              {order.items?.map((it: any) => (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-12 bg-gray-100 shrink-0 overflow-hidden border border-y2k-gunmetal/10">
                      <Image
                        src={it.image || "/placeholder.jpg"}
                        alt={it.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold uppercase truncate text-y2k-gunmetal text-xs">{it.name}</p>
                      <p className="text-[9px] text-y2k-gunmetal/60 uppercase mt-0.5">
                        {it.quantity}x · {it.size} · {it.color}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-y2k-gunmetal shrink-0">
                    ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-y2k-gunmetal/10 flex items-center justify-between text-xs">
              <span className="font-bold text-y2k-gunmetal/70">Payment: {order.paymentMethod} ({order.paymentStatus})</span>
              <span className="font-display text-sm font-bold text-y2k-gunmetal">
                Total: ₹{order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
