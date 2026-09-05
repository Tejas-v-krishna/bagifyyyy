"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import {
  LogOut,
  User,
  Package,
  Truck,
  MapPin,
  Award,
  Heart,
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { orderStatusLabel } from "@/lib/orderStatus";

type AccountTab = "orders" | "wishlist" | "addresses" | "loyalty" | "settings";

type LoyaltyTier = "CHROME" | "STEEL" | "GOLD";

const loyaltyTiers: Record<LoyaltyTier, { minimum: number; next: number | null; nextName: string | null }> = {
  CHROME: { minimum: 0, next: 500, nextName: "STEEL" },
  STEEL: { minimum: 500, next: 2000, nextName: "GOLD" },
  GOLD: { minimum: 2000, next: null, nextName: null },
};

function normalizeTier(value: unknown): LoyaltyTier {
  return value === "STEEL" || value === "GOLD" ? value : "CHROME";
}

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistIds, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const router = useRouter();

  const isAdmin = Boolean(
    user?.isAdmin ||
    (user?.email && ["admin@bagifyyyy.com", "admin@bagify.com"].includes(user.email.toLowerCase()))
  );

  const [activeTab, setActiveTab] = useState<AccountTab>("orders");
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.email) {
      fetch(`/api/loyalty?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => setLoyaltyData(data))
        .catch(console.error);
    }

    setLoadingOrders(true);
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(console.error)
      .finally(() => setLoadingOrders(false));

    setLoadingAddresses(true);
    fetch("/api/account/addresses")
      .then((res) => res.json())
      .then((data) => {
        if (data.addresses) setAddresses(data.addresses);
      })
      .catch(console.error)
      .finally(() => setLoadingAddresses(false));
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (!isAuthenticated || wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }
    const ids = wishlistIds.filter((id: string) => !String(id).startsWith('drop-') && !String(id).startsWith('prod-'));
    if (ids.length === 0) { setWishlistProducts([]); return; }
    setLoadingWishlist(true);
    fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`)
      .then((res) => res.json())
      .then((data: any[]) => {
        const list = Array.isArray(data) ? data : [];
        setWishlistProducts(list);
      })
      .catch(console.error)
      .finally(() => setLoadingWishlist(false));
  }, [isAuthenticated, wishlistIds]);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  const handleCopyTracking = (trackingId: string) => {
    navigator.clipboard.writeText(trackingId);
    setCopiedTrackingId(trackingId);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");
    setSavingAddress(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddressError(data.error || "Failed to save address.");
      } else {
        setAddresses((prev) => [data.address, ...prev]);
        setShowAddressForm(false);
        setAddressForm({
          fullName: "",
          phone: "",
          street: "",
          city: "",
          state: "Maharashtra",
          pincode: "",
        });
      }
    } catch {
      setAddressError("Error saving address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="editorial-page min-h-[calc(100svh-64px)] bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="mb-10 flex items-center justify-between border-b border-black/10 pb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to shop
            </Link>
            <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black/35 sm:block">
              BAGIFYYYY / MEMBER ACCESS
            </span>
          </div>

          <div className="grid overflow-hidden rounded-xl border border-black/10 bg-white lg:grid-cols-[1.35fr_0.65fr]">
            <section className="p-6 sm:p-10 lg:p-14">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">
                Account / Sign in
              </p>
              <h1 className="max-w-[11ch] font-microgramma text-[clamp(2.4rem,6vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.04em] text-black">
                Sign in to your account
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-black/55">
                Sign in to see saved pieces, orders, addresses, and points.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login?from=/account"
                  className="btn-bagify btn-bagify-dark inline-flex min-h-11 items-center justify-center gap-2 px-6 text-[10px] font-bold uppercase tracking-[0.18em]"
                >
                  Sign in to continue
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center justify-center px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-black/55 underline underline-offset-4 transition-colors hover:text-black"
                >
                  Keep shopping
                </Link>
              </div>
            </section>

            <aside className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-black p-6 text-white sm:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
                <div className="absolute inset-x-8 top-1/3 border-t border-white/40" />
                <div className="absolute bottom-8 left-1/3 top-8 border-l border-white/40" />
              </div>
              <div className="relative">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">Chrome Club / 001</span>
                <User className="mt-8 h-8 w-8 text-white/75" strokeWidth={1.4} aria-hidden="true" />
              </div>
              <p className="relative max-w-[18rem] text-[11px] uppercase leading-[1.55] tracking-[0.14em] text-white/60">
                Your orders and saved pieces, all in one place.
              </p>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  const memberId = user?.id ? `BGF-${user.id.slice(0, 8).toUpperCase()}` : "BGF-MEMBER";
  const points = Number(loyaltyData?.points) || 0;
  const tier = normalizeTier(loyaltyData?.tier);
  const tierInfo = loyaltyTiers[tier];
  const pointsToNext = tierInfo.next === null ? 0 : Math.max(0, tierInfo.next - points);
  const tierProgress = tierInfo.next === null
    ? 100
    : Math.min(100, Math.max(0, Math.round(((points - tierInfo.minimum) / (tierInfo.next - tierInfo.minimum)) * 100)));

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* ── Account navigation ─────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to shop
          </Link>
          <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black/35 sm:block">
            {memberId} / CHROME CLUB
          </span>
        </div>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">
              Member account
            </p>
            <h1 className="font-microgramma text-[clamp(2.5rem,7vw,6.5rem)] font-bold uppercase leading-[0.86] tracking-[-0.05em] text-black">
              Your account
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-black/55">
              Orders, saved pieces, addresses, and points in one place.
            </p>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/35 md:pb-1">
            Signed in / {tier}
          </span>
        </header>

        {/* ── Identity & loyalty ────────────────────────────────────────── */}
        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Member Profile */}
          <section className="flex flex-col justify-between rounded-xl border border-black/10 bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Avatar"
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 shrink-0 rounded-full border border-black/10 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-base font-bold text-white">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-microgramma text-base font-bold uppercase tracking-tight text-black sm:text-lg">
                      {user?.name || "MEMBER"}
                    </h2>
                    {isAdmin && (
                      <span className="bg-black px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-black/50">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="inline-flex shrink-0 items-center gap-1.5 border border-black/15 bg-[#f5f5f2] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-black hover:text-black"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>

            {isAdmin && (
              <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-4 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">Studio portal</span>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-1.5 bg-black px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black/75"
                >
                  <span>Open Studio</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            )}
          </section>

          {/* Loyalty status */}
          <section className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-black p-5 text-white sm:p-7">
            <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
              <div className="absolute inset-x-7 top-1/2 border-t border-white/30" />
              <div className="absolute bottom-7 left-1/2 top-7 border-l border-white/30" />
            </div>
            <div className="relative">
              <div className="mb-10 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55">
                  Chrome Club
                </span>
                <span className="border border-white/25 px-2 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                  {tier}
                </span>
              </div>

              <div className="mb-5 flex items-end justify-between gap-4">
                <p className="font-microgramma text-4xl font-bold leading-none tracking-[-0.04em] text-white sm:text-5xl">
                  {points} <span className="font-sans text-[10px] font-normal tracking-[0.16em] text-white/50">POINTS</span>
                </p>
              <button
                type="button"
                onClick={() => setActiveTab("loyalty")}
                className="cursor-pointer text-[9px] font-bold uppercase tracking-[0.16em] text-white/65 underline underline-offset-4 transition-colors hover:text-white"
              >
                View perks
              </button>
              </div>

              <div className="mb-2 h-1 w-full overflow-hidden bg-white/15">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-white/50">
                {pointsToNext > 0 ? `${pointsToNext} points to ${tierInfo.nextName}` : "Top tier"}
              </p>
            </div>
            <p className="relative mt-10 border-t border-white/15 pt-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">
               Rewards / Early access / New pieces
            </p>
          </section>
        </div>

        {/* ── Account metrics ────────────────────────────────────────────── */}
        <div className="mb-10 grid grid-cols-2 border-y border-black/10 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
            className={`border-r border-black/10 p-4 text-left transition-colors last:border-r-0 sm:p-5 ${
              activeTab === "orders"
                ? "bg-white"
                : "bg-transparent hover:bg-white/60"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/45">Orders</span>
              <Package className="h-3.5 w-3.5 text-black/45" />
            </div>
            <p className="font-microgramma text-2xl font-bold leading-none text-black">{orders.length}</p>
          </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("wishlist")}
            className={`border-r border-black/10 p-4 text-left transition-colors last:border-r-0 sm:p-5 ${
              activeTab === "wishlist"
                ? "bg-white"
                : "bg-transparent hover:bg-white/60"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/45">Saved</span>
              <Heart className="h-3.5 w-3.5 text-black/45" />
            </div>
            <p className="font-microgramma text-2xl font-bold leading-none text-black">{wishlistIds.length}</p>
          </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("addresses")}
            className={`border-r border-black/10 p-4 text-left transition-colors last:border-r-0 sm:p-5 ${
              activeTab === "addresses"
                ? "bg-white"
                : "bg-transparent hover:bg-white/60"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/45">Addresses</span>
              <MapPin className="h-3.5 w-3.5 text-black/45" />
            </div>
            <p className="font-microgramma text-2xl font-bold leading-none text-black">{addresses.length}</p>
          </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("loyalty")}
            className={`p-4 text-left transition-colors sm:p-5 ${
              activeTab === "loyalty"
                ? "bg-white"
                : "bg-transparent hover:bg-white/60"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/45">Points</span>
              <Award className="h-3.5 w-3.5 text-black/45" />
            </div>
            <p className="font-microgramma text-2xl font-bold leading-none text-black">{points}</p>
          </button>
        </div>

        {/* ── Minimalist segmented tabs ─────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-black/10 pb-0 select-none" role="tablist" aria-label="Account sections">
          {[
            { id: "orders", label: "Orders", count: orders.length },
            { id: "wishlist", label: "Saved", count: wishlistIds.length },
            { id: "addresses", label: "Addresses", count: addresses.length },
            { id: "loyalty", label: "VIP Perks" },
            { id: "settings", label: "Settings" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`account-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`account-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id as AccountTab)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors sm:text-[11px] ${
                  isActive
                    ? "border-black bg-white text-black"
                    : "border-transparent text-black/40 hover:text-black"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[8px] px-1 py-0.2 font-mono ${
                    isActive ? "bg-black text-white" : "bg-black/10 text-black/60"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main Tab Panels ─────────────────────────────────────────────── */}
        <div>
          {/* 1. ORDERS TAB */}
          {activeTab === "orders" && (
            <div id="account-panel-orders" role="tabpanel" aria-labelledby="account-tab-orders" className="space-y-3">
              {loadingOrders ? (
                <div className="rounded-xl border border-black/10 bg-white p-8 text-center text-xs font-bold uppercase tracking-[0.16em] text-black/45">
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
                  <ShoppingBag className="mx-auto mb-4 h-8 w-8 text-black/25" />
                  <p className="mb-1 font-microgramma text-xs font-bold uppercase tracking-tight text-black sm:text-sm">
                    NO ORDERS YET
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify btn-bagify-dark mt-4 inline-flex items-center gap-1.5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
                  >
                     <span>SHOP PIECES</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl border border-black/10 bg-white p-4 sm:p-6"
                    >
                      {/* Header */}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-tight text-black">#{ord.orderNumber}</span>
                          <span className="text-[10px] text-black/30">/</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/50">
                            {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="border border-black/15 bg-[#f5f5f2] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-black">
                            {orderStatusLabel(ord.orderStatus)}
                          </span>

                          {ord.trackingId && (
                            <button
                              onClick={() => handleCopyTracking(ord.trackingId)}
                              className="flex cursor-pointer items-center gap-1 border border-black/10 bg-[#f5f5f2] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white"
                              title="Copy tracking"
                            >
                              <Truck className="w-2.5 h-2.5 text-y2k-gunmetal" />
                              <span>{copiedTrackingId === ord.trackingId ? "Copied" : ord.trackingId}</span>
                              <Copy className="w-2 h-2 opacity-60" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mb-3 divide-y divide-black/5">
                        {ord.items?.map((it: any) => (
                          <div key={it.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-black/10 bg-[#f2f2f0]">
                                <Image
                                  src={it.image || "/placeholder.jpg"}
                                  alt={it.name}
                                  fill
                                  className="object-cover"
                                  sizes="36px"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold uppercase text-black">{it.name}</p>
                                <p className="text-[9px] uppercase tracking-[0.08em] text-black/50">
                                  {it.quantity}x · {it.size} · {it.color}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-black">
                              ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between gap-4 border-t border-black/10 pt-3 text-xs">
                        <span className="truncate text-[10px] uppercase tracking-[0.08em] text-black/50">
                          {ord.shippingAddress?.fullName} ({ord.shippingAddress?.city})
                        </span>
                        <span className="font-mono text-sm font-bold text-black">
                          Total: ₹{ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SAVED PIECES TAB */}
          {activeTab === "wishlist" && (
            <div id="account-panel-wishlist" role="tabpanel" aria-labelledby="account-tab-wishlist" className="space-y-3">
              {loadingWishlist ? (
                <div className="rounded-xl border border-black/10 bg-white p-8 text-center text-xs font-bold uppercase tracking-[0.16em] text-black/45">
                  Loading saved…
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
                  <Heart className="mx-auto mb-4 h-8 w-8 text-black/25" />
                  <p className="mb-2 font-microgramma text-xs font-bold uppercase tracking-tight text-black sm:text-sm">
                    WISHLIST EMPTY
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify btn-bagify-dark inline-block px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
                  >
                     Shop Pieces
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between rounded-xl border border-black/10 bg-white p-2.5"
                    >
                      <Link href={`/product/${p.id}`} className="block">
                        <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-[#ededeb]">
                          <Image
                            src={p.images?.[0]?.url || p.images?.[0] || "/placeholder.jpg"}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                        <h4 className="truncate text-xs font-bold uppercase text-black">{p.name}</h4>
                        <p className="mt-1 text-xs font-bold text-black">₹{p.price.toLocaleString("en-IN")}</p>
                      </Link>

                      <div className="mt-3 flex items-center gap-1.5 border-t border-black/10 pt-3">
                        <button
                          onClick={() => {
                            addItem({
                              id: p.id,
                              name: p.name,
                              price: p.price,
                              image: p.images?.[0]?.url || p.images?.[0] || "/placeholder.jpg",
                              quantity: 1,
                              size: p.sizes?.[0] || "One Size",
                              color: p.colors?.[0] || "Default",
                            });
                          }}
                          className="btn-bagify flex-1 cursor-pointer py-2 text-center text-[8px] font-bold uppercase tracking-[0.12em]"
                        >
                          Add to Bag
                        </button>
                        <button
                          onClick={() => toggleItem(p.id)}
                          className="cursor-pointer border border-black/10 p-2 text-black/55 transition-colors hover:border-black hover:text-black"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SAVED ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div id="account-panel-addresses" role="tabpanel" aria-labelledby="account-tab-addresses" className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                    Saved destinations
                  </p>
                  <span className="mt-1 block text-xs text-black/50">
                    Destinations ({addresses.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(!showAddressForm);
                    setAddressError("");
                  }}
                  className="btn-bagify cursor-pointer px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em]"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddressForm ? "Cancel" : "Add Address"}</span>
                </button>
              </div>

              {/* Add Address Form */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddAddress}
                    className="rounded-xl border border-black bg-white p-4 sm:p-6 flex flex-col gap-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                          Full Name *
                        </label>
                        <input
                          required
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                          placeholder="Alex Vance"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                          Phone (+91) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                        Street Address *
                      </label>
                      <input
                        required
                        value={addressForm.street}
                        onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                        className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                        placeholder="Flat 402, Lotus Heights, MG Road"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                          Pincode *
                        </label>
                        <input
                          required
                          maxLength={6}
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value }))}
                          className="w-full border border-black/15 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-black"
                          placeholder="400001"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                          City *
                        </label>
                        <input
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                          className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                          State *
                        </label>
                        <input
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                          className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                          placeholder="Maharashtra"
                        />
                      </div>
                    </div>

                    {addressError && (
                      <p className="border border-black/15 bg-[#f2f2f0] p-2 text-xs font-bold text-black" role="alert">
                        {addressError}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="cursor-pointer border border-black/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-bagify cursor-pointer px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                      >
                        {savingAddress ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Grid */}
              {loadingAddresses ? (
                <div className="rounded-xl border border-black/10 bg-white p-8 text-center text-xs font-bold uppercase tracking-[0.16em] text-black/45">
                  Loading addresses…
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
                  <MapPin className="mx-auto mb-3 h-7 w-7 text-black/25" />
                  <p className="mb-3 text-xs text-black/55">No saved addresses.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="btn-bagify px-4 py-2 text-[9px] font-bold uppercase tracking-wider inline-block cursor-pointer"
                  >
                    + Add Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr.id}
                      className="rounded-xl border border-black/10 bg-white p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="border border-black/15 bg-[#f5f5f2] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-black">
                            {idx === 0 ? "PRIMARY" : `SAVED #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="flex cursor-pointer items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black/45 transition-colors hover:text-black"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                        <p className="mt-5 text-xs font-bold text-black">{addr.fullName}</p>
                        <p className="mt-1 font-mono text-[10px] text-black/50">{addr.phone}</p>
                        <p className="mt-2 text-xs leading-snug text-black/65">
                          {addr.street}, {addr.city}, {addr.state} / <b className="font-mono">{addr.pincode}</b>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. VIP PERKS TAB */}
          {activeTab === "loyalty" && (
            <div id="account-panel-loyalty" role="tabpanel" aria-labelledby="account-tab-loyalty" className="space-y-4">
              <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-2 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Chrome Club</p>
                    <h2 className="mt-2 font-microgramma text-xl font-bold uppercase tracking-tight text-black">Member benefits</h2>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-black/40">{points} points earned</span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                  <div className={`border p-4 ${tier === "CHROME" ? "border-black bg-[#f5f5f2]" : "border-black/10 bg-white"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">Chrome / 0-499</p>
                    <p className="mt-3 text-[10px] leading-relaxed text-black/55">Early drop access and free shipping over ₹2000.</p>
                  </div>
                  <div className={`border p-4 ${tier === "STEEL" ? "border-black bg-[#f5f5f2]" : "border-black/10 bg-white"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">Steel / 500-1999</p>
                    <p className="mt-3 text-[10px] leading-relaxed text-black/55">Free express shipping and a 1.5x points multiplier.</p>
                  </div>
                  <div className={`border p-4 ${tier === "GOLD" ? "border-black bg-[#f5f5f2]" : "border-black/10 bg-white"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black">Gold / 2000+</p>
                    <p className="mt-3 text-[10px] leading-relaxed text-black/55">2x points and priority fulfillment for every drop.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-7">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Points activity</p>
                {loyaltyData?.history && loyaltyData.history.length > 0 ? (
                  <div className="divide-y divide-black/10">
                    {loyaltyData.history.map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between gap-4 py-3 text-xs">
                        <span className="font-bold text-black">{h.reason}</span>
                        <span className="shrink-0 font-mono text-xs font-bold text-black">+{h.points} PTS</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-black/55">Earn 10 points per ₹100 spent on eligible orders.</p>
                )}
              </section>
            </div>
          )}

          {/* 5. SETTINGS TAB */}
          {activeTab === "settings" && (
            <section id="account-panel-settings" role="tabpanel" aria-labelledby="account-tab-settings" className="space-y-4 rounded-xl border border-black/10 bg-white p-5 text-xs sm:p-7">
              <div className="border-b border-black/10 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Account settings</p>
                <p className="mt-2 text-xs leading-relaxed text-black/55">Your member details and active sign-in method.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border border-black/10 bg-[#f5f5f2] p-4">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Name</span>
                  <p className="mt-2 text-xs font-bold text-black">{user?.name || "Not set"}</p>
                </div>
                <div className="border border-black/10 bg-[#f5f5f2] p-4">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Email</span>
                  <p className="mt-2 truncate text-xs font-bold text-black">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border border-black/10 bg-[#f5f5f2] p-4">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Sign-in method</span>
                  <p className="mt-2 text-xs font-bold text-black">{user?.googleId ? "Google OAuth" : "Email & Password"}</p>
                </div>
                <span className="bg-black px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white">Verified</span>
              </div>

              <div className="flex items-center justify-between border-t border-black/10 pt-4">
                <span className="text-[10px] uppercase tracking-[0.12em] text-black/45">Active session</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-black underline underline-offset-4 transition-opacity hover:opacity-55"
                >
                  Sign out
                </button>
              </div>
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
