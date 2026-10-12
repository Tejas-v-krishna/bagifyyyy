"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, Package, Truck, CheckCircle2, Clock, Copy, ArrowRight } from "lucide-react";
import { orderStatusLabel } from "@/lib/orderStatus";
import { useAuthStore } from "@/store/useAuthStore";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { getGuestOrders, SavedOrderSummary } from "@/lib/guestOrders";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

interface TrackedOrderItem {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
}

interface TrackedOrder {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingId: string | null;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: TrackedOrderItem[];
}

function TrackOrderContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") || searchParams.get("order") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [contact, setContact] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [guestOrders, setGuestOrders] = useState<SavedOrderSummary[]>([]);

  useEffect(() => {
    const list = getGuestOrders();
    setGuestOrders(list);
  }, []);

  const executeTrack = async (targetQuery: string, targetContact: string) => {
    if (!targetQuery.trim()) return;

    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const recaptchaToken = await getRecaptchaToken("track");
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery, contact: targetContact, honeypot, recaptchaToken }),
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveContact = contact.trim() || user?.email || "";
    await executeTrack(searchQuery, effectiveContact);
  };

  // If queryParam is in URL, auto-fill contact if found in local guest orders or user account and execute track
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
      const matched = getGuestOrders().find(
        (o) => o.orderNumber.toLowerCase() === queryParam.toLowerCase() || (o.trackingId && o.trackingId.toLowerCase() === queryParam.toLowerCase())
      );
      const effectiveContact = matched?.customerEmail || matched?.customerPhone || user?.email || contact.trim();
      if (effectiveContact) {
        setContact(effectiveContact);
        executeTrack(queryParam, effectiveContact);
      }
    }
  }, [queryParam, user?.email]);

  const handleSelectSavedOrder = (saved: SavedOrderSummary) => {
    setSearchQuery(saved.orderNumber);
    const chosenContact = saved.customerEmail || saved.customerPhone || user?.email || "";
    setContact(chosenContact);
    executeTrack(saved.orderNumber, chosenContact);
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
    if (s === "PROCESSING") return 1;
    return 0;
  };

  return (
    <EditorialPageShell
      eyebrow="Orders / Tracking"
      title="Track your order"
      description="Enter your order number or tracking ID, plus the email address or phone number used at checkout."
    >
      <div className="w-full">
        {/* Saved orders quick pills if available */}
        {guestOrders.length > 0 && !order && (
          <div className="mb-6 rounded-2xl border border-black/8 bg-[#eaeaea]/60 p-4 sm:p-5">
            <span className="mb-2.5 block font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-black/50">
              Recent Orders on this Device
            </span>
            <div className="flex flex-wrap gap-2">
              {guestOrders.slice(0, 4).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleSelectSavedOrder(g)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white"
                >
                  <span>#{g.orderNumber}</span>
                  <span className="text-[10px] opacity-60">
                    ₹{g.totalAmount.toLocaleString("en-IN")}
                  </span>
                  <ArrowRight className="h-3 w-3 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)] mb-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f2f2f2] flex items-center justify-center mx-auto mb-4">
            <Truck className="w-6 h-6 text-black" />
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-3">
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div>
              <label htmlFor="track-order" className="sr-only">
                Order number or tracking ID
              </label>
              <input
                required
                id="track-order"
                type="text"
                placeholder="BGF-123456 or tracking ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f8f8] border border-black/10 rounded-lg px-3.5 py-2.5 text-xs text-black outline-none focus:bg-white focus:border-black transition-colors uppercase font-mono"
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
                value={contact || user?.email || ""}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-[#f8f8f8] border border-black/10 rounded-lg px-3.5 py-2.5 text-xs text-black outline-none focus:bg-white focus:border-black transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-bagify btn-bagify-dark w-full py-3 text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? "Looking up…" : "Track order"}</span>
            </button>
          </form>

          {error && (
            <p
              role="alert"
              className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-4 max-w-md mx-auto"
            >
              {error}
            </p>
          )}
        </div>

        {/* Order Details Panel */}
        {order && (
          <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)] space-y-6">
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-lg font-bold text-black">#{order.orderNumber}</span>
                  <span className="text-xs text-black/35">·</span>
                  <span className="text-xs text-black/60 font-mono">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-black/50 uppercase mt-1">
                  Ship to: {order.shippingAddress?.fullName} ({order.shippingAddress?.city}, {order.shippingAddress?.state})
                </p>
              </div>

              <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] px-3.5 py-1.5 bg-black text-white rounded-[var(--radius-cta)]">
                {orderStatusLabel(order.orderStatus)}
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="py-3">
              <div className="grid grid-cols-4 gap-2 relative">
                {steps.map((step, idx) => {
                  const currentIdx = getStepIndex(order.orderStatus);
                  const isDone = idx <= currentIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex flex-col items-center text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-xs transition-colors ${
                          isDone
                            ? "bg-black text-white"
                            : "bg-[#f2f2f2] text-black/40 border border-black/10"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-[0.14em] ${
                          isDone ? "text-black" : "text-black/40"
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
              <div className="p-4 bg-[#f8f8f8] rounded-xl border border-black/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-black/50 block">Tracking ID</span>
                  <span className="font-mono font-bold text-black text-sm">{order.trackingId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => order.trackingId && handleCopy(order.trackingId)}
                  className="btn-bagify text-[8.5px] font-bold uppercase px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedTracking ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-black/5">
              {order.items?.map((it: TrackedOrderItem) => (
                <div key={it.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-14 bg-[#f2f2f2] rounded-lg shrink-0 overflow-hidden border border-black/10">
                      <Image
                        src={it.image || "/placeholder.jpg"}
                        alt={it.name}
                        fill
                        className="object-contain p-1 mix-blend-multiply"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold uppercase truncate text-black text-xs">{it.name}</p>
                      <p className="text-[10px] font-mono text-black/55 uppercase mt-0.5">
                        {it.quantity}x · {it.size} · {it.color}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-black shrink-0">
                    ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-black/60">Payment: {order.paymentMethod} ({order.paymentStatus})</span>
              <span className="font-sans text-base font-bold text-black">
                Total: ₹{order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </EditorialPageShell>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <EditorialPageShell
          eyebrow="Orders / Tracking"
          title="Track your order"
          description="Enter your order number or tracking ID, plus the email address or phone number used at checkout."
        >
          <div className="w-full flex justify-center py-20">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-black/50">
              Loading tracking portal…
            </div>
          </div>
        </EditorialPageShell>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
