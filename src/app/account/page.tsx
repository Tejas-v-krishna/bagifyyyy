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
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Tag,
  Check,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistIds, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const router = useRouter();

  const isAdmin = Boolean(
    user?.isAdmin ||
    (user?.email && ["admin@bagifyyyy.com", "admin@bagify.com"].includes(user.email.toLowerCase()))
  );

  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "addresses" | "loyalty" | "settings" | "admin">("orders");
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

  // Load User Data
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

  // Load Wishlist preview items
  useEffect(() => {
    if (!isAuthenticated || wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }
    setLoadingWishlist(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: any[]) => {
        const matches = data.filter((p) => wishlistIds.includes(p.id));
        setWishlistProducts(matches);
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
      setAddressError("Something went wrong.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete address error:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-y2k-ice min-h-[75vh] flex items-center justify-center px-4 py-16 text-y2k-gunmetal font-sans">
        <div className="w-full max-w-sm bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 text-center shadow-md">
          <div className="w-12 h-12 rounded-full bg-y2k-ice border border-y2k-gunmetal/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-5 h-5 text-y2k-gunmetal" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            ARCHIVE PASSPORT
          </span>
          <h1 className="font-display font-medium text-2xl uppercase tracking-[-0.03em] mb-2 text-y2k-gunmetal">
            ACCOUNT ACCESS
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-6">
            Sign in to access your orders, track shipments, and view member benefits.
          </p>
          <Link
            href="/login"
            className="btn-bagify w-full py-3.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
          >
            <span>SIGN IN / REGISTER</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const memberId = user?.id ? `BGF-${user.id.slice(0, 8).toUpperCase()}` : "BGF-MEMBER";
  const points = loyaltyData?.points || 0;
  const tier = loyaltyData?.tier || "CHROME";
  const pointsToNextTier = Math.max(0, 500 - points);
  const tierProgress = Math.min(100, Math.round((points / 500) * 100));

  return (
    <div className="bg-y2k-ice min-h-screen text-y2k-gunmetal py-6 sm:py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Top Header / Breadcrumb Bar ───────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-y2k-gunmetal/15 text-[10px] font-bold uppercase tracking-[0.18em] text-y2k-slate">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-black">HOME</Link>
            <span>/</span>
            <span className="text-y2k-gunmetal">MEMBER PASSPORT</span>
          </div>
          <span className="font-mono text-y2k-gunmetal/60">ID: {memberId}</span>
        </div>

        {/* ── Balanced Hero Identity Zone (Member Info + VIP Badge) ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          
          {/* Member Profile Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-y2k-gunmetal" />
                  AUTHENTICATED MEMBER
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Member Avatar"}
                    className="w-14 h-14 rounded-full object-cover border border-y2k-gunmetal/20 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="font-display font-medium text-xl sm:text-2xl uppercase tracking-tight text-y2k-gunmetal truncate">
                    {user?.name || "BAGIFYYYY MEMBER"}
                  </h2>
                  <p className="text-xs text-y2k-gunmetal/70 truncate mt-0.5">
                    {user?.email}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[8px] font-mono font-bold bg-y2k-ice border border-y2k-gunmetal/15 px-2 py-0.5 text-y2k-gunmetal">
                      {memberId}
                    </span>
                    {isAdmin && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-y2k-gunmetal text-white px-2 py-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}
                    <span className="text-[8px] font-bold uppercase tracking-wider bg-white border border-y2k-gunmetal/20 text-y2k-gunmetal px-2 py-0.5 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> {user?.googleId ? "Google Linked" : "Verified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-y2k-gunmetal/10 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80">
                  Studio Administration
                </span>
                <Link
                  href="/studio"
                  className="bg-y2k-gunmetal text-white hover:bg-black px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <span>Open Studio</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            )}
          </div>

          {/* VIP Chrome Pass Card (5 cols) */}
          <div className="lg:col-span-5 bg-y2k-gunmetal text-[#F8F5E9] p-5 sm:p-6 shadow-md flex flex-col justify-between relative overflow-hidden border border-y2k-gunmetal">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-white" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                    CHROME CLUB VIP
                  </span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-white/15 border border-white/25 px-2 py-0.5 text-white">
                  TIER: {tier}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Points Balance</p>
                  <p className="font-display text-3xl font-bold text-white tracking-tight leading-none mt-1">
                    {points} <span className="text-xs font-sans text-white/60 font-normal">PTS</span>
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("loyalty")}
                  className="text-[9px] font-bold uppercase tracking-widest text-white hover:underline underline-offset-4 cursor-pointer"
                >
                  View Perks →
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/15 h-1.5 mb-1.5 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>

              <p className="text-[9px] font-medium text-white/70">
                {pointsToNextTier > 0
                  ? `Earn ${pointsToNextTier} more pts for STEEL VIP`
                  : "Maximum VIP tier status unlocked"}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/80">
              <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-white" /> Free Ship ₹2000+</span>
              <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-white" /> Drop Presales</span>
            </div>
          </div>

        </div>

        {/* ── 4-Stat Metric Row / Quick Tabs ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`p-3.5 text-left border transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-1px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Package className="w-3.5 h-3.5 text-y2k-gunmetal/70" />
              <span className="text-[9px] font-bold text-y2k-gunmetal/50 uppercase tracking-widest">ORDERS</span>
            </div>
            <p className="font-display text-xl font-bold text-y2k-gunmetal">{orders.length}</p>
            <p className="text-[9px] text-y2k-gunmetal/60 mt-0.5">Purchases</p>
          </button>

          <button
            onClick={() => setActiveTab("wishlist")}
            className={`p-3.5 text-left border transition-all cursor-pointer ${
              activeTab === "wishlist"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-1px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Heart className="w-3.5 h-3.5 text-y2k-gunmetal/70" />
              <span className="text-[9px] font-bold text-y2k-gunmetal/50 uppercase tracking-widest">SAVED</span>
            </div>
            <p className="font-display text-xl font-bold text-y2k-gunmetal">{wishlistIds.length}</p>
            <p className="text-[9px] text-y2k-gunmetal/60 mt-0.5">Wishlist</p>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`p-3.5 text-left border transition-all cursor-pointer ${
              activeTab === "addresses"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-1px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-y2k-gunmetal/70" />
              <span className="text-[9px] font-bold text-y2k-gunmetal/50 uppercase tracking-widest">ADDRESSES</span>
            </div>
            <p className="font-display text-xl font-bold text-y2k-gunmetal">{addresses.length}</p>
            <p className="text-[9px] text-y2k-gunmetal/60 mt-0.5">Destinations</p>
          </button>

          <button
            onClick={() => setActiveTab("loyalty")}
            className={`p-3.5 text-left border transition-all cursor-pointer ${
              activeTab === "loyalty"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-1px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Award className="w-3.5 h-3.5 text-y2k-gunmetal/70" />
              <span className="text-[9px] font-bold text-y2k-gunmetal/50 uppercase tracking-widest">POINTS</span>
            </div>
            <p className="font-display text-xl font-bold text-y2k-gunmetal">{points}</p>
            <p className="text-[9px] text-y2k-gunmetal/60 mt-0.5">Chrome Credits</p>
          </button>
        </div>

        {/* ── Segmented Navigation Tabs Bar ───────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 border-b border-y2k-gunmetal/15 pb-0 overflow-x-auto select-none no-scrollbar">
          {[
            { id: "orders", label: "Orders", count: orders.length, icon: Package },
            { id: "wishlist", label: "Saved Pieces", count: wishlistIds.length, icon: Heart },
            { id: "addresses", label: "Addresses", count: addresses.length, icon: MapPin },
            { id: "loyalty", label: "VIP Club", count: points > 0 ? `${points}p` : undefined, icon: Award },
            { id: "settings", label: "Settings", icon: ShieldCheck },
            ...(isAdmin ? [{ id: "admin", label: "Studio Admin", count: undefined, icon: ShieldCheck }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-y2k-gunmetal text-y2k-gunmetal bg-white/80"
                    : "border-transparent text-y2k-gunmetal/50 hover:text-y2k-gunmetal hover:bg-white/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[9px] px-1.5 py-0.2 font-mono ${
                    isActive ? "bg-y2k-gunmetal text-white" : "bg-y2k-gunmetal/10 text-y2k-gunmetal/70"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content Panels ─────────────────────────────────────────── */}
        <div>
          {/* 1. ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-10 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/50">
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 sm:p-12 text-center shadow-xs">
                  <ShoppingBag className="w-10 h-10 text-y2k-gunmetal/30 mx-auto mb-3" />
                  <h3 className="font-display font-medium text-lg uppercase tracking-tight mb-1 text-y2k-gunmetal">
                    NO ORDERS IN YOUR ARCHIVE
                  </h3>
                  <p className="text-xs text-y2k-gunmetal/70 max-w-sm mx-auto mb-5">
                    Explore our active limited-batch streetwear drops to build your collection.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 shadow-xs"
                  >
                    <span>EXPLORE ACTIVE DROPS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-y2k-gunmetal/15 p-4 sm:p-5 shadow-xs"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-y2k-gunmetal/10 pb-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-y2k-ice border border-y2k-gunmetal/15 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-y2k-gunmetal" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold tracking-tight">#{ord.orderNumber}</span>
                              <span className="text-[10px] text-y2k-gunmetal/40">·</span>
                              <span className="text-xs text-y2k-gunmetal/70 font-medium">
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[8px] font-bold uppercase px-2 py-0.5 border ${
                              ord.orderStatus === "DELIVERED"
                                ? "bg-y2k-gunmetal text-white border-y2k-gunmetal"
                                : "bg-y2k-ice text-y2k-gunmetal border-y2k-gunmetal/30"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>

                          {ord.trackingId && (
                            <button
                              onClick={() => handleCopyTracking(ord.trackingId)}
                              className="text-[8px] font-bold uppercase tracking-wider bg-y2k-ice border border-y2k-gunmetal/20 px-2 py-0.5 text-y2k-gunmetal flex items-center gap-1 hover:bg-white cursor-pointer"
                              title="Click to copy tracking ID"
                            >
                              <Truck className="w-2.5 h-2.5 text-y2k-gunmetal" />
                              <span>{copiedTrackingId === ord.trackingId ? "Copied!" : ord.trackingId}</span>
                              <Copy className="w-2 h-2 opacity-60" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-y2k-gunmetal/5 mb-3">
                        {ord.items?.map((it: any) => (
                          <div key={it.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-11 h-13 bg-gray-100 shrink-0 overflow-hidden border border-y2k-gunmetal/10">
                                <Image
                                  src={it.image || "/placeholder.jpg"}
                                  alt={it.name}
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold uppercase truncate text-y2k-gunmetal">{it.name}</p>
                                <p className="text-[9px] text-y2k-gunmetal/60 uppercase tracking-wider mt-0.5">
                                  Qty: {it.quantity} · {it.size} · {it.color}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-y2k-gunmetal shrink-0">
                              ₹{(it.price * it.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="pt-2.5 border-t border-y2k-gunmetal/10 flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-[10px] text-y2k-gunmetal/70 truncate">
                          Ship to: {ord.shippingAddress?.fullName} ({ord.shippingAddress?.city}, {ord.shippingAddress?.state})
                        </span>
                        <div className="flex items-center gap-3">
                          {ord.discountAmount > 0 && (
                            <span className="text-[10px] text-y2k-gunmetal font-bold uppercase bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/15">
                              Saved ₹{ord.discountAmount.toFixed(2)}
                            </span>
                          )}
                          <span className="font-display text-sm font-bold text-y2k-gunmetal">
                            Total: ₹{ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SAVED PIECES (WISHLIST) TAB */}
          {activeTab === "wishlist" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal">
                  Saved Pieces ({wishlistProducts.length})
                </h3>
                <Link
                  href="/wishlist"
                  className="text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-black"
                >
                  Full Wishlist →
                </Link>
              </div>

              {loadingWishlist ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/50">
                  Loading saved pieces…
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center shadow-xs">
                  <Heart className="w-8 h-8 text-y2k-gunmetal/30 mx-auto mb-2.5" />
                  <p className="font-display font-medium text-base uppercase tracking-tight mb-1 text-y2k-gunmetal">
                    YOUR WISHLIST IS EMPTY
                  </p>
                  <p className="text-xs text-y2k-gunmetal/70 max-w-xs mx-auto mb-4">
                    Save pieces from our drops to keep track of remaining stock.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify px-5 py-2.5 text-xs font-bold uppercase tracking-widest inline-block"
                  >
                    Browse Drops
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-y2k-gunmetal/15 p-3 flex flex-col justify-between group shadow-xs"
                    >
                      <Link href={`/product/${p.id}`} className="block">
                        <div className="relative aspect-[3/4] bg-gray-100 mb-2 overflow-hidden">
                          <Image
                            src={p.images?.[0]?.url || p.images?.[0] || "/placeholder.jpg"}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                        <p className="text-[9px] font-bold uppercase text-y2k-gunmetal/50 truncate">
                          {p.brand || "BAGIFYYYY"}
                        </p>
                        <h4 className="font-bold text-xs uppercase truncate text-y2k-gunmetal mt-0.5">{p.name}</h4>
                        <p className="font-bold text-xs text-y2k-gunmetal mt-0.5">₹{p.price.toLocaleString("en-IN")}</p>
                      </Link>

                      <div className="mt-3 pt-2 border-t border-y2k-gunmetal/10 flex items-center gap-1.5">
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
                          className="flex-1 btn-bagify text-[9px] font-bold uppercase tracking-wider py-1.5 cursor-pointer text-center"
                        >
                          Add to Bag
                        </button>
                        <button
                          onClick={() => toggleItem(p.id)}
                          className="p-1.5 border border-y2k-gunmetal/20 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer text-y2k-gunmetal"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal">
                    Delivery Addresses ({addresses.length})
                  </h3>
                  <p className="text-xs text-y2k-gunmetal/60">Saved destinations for one-click fulfillment.</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddressForm(!showAddressForm);
                    setAddressError("");
                  }}
                  className="btn-bagify text-[9px] font-bold uppercase tracking-widest px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
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
                    className="bg-white border-2 border-y2k-gunmetal p-5 sm:p-6 flex flex-col gap-3.5 shadow-md overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-y2k-gunmetal/10 pb-2.5">
                      <p className="text-xs font-bold uppercase tracking-widest text-y2k-gunmetal">
                        New Delivery Destination
                      </p>
                      <span className="text-[9px] text-y2k-gunmetal/50 uppercase">* All fields mandatory</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          Recipient Full Name *
                        </label>
                        <input
                          required
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="e.g. Alex Vance"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          Phone Number (+91) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                        Street Address & Building / Landmark *
                      </label>
                      <input
                        required
                        value={addressForm.street}
                        onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                        className="w-full border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                        placeholder="Flat 402, Lotus Heights, MG Road"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          Pincode *
                        </label>
                        <input
                          required
                          maxLength={6}
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal font-mono bg-white"
                          placeholder="400001"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          City *
                        </label>
                        <input
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          State *
                        </label>
                        <input
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="Maharashtra"
                        />
                      </div>
                    </div>

                    {addressError && (
                      <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 border border-red-200">
                        {addressError}
                      </p>
                    )}

                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 border border-y2k-gunmetal/30 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-bagify px-5 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                      >
                        {savingAddress ? "Saving…" : "Save Address →"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Grid */}
              {loadingAddresses ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/50">
                  Loading addresses…
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center shadow-xs">
                  <MapPin className="w-8 h-8 text-y2k-gunmetal/30 mx-auto mb-2" />
                  <p className="font-bold text-xs text-y2k-gunmetal uppercase tracking-wider mb-1">
                    No Saved Addresses
                  </p>
                  <p className="text-xs text-y2k-gunmetal/70 mb-4">
                    Save your primary destination to streamline checkout on high-demand drops.
                  </p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="btn-bagify px-5 py-2.5 text-xs font-bold uppercase tracking-widest inline-block cursor-pointer"
                  >
                    + Add Primary Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-y2k-gunmetal/15 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-y2k-gunmetal/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-y2k-ice border border-y2k-gunmetal/15 px-2 py-0.5 text-y2k-gunmetal">
                            {idx === 0 ? "PRIMARY DESTINATION" : `SAVED LOCATION #${idx + 1}`}
                          </span>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                        <p className="font-bold text-sm text-y2k-gunmetal">{addr.fullName}</p>
                        <p className="text-[11px] text-y2k-gunmetal/70 font-mono mt-0.5">{addr.phone}</p>
                        <p className="text-xs text-y2k-gunmetal/80 mt-1.5 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.state} — <b className="font-mono">{addr.pincode}</b>
                        </p>
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-y2k-gunmetal/10 flex items-center justify-between text-[9px] font-bold text-y2k-gunmetal/60 uppercase">
                        <span>Standard & Express</span>
                        <span className="text-y2k-gunmetal font-bold">✦ Verified Pincode</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. CHROME CLUB VIP TAB */}
          {activeTab === "loyalty" && (
            <div className="space-y-4">
              {/* VIP Status Card */}
              <div className="bg-y2k-gunmetal text-[#F8F5E9] p-5 sm:p-6 shadow-md border border-y2k-gunmetal">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                      CHROME CLUB PROGRESSION
                    </span>
                    <h3 className="font-display font-medium text-2xl uppercase tracking-tight text-white mt-0.5">
                      TIER STATUS: {tier}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Balance</p>
                    <p className="font-display text-3xl text-white font-medium">{points} PTS</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/15 pt-4">
                  <div className={`p-3.5 border ${tier === "CHROME" ? "bg-white/15 border-white" : "bg-white/5 border-white/10"}`}>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">TIER 1: CHROME</p>
                    <p className="text-[9px] text-white/60 mb-2">0 – 499 Points</p>
                    <ul className="text-[10px] text-white/80 space-y-1">
                      <li>✦ Early Drop Access</li>
                      <li>✦ Free Standard Shipping (₹2000+)</li>
                    </ul>
                  </div>

                  <div className={`p-3.5 border ${tier === "STEEL" ? "bg-white/15 border-white" : "bg-white/5 border-white/10"}`}>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">TIER 2: STEEL</p>
                    <p className="text-[9px] text-white/60 mb-2">500 – 1999 Points</p>
                    <ul className="text-[10px] text-white/80 space-y-1">
                      <li>✦ Free Express Shipping</li>
                      <li>✦ 1.5x Points Multiplier</li>
                      <li>✦ Secret Drop Presales</li>
                    </ul>
                  </div>

                  <div className={`p-3.5 border ${tier === "GOLD" ? "bg-white/15 border-white" : "bg-white/5 border-white/10"}`}>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">TIER 3: PLATINUM</p>
                    <p className="text-[9px] text-white/60 mb-2">2000+ Points</p>
                    <ul className="text-[10px] text-white/80 space-y-1">
                      <li>✦ 2x Points Multiplier</li>
                      <li>✦ Custom Archive Sourcing</li>
                      <li>✦ Free Priority Fulfillment</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Point History */}
              <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs">
                <h4 className="font-display font-medium text-base uppercase tracking-tight mb-3 text-y2k-gunmetal">
                  Reward History
                </h4>
                {loyaltyData?.history && loyaltyData.history.length > 0 ? (
                  <div className="divide-y divide-y2k-gunmetal/10">
                    {loyaltyData.history.map((h: any) => (
                      <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-y2k-gunmetal">{h.reason}</p>
                          <p className="text-[9px] text-y2k-gunmetal/50">
                            {new Date(h.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-y2k-gunmetal">+{h.points} PTS</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-y2k-gunmetal/60 py-2">
                    Earn 10 points for every ₹100 spent on drop orders.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Account Details */}
                <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-medium text-base uppercase tracking-tight mb-3 text-y2k-gunmetal">
                      Account Details
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                          Display Name
                        </label>
                        <div className="p-2.5 bg-y2k-ice/50 border border-y2k-gunmetal/15 font-medium text-y2k-gunmetal">
                          {user?.name || "Not Set"}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                          Email Address
                        </label>
                        <div className="p-2.5 bg-y2k-ice/50 border border-y2k-gunmetal/15 font-medium text-y2k-gunmetal truncate">
                          {user?.email}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                          Authentication Method
                        </label>
                        <div className="p-2.5 bg-y2k-ice/50 border border-y2k-gunmetal/15 font-medium flex items-center justify-between text-y2k-gunmetal">
                          <span>{user?.googleId ? "Google OAuth 2.0" : "Email & Password"}</span>
                          <span className="bg-y2k-gunmetal text-white font-bold uppercase text-[8px] px-2 py-0.5">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-y2k-gunmetal/50 mt-5 pt-3 border-t border-y2k-gunmetal/10">
                    To modify your registered email address, contact support@bagifyyyy.com.
                  </p>
                </div>

                {/* Security */}
                <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-medium text-base uppercase tracking-tight mb-3 text-y2k-gunmetal">
                      Security &amp; Sessions
                    </h4>
                    <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-4">
                      Encrypted authentication session with industry-standard TLS 1.3 protocol.
                    </p>

                    <div className="space-y-3">
                      <div className="p-3 bg-y2k-ice/60 border border-y2k-gunmetal/15">
                        <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal mb-0.5">
                          Password Protection
                        </p>
                        <p className="text-[10px] text-y2k-gunmetal/70 mb-2.5">
                          Reset your password anytime using our secure single-use token system.
                        </p>
                        <Link
                          href="/login"
                          className="btn-bagify text-[9px] font-bold uppercase tracking-widest px-3.5 py-2 inline-block"
                        >
                          Request Password Reset →
                        </Link>
                      </div>

                      <div className="p-3 bg-y2k-ice/60 border border-y2k-gunmetal/15 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
                            Active Session
                          </p>
                          <p className="text-[10px] text-y2k-gunmetal/70">Sign out of this browser</p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-y2k-gunmetal/50 mt-5 pt-3 border-t border-y2k-gunmetal/10 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-y2k-gunmetal" /> End-to-end encrypted account token
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* 6. STUDIO ADMIN TAB */}
          {activeTab === "admin" && isAdmin && (
            <div className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-y2k-gunmetal/10 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-y2k-gunmetal text-white text-[8px] font-black uppercase px-2 py-0.5 tracking-wider">
                      SUPERUSER PORTAL
                    </span>
                    <span className="text-[9px] text-y2k-gunmetal font-bold uppercase">
                      ✓ AUTHENTICATED
                    </span>
                  </div>
                  <h3 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                    BAGIFYYYY STUDIO ADMIN
                  </h3>
                  <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
                    Fulfill orders, print shipping labels, manage inventory &amp; launch drops.
                  </p>
                </div>

                <Link
                  href="/studio"
                  className="btn-bagify text-[9px] font-black uppercase tracking-widest px-4 py-2.5 shadow-xs self-start sm:self-auto"
                >
                  Open Studio Dashboard →
                </Link>
              </div>

              {/* Admin Portal Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-y2k-gunmetal text-white flex items-center justify-center mb-2.5">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <h4 className="font-display font-medium text-sm uppercase tracking-tight mb-1 text-y2k-gunmetal">
                      Order Management
                    </h4>
                    <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed mb-3">
                      Review customer orders, update tracking IDs, and generate thermal packaging labels.
                    </p>
                  </div>
                  <Link
                    href="/studio/orders"
                    className="btn-bagify text-[8px] font-bold uppercase tracking-widest py-2 text-center"
                  >
                    Orders &amp; Labels →
                  </Link>
                </div>

                <div className="p-4 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-y2k-gunmetal text-white flex items-center justify-center mb-2.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <h4 className="font-display font-medium text-sm uppercase tracking-tight mb-1 text-y2k-gunmetal">
                      Catalog &amp; Stock
                    </h4>
                    <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed mb-3">
                      Add new drops, upload product photos, edit descriptions, and adjust prices.
                    </p>
                  </div>
                  <Link
                    href="/studio"
                    className="btn-bagify text-[8px] font-bold uppercase tracking-widest py-2 text-center"
                  >
                    Manage Catalog →
                  </Link>
                </div>

                <div className="p-4 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-y2k-gunmetal text-white flex items-center justify-center mb-2.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h4 className="font-display font-medium text-sm uppercase tracking-tight mb-1 text-y2k-gunmetal">
                      Bundle Combos
                    </h4>
                    <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed mb-3">
                      Curate multi-piece lookbook outfits with special combo discounts.
                    </p>
                  </div>
                  <Link
                    href="/studio/bundles"
                    className="btn-bagify text-[8px] font-bold uppercase tracking-widest py-2 text-center"
                  >
                    Manage Bundles →
                  </Link>
                </div>

                <div className="p-4 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-y2k-gunmetal text-white flex items-center justify-center mb-2.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="font-display font-medium text-sm uppercase tracking-tight mb-1 text-y2k-gunmetal">
                      Marketing
                    </h4>
                    <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed mb-3">
                      Broadcast drop announcements, promo codes, and subscriber lists.
                    </p>
                  </div>
                  <Link
                    href="/studio/marketing"
                    className="btn-bagify text-[8px] font-bold uppercase tracking-widest py-2 text-center"
                  >
                    Marketing Studio →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
