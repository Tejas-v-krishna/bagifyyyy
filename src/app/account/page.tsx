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
  CheckCircle2,
  Package,
  Truck,
  Clock,
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
  AlertCircle
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

  const [activeTab, setActiveTab] = useState<"orders" | "loyalty" | "addresses" | "wishlist" | "profile" | "admin">("orders");
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

  // ── Load User Data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load Loyalty
    if (user?.email) {
      fetch(`/api/loyalty?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => setLoyaltyData(data))
        .catch(console.error);
    }

    // Load Orders
    setLoadingOrders(true);
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(console.error)
      .finally(() => setLoadingOrders(false));

    // Load Addresses
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
      <div className="bg-y2k-ice min-h-[75vh] flex items-center justify-center px-4 py-20 text-y2k-gunmetal">
        <div className="w-full max-w-md bg-white border border-y2k-gunmetal/15 shadow-xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-y2k-ice border border-y2k-gunmetal/20 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <User className="w-7 h-7 text-y2k-gunmetal/70" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            ARCHIVE PASSPORT
          </span>
          <h1 className="font-display text-3xl uppercase tracking-tight mb-3">
            AUTHENTICATION REQUIRED
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-7">
            Sign in to view your orders, track deliveries, manage saved addresses, and access exclusive Chrome Club benefits.
          </p>
          <Link
            href="/login"
            className="btn-bagify text-white w-full py-4 text-xs font-bold uppercase tracking-widest hover:opacity-90 inline-block shadow-md"
          >
            SIGN IN / REGISTER →
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
    <div className="bg-y2k-ice min-h-screen text-y2k-gunmetal py-8 sm:py-12">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── Breadcrumb & Top Bar ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-y2k-gunmetal/10 text-[11px] font-bold uppercase tracking-widest text-y2k-gunmetal/60">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-black">HOME</Link>
            <span>/</span>
            <span className="text-y2k-gunmetal">MEMBER PASSPORT</span>
          </div>
          <span className="font-mono text-[10px] text-y2k-gunmetal/40">ID: {memberId}</span>
        </div>

        {/* ── Top Dashboard Zone: Member ID + VIP Chrome Pass ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
          
          {/* Member Profile Identity Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-y2k-gunmetal/3 -mr-10 -mt-10 rounded-full pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-slate flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-y2k-gunmetal" />
                  AUTHENTICATED ARCHIVE MEMBER
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Member Avatar"}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-y2k-gunmetal/20 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-y2k-gunmetal truncate">
                    {user?.name || "BAGIFYYYY MEMBER"}
                  </h1>
                  <p className="text-xs text-y2k-gunmetal/70 font-medium truncate mt-0.5">
                    {user?.email}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-y2k-ice border border-y2k-gunmetal/15 px-2.5 py-1 text-y2k-gunmetal">
                      {memberId}
                    </span>
                    {isAdmin && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-black text-white px-2.5 py-1 flex items-center gap-1 border border-black shadow-xs">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Store Admin
                      </span>
                    )}
                    {user?.googleId ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Google Linked
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Member
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Management Quick Bar */}
            {isAdmin && (
              <div className="mt-5 p-3.5 bg-black text-white border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-white">
                      Bagify Studio Administration
                    </p>
                    <p className="text-[9px] text-gray-400 font-normal">
                      Authorized to manage orders, product inventory &amp; print shipping labels
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/studio/orders"
                    className="bg-white/10 hover:bg-white text-white hover:text-black px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors border border-white/20 text-center"
                  >
                    Orders &amp; Labels →
                  </Link>
                  <Link
                    href="/studio"
                    className="bg-white text-black hover:bg-gray-200 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors text-center"
                  >
                    Open Studio →
                  </Link>
                </div>
              </div>
            )}

            {/* Quick action bar */}
            <div className="mt-6 pt-5 border-t border-y2k-gunmetal/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-y2k-gunmetal/60 text-[11px]">
                Active Session: <b>{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</b>
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/products"
                  className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-black"
                >
                  Explore Drops →
                </Link>
              </div>
            </div>
          </div>

          {/* VIP Chrome Pass Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#1B232E] text-[#F8F5E9] p-6 sm:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/10">
            {/* Metallic Watermark Pattern */}
            <div className="absolute -right-8 -bottom-8 opacity-5 text-white pointer-events-none select-none">
              <Award className="w-48 h-48" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    CHROME CLUB VIP PASS
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 border border-white/20 px-2 py-0.5 text-amber-300">
                  TIER: {tier}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Chrome Balance</p>
                  <p className="font-display text-4xl sm:text-5xl text-white tracking-tight">{points} <span className="text-lg font-sans text-white/60 font-normal">PTS</span></p>
                </div>
                <button
                  onClick={() => setActiveTab("loyalty")}
                  className="text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:text-white underline underline-offset-2"
                >
                  View Perks →
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 h-1.5 mb-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-200 to-amber-400 transition-all duration-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>

              <p className="text-[10px] font-medium text-white/60">
                {pointsToNextTier > 0
                  ? `Earn ${pointsToNextTier} more points to reach STEEL VIP status`
                  : "Maximum VIP tier unlocked"}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/70">
              <span className="flex items-center gap-1.5"><Truck className="w-3 h-3 text-amber-300" /> Free Shipping on ₹2000+</span>
              <span className="flex items-center gap-1.5"><Tag className="w-3 h-3 text-amber-300" /> Drop Presales</span>
            </div>
          </div>

        </div>

        {/* ── Interactive Metric Chips Row ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <button
            onClick={() => setActiveTab("orders")}
            className={`p-4 text-left border transition-all ${
              activeTab === "orders"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-2px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Package className="w-4 h-4 text-y2k-gunmetal/60" />
              <span className="text-[10px] font-bold text-y2k-gunmetal/40 uppercase">ORDERS</span>
            </div>
            <p className="font-display text-2xl font-bold text-y2k-gunmetal">{orders.length}</p>
            <p className="text-[10px] font-medium text-y2k-gunmetal/60 mt-0.5">Total drop purchases</p>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`p-4 text-left border transition-all ${
              activeTab === "addresses"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-2px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-4 h-4 text-y2k-gunmetal/60" />
              <span className="text-[10px] font-bold text-y2k-gunmetal/40 uppercase">ADDRESSES</span>
            </div>
            <p className="font-display text-2xl font-bold text-y2k-gunmetal">{addresses.length}</p>
            <p className="text-[10px] font-medium text-y2k-gunmetal/60 mt-0.5">Saved destinations</p>
          </button>

          <button
            onClick={() => setActiveTab("wishlist")}
            className={`p-4 text-left border transition-all ${
              activeTab === "wishlist"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-2px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-4 h-4 text-y2k-gunmetal/60" />
              <span className="text-[10px] font-bold text-y2k-gunmetal/40 uppercase">SAVED</span>
            </div>
            <p className="font-display text-2xl font-bold text-y2k-gunmetal">{wishlistIds.length}</p>
            <p className="text-[10px] font-medium text-y2k-gunmetal/60 mt-0.5">Wishlist archive</p>
          </button>

          <button
            onClick={() => setActiveTab("loyalty")}
            className={`p-4 text-left border transition-all ${
              activeTab === "loyalty"
                ? "bg-white border-y2k-gunmetal shadow-sm translate-y-[-2px]"
                : "bg-white/60 border-y2k-gunmetal/15 hover:bg-white hover:border-y2k-gunmetal/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Award className="w-4 h-4 text-y2k-gunmetal/60" />
              <span className="text-[10px] font-bold text-y2k-gunmetal/40 uppercase">POINTS</span>
            </div>
            <p className="font-display text-2xl font-bold text-y2k-gunmetal">{points}</p>
            <p className="text-[10px] font-medium text-y2k-gunmetal/60 mt-0.5">Chrome reward credits</p>
          </button>
        </div>

        {/* ── Segmented Navigation Tabs Bar ───────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 border-b border-y2k-gunmetal/15 pb-0 overflow-x-auto select-none">
          {[
            { id: "orders", label: "Orders", count: orders.length, icon: Package },
            { id: "addresses", label: "Addresses", count: addresses.length, icon: MapPin },
            { id: "wishlist", label: "Saved Pieces", count: wishlistIds.length, icon: Heart },
            { id: "loyalty", label: "Chrome Club", count: points, icon: Award },
            { id: "profile", label: "Security & Info", icon: ShieldCheck },
            ...(isAdmin ? [{ id: "admin", label: "Studio Admin", count: undefined, icon: ShieldCheck }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-y2k-gunmetal text-y2k-gunmetal bg-white/70"
                    : "border-transparent text-y2k-gunmetal/50 hover:text-y2k-gunmetal hover:bg-white/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 font-mono ${
                    isActive ? "bg-y2k-gunmetal text-white" : "bg-y2k-gunmetal/10 text-y2k-gunmetal/70"
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
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-12 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/60">
                  Loading your drop orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-10 sm:p-14 text-center">
                  <ShoppingBag className="w-12 h-12 text-y2k-gunmetal/30 mx-auto mb-4" />
                  <h3 className="font-display text-2xl uppercase tracking-tight mb-2">
                    NO ORDERS IN YOUR ARCHIVE YET
                  </h3>
                  <p className="text-xs text-y2k-gunmetal/70 max-w-md mx-auto mb-6">
                    Every piece is crafted in limited batches. Explore our active drops to start your collection.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-90"
                  >
                    EXPLORE ACTIVE DROPS <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 shadow-xs hover:border-y2k-gunmetal/30 transition-colors"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-y2k-gunmetal/10 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-y2k-ice border border-y2k-gunmetal/15 flex items-center justify-center">
                            <Package className="w-4 h-4 text-y2k-gunmetal" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-display text-base font-bold tracking-tight">#{ord.orderNumber}</p>
                              <span className="text-[10px] text-y2k-gunmetal/50">·</span>
                              <span className="text-xs text-y2k-gunmetal/70 font-medium">
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-[10px] text-y2k-gunmetal/60 uppercase tracking-wider">
                              Payment: <b>{ord.paymentMethod}</b> ({ord.paymentStatus})
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase px-2.5 py-1 border ${
                              ord.orderStatus === "DELIVERED"
                                ? "bg-green-50 border-green-300 text-green-700"
                                : ord.orderStatus === "SHIPPED"
                                ? "bg-blue-50 border-blue-300 text-blue-700"
                                : "bg-amber-50 border-amber-300 text-amber-700"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>

                          {ord.trackingId && (
                            <button
                              onClick={() => handleCopyTracking(ord.trackingId)}
                              className="text-[9px] font-bold uppercase tracking-wider bg-y2k-ice border border-y2k-gunmetal/20 px-2.5 py-1 text-y2k-gunmetal flex items-center gap-1 hover:bg-white"
                              title="Click to copy tracking ID"
                            >
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>{copiedTrackingId === ord.trackingId ? "Copied!" : ord.trackingId}</span>
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {ord.items?.map((it: any) => (
                          <div
                            key={it.id}
                            className="flex items-center gap-3 bg-y2k-ice/40 border border-y2k-gunmetal/10 p-2.5"
                          >
                            <div className="relative w-12 h-14 bg-gray-100 shrink-0 overflow-hidden">
                              <Image
                                src={it.image || "/placeholder.jpg"}
                                alt={it.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold uppercase truncate text-y2k-gunmetal">{it.name}</h4>
                              <p className="text-[10px] text-y2k-gunmetal/60 uppercase tracking-widest mt-0.5">
                                Qty: {it.quantity} | {it.size} | {it.color}
                              </p>
                              <p className="text-xs font-bold text-y2k-gunmetal mt-1">
                                ₹{(it.price * it.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer Breakdown */}
                      <div className="pt-3 border-t border-y2k-gunmetal/10 flex flex-wrap items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2 text-y2k-gunmetal/70 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-y2k-gunmetal/50 shrink-0" />
                          <span>
                            Ship to: <b>{ord.shippingAddress?.fullName}</b> — {ord.shippingAddress?.city},{" "}
                            {ord.shippingAddress?.state} ({ord.shippingAddress?.pincode})
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {ord.discountAmount > 0 && (
                            <span className="text-[11px] text-green-600 font-bold uppercase">
                              Saved ₹{ord.discountAmount.toFixed(2)}
                            </span>
                          )}
                          <p className="font-display text-base font-bold text-y2k-gunmetal">
                            Total: ₹{ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SAVED ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl uppercase tracking-tight">Delivery Addresses</h3>
                  <p className="text-xs text-y2k-gunmetal/60">Saved addresses for one-click checkout fulfillment.</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddressForm(!showAddressForm);
                    setAddressError("");
                  }}
                  className="btn-bagify text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddressForm ? "Cancel" : "Add Address"}
                </button>
              </div>

              {/* Add Address Form Card */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddAddress}
                    className="bg-white border-2 border-y2k-gunmetal p-6 sm:p-8 flex flex-col gap-4 shadow-md overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-y2k-gunmetal/10 pb-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-y2k-gunmetal">
                        Add New Delivery Destination
                      </p>
                      <span className="text-[10px] text-y2k-gunmetal/50 uppercase">* All fields mandatory</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-y2k-gunmetal/70">
                          Recipient Full Name *
                        </label>
                        <input
                          required
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal"
                          placeholder="e.g. Alex Vance"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-y2k-gunmetal/70">
                          Contact Phone Number (+91) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-y2k-gunmetal/70">
                        Street Address & Building / Landmark *
                      </label>
                      <input
                        required
                        value={addressForm.street}
                        onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                        className="w-full border border-y2k-gunmetal/20 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal"
                        placeholder="Flat 402, Lotus Heights, MG Road"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-y2k-gunmetal/70">
                          Pincode *
                        </label>
                        <input
                          required
                          maxLength={6}
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal font-mono"
                          placeholder="400001"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-y2k-gunmetal/70">
                          City / District *
                        </label>
                        <input
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-y2k-gunmetal/70">
                          State / Union Territory *
                        </label>
                        <input
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3.5 py-2.5 text-xs outline-none focus:border-y2k-gunmetal"
                          placeholder="Maharashtra"
                        />
                      </div>
                    </div>

                    {addressError && (
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 p-2.5 border border-red-200">
                        {addressError}
                      </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-5 py-2.5 border border-y2k-gunmetal/30 text-xs font-bold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-bagify text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        {savingAddress ? "Saving Address…" : "Save Destination →"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Saved Addresses Grid */}
              {loadingAddresses ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-12 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/60">
                  Loading addresses…
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-10 text-center">
                  <MapPin className="w-10 h-10 text-y2k-gunmetal/30 mx-auto mb-3" />
                  <p className="font-bold text-sm text-y2k-gunmetal uppercase tracking-wider mb-2">
                    No Saved Addresses Found
                  </p>
                  <p className="text-xs text-y2k-gunmetal/70 max-w-sm mx-auto mb-5">
                    Save your primary delivery location to streamline checkout on high-demand drop launches.
                  </p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="btn-bagify text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-block"
                  >
                    + Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-y2k-gunmetal/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-y2k-ice border border-y2k-gunmetal/15 px-2 py-0.5 text-y2k-gunmetal">
                            {idx === 0 ? "PRIMARY DESTINATION" : `SAVED LOCATION #${idx + 1}`}
                          </span>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>

                        <p className="font-bold text-sm text-y2k-gunmetal">{addr.fullName}</p>
                        <p className="text-xs text-y2k-gunmetal/70 font-mono mt-0.5">{addr.phone}</p>
                        <p className="text-xs text-y2k-gunmetal/80 mt-2 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.state} — <b className="font-mono">{addr.pincode}</b>
                        </p>
                        <p className="text-[10px] text-y2k-gunmetal/50 uppercase tracking-widest mt-1">
                          Country: {addr.country || "India"}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-y2k-gunmetal/10 flex items-center justify-between text-[10px] font-bold text-y2k-gunmetal/60 uppercase">
                        <span>Standard & Express Eligible</span>
                        <span className="text-green-700">✦ Verified Pincode</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SAVED PIECES (WISHLIST) TAB */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl uppercase tracking-tight">Saved Archive Pieces</h3>
                  <p className="text-xs text-y2k-gunmetal/60">Pieces you have bookmarked from our collections.</p>
                </div>
                <Link
                  href="/wishlist"
                  className="text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-black"
                >
                  Full Wishlist Page →
                </Link>
              </div>

              {loadingWishlist ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-12 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/60">
                  Loading saved pieces…
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-10 text-center">
                  <Heart className="w-10 h-10 text-y2k-gunmetal/30 mx-auto mb-3" />
                  <p className="font-bold text-sm text-y2k-gunmetal uppercase tracking-wider mb-2">
                    Your Wishlist Is Empty
                  </p>
                  <p className="text-xs text-y2k-gunmetal/70 max-w-sm mx-auto mb-5">
                    Click the heart icon on any drop piece to save it here for later.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-block"
                  >
                    Browse Collections →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        <p className="text-[10px] font-bold uppercase text-y2k-gunmetal/50 truncate">
                          {p.brand || "BAGIFYYYY"}
                        </p>
                        <h4 className="font-bold text-xs uppercase truncate text-y2k-gunmetal mt-0.5">{p.name}</h4>
                        <p className="font-bold text-xs text-y2k-gunmetal mt-1">₹{p.price.toLocaleString("en-IN")}</p>
                      </Link>

                      <div className="mt-3 pt-2 border-t border-y2k-gunmetal/10 flex items-center gap-2">
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
                          className="flex-1 bg-y2k-gunmetal text-white text-[9px] font-bold uppercase tracking-wider py-2 hover:opacity-90 transition-opacity"
                        >
                          Add to Bag
                        </button>
                        <button
                          onClick={() => toggleItem(p.id)}
                          className="p-2 border border-y2k-gunmetal/20 hover:border-red-500 hover:text-red-500 transition-colors"
                          title="Remove from wishlist"
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

          {/* 4. CHROME CLUB VIP TAB */}
          {activeTab === "loyalty" && (
            <div className="space-y-6">
              {/* VIP Tier Ladder Card */}
              <div className="bg-[#1B232E] text-[#F8F5E9] p-6 sm:p-8 border border-white/10 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      LOYALTY TIERS & PROGRESSION
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight">
                      YOUR VIP STATUS: {tier}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Points</p>
                    <p className="font-display text-4xl text-amber-300">{points} PTS</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-6">
                  <div className={`p-4 border ${tier === "CHROME" ? "bg-white/10 border-amber-300" : "bg-white/5 border-white/10"}`}>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-300">TIER 1: CHROME</p>
                    <p className="text-[10px] text-white/60 mb-2">0 – 499 Points</p>
                    <ul className="text-[11px] text-white/80 space-y-1">
                      <li>✦ Early Drop Access</li>
                      <li>✦ Complimentary Standard Shipping</li>
                    </ul>
                  </div>

                  <div className={`p-4 border ${tier === "STEEL" ? "bg-white/10 border-amber-300" : "bg-white/5 border-white/10"}`}>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-300">TIER 2: STEEL</p>
                    <p className="text-[10px] text-white/60 mb-2">500 – 1999 Points</p>
                    <ul className="text-[11px] text-white/80 space-y-1">
                      <li>✦ Free Express Shipping</li>
                      <li>✦ 1.5x Points Multiplier</li>
                      <li>✦ Secret Drop Presales</li>
                    </ul>
                  </div>

                  <div className={`p-4 border ${tier === "GOLD" ? "bg-white/10 border-amber-300" : "bg-white/5 border-white/10"}`}>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-300">TIER 3: GOLD VIP</p>
                    <p className="text-[10px] text-white/60 mb-2">2000+ Points</p>
                    <ul className="text-[11px] text-white/80 space-y-1">
                      <li>✦ 2x Points Multiplier</li>
                      <li>✦ Custom Archive Access</li>
                      <li>✦ Free Worldwide Priority</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Points History Card */}
              <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs">
                <h4 className="font-display text-lg uppercase tracking-tight mb-4">Recent Point Activity</h4>
                {loyaltyData?.history && loyaltyData.history.length > 0 ? (
                  <div className="divide-y divide-y2k-gunmetal/10">
                    {loyaltyData.history.map((h: any) => (
                      <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-y2k-gunmetal">{h.reason}</p>
                          <p className="text-[10px] text-y2k-gunmetal/50">
                            {new Date(h.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="font-display text-sm font-bold text-green-700">+{h.points} PTS</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-y2k-gunmetal/60 py-4">
                    Earn points by completing orders (+10 pts per ₹100), leaving product reviews, or during promotional drop events.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. PROFILE & SECURITY TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Account Details */}
                <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-display text-lg uppercase tracking-tight mb-4">Account Information</h4>
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                          Display Name
                        </label>
                        <div className="p-3 bg-y2k-ice/50 border border-y2k-gunmetal/15 font-medium">
                          {user?.name || "Not Set"}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                          Email Address
                        </label>
                        <div className="p-3 bg-y2k-ice/50 border border-y2k-gunmetal/15 font-medium">
                          {user?.email}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                          Authentication Method
                        </label>
                        <div className="p-3 bg-y2k-ice/50 border border-y2k-gunmetal/15 font-medium flex items-center justify-between">
                          <span>{user?.googleId ? "Google OAuth 2.0 Linked" : "Email & Password Account"}</span>
                          <span className="text-green-700 font-bold uppercase text-[10px]">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-y2k-gunmetal/50 mt-6 pt-4 border-t border-y2k-gunmetal/10">
                    To modify your registered email address, please contact support at support@bagifyyyy.com.
                  </p>
                </div>

                {/* Security & Password */}
                <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-display text-lg uppercase tracking-tight mb-4">Security & Password</h4>
                    <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-6">
                      Your account credentials and payment sessions are encrypted with industry-standard TLS 1.3 protocol.
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 bg-y2k-ice/60 border border-y2k-gunmetal/15">
                        <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal mb-1">
                          Password Protection
                        </p>
                        <p className="text-[11px] text-y2k-gunmetal/70 mb-3">
                          Reset your password anytime using our secure one-hour single-use token system.
                        </p>
                        <Link
                          href="/login"
                          className="btn-bagify text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 inline-block"
                        >
                          Request Password Reset →
                        </Link>
                      </div>

                      <div className="p-4 bg-y2k-ice/60 border border-y2k-gunmetal/15">
                        <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal mb-1">
                          Session Control
                        </p>
                        <p className="text-[11px] text-y2k-gunmetal/70 mb-3">
                          Sign out of this browser session to protect your saved cart and addresses.
                        </p>
                        <button
                          onClick={handleSignOut}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 underline underline-offset-4"
                        >
                          Sign Out of All Sessions
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-y2k-gunmetal/50 mt-6 pt-4 border-t border-y2k-gunmetal/10 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-700" /> End-to-end encrypted account token
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* 6. STUDIO ADMIN TAB */}
          {activeTab === "admin" && isAdmin && (
            <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-y2k-gunmetal/10 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
                      SUPERUSER PORTAL
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">
                      ✓ AUTHENTICATED
                    </span>
                  </div>
                  <h3 className="font-display text-2xl uppercase tracking-tight">
                    BAGIFYYYY STUDIO ADMIN
                  </h3>
                  <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
                    Full access to fulfill orders, print shipping labels, manage inventory &amp; launch drops.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/studio"
                    className="bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest px-5 py-3 transition-colors shadow-xs"
                  >
                    Open Studio Dashboard →
                  </Link>
                </div>
              </div>

              {/* Admin Portal Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Orders & Logistics */}
                <div className="p-5 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-3">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-base uppercase tracking-tight mb-1">
                      Order Management
                    </h4>
                    <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-4">
                      Review customer orders, update tracking IDs, and generate thermal 4x6 / A6 packaging labels for parcel shipping bags.
                    </p>
                  </div>
                  <Link
                    href="/studio/orders"
                    className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 text-center hover:bg-gray-800 transition-colors"
                  >
                    Orders &amp; Labels →
                  </Link>
                </div>

                {/* 2. Product Catalog */}
                <div className="p-5 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-3">
                      <Package className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-base uppercase tracking-tight mb-1">
                      Product Catalog &amp; Stock
                    </h4>
                    <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-4">
                      Add new apparel drops, upload product photos, edit descriptions, adjust prices, and toggle sold-out statuses.
                    </p>
                  </div>
                  <Link
                    href="/studio"
                    className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 text-center hover:bg-gray-800 transition-colors"
                  >
                    Manage Catalog →
                  </Link>
                </div>

                {/* 3. Bundle Combos */}
                <div className="p-5 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-3">
                      <Tag className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-base uppercase tracking-tight mb-1">
                      Bundle Outfits &amp; Sets
                    </h4>
                    <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-4">
                      Curate multi-piece lookbook outfits with special combo discounts displayed on the store landing page and bundles section.
                    </p>
                  </div>
                  <Link
                    href="/studio/bundles"
                    className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 text-center hover:bg-gray-800 transition-colors"
                  >
                    Manage Bundles →
                  </Link>
                </div>

                {/* 4. Marketing & Broadcasts */}
                <div className="p-5 bg-y2k-ice/50 border border-y2k-gunmetal/15 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-base uppercase tracking-tight mb-1">
                      Marketing &amp; Campaigns
                    </h4>
                    <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-4">
                      Broadcast drop announcements, send promo codes, and review newsletter subscriber engagement.
                    </p>
                  </div>
                  <Link
                    href="/studio/marketing"
                    className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 text-center hover:bg-gray-800 transition-colors"
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
