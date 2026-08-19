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
  ShoppingBag,
  Tag,
  ExternalLink,
  Check
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
      <div className="bg-y2k-ice min-h-[70vh] flex items-center justify-center px-4 py-16 text-y2k-gunmetal font-sans">
        <div className="w-full max-w-sm bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-y2k-ice border border-y2k-gunmetal/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-5 h-5 text-y2k-gunmetal" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            ARCHIVE PASSPORT
          </span>
          <h1 className="font-display font-medium text-xl uppercase tracking-tight mb-2 text-y2k-gunmetal">
            ACCOUNT ACCESS
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-6">
            Sign in to access your saved pieces, track orders, and view member benefits.
          </p>
          <Link
            href="/login"
            className="btn-bagify w-full py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>SIGN IN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const memberId = user?.id ? `BGF-${user.id.slice(0, 8).toUpperCase()}` : "BGF-MEMBER";
  const points = loyaltyData?.points || 0;
  const tier = loyaltyData?.tier || "CHROME";

  return (
    <div className="bg-y2k-ice min-h-screen text-y2k-gunmetal py-6 sm:py-10 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── Compact Profile Header ────────────────────────────────────── */}
        <div className="bg-white border border-y2k-gunmetal/15 p-4 sm:p-6 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Member Avatar"}
                className="w-12 h-12 rounded-full object-cover border border-y2k-gunmetal/20 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-base font-bold shrink-0">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-medium text-lg sm:text-xl uppercase tracking-tight text-y2k-gunmetal truncate">
                  {user?.name || "MEMBER"}
                </h1>
                <span className="text-[9px] font-mono font-bold bg-y2k-ice border border-y2k-gunmetal/15 px-2 py-0.5 text-y2k-gunmetal">
                  {memberId}
                </span>
                {isAdmin && (
                  <span className="text-[8px] font-black uppercase tracking-wider bg-y2k-gunmetal text-white px-1.5 py-0.5">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-y2k-gunmetal/70 truncate mt-0.5">
                {user?.email} · <span className="font-bold text-y2k-gunmetal">{tier} VIP ({points} PTS)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {isAdmin && (
              <Link
                href="/studio"
                className="bg-y2k-gunmetal text-white hover:bg-black text-[10px] font-bold uppercase tracking-wider px-3 py-2 transition-colors flex items-center gap-1"
              >
                <span>Studio</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-black bg-y2k-ice border border-y2k-gunmetal/15 px-3 py-2 transition-colors cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Compact Navigation Tabs Bar ───────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 border-b border-y2k-gunmetal/15 pb-0 overflow-x-auto select-none no-scrollbar">
          {[
            { id: "orders", label: "Orders", count: orders.length },
            { id: "wishlist", label: "Saved", count: wishlistIds.length },
            { id: "addresses", label: "Addresses", count: addresses.length },
            { id: "loyalty", label: "VIP Club", count: points > 0 ? `${points}p` : undefined },
            { id: "settings", label: "Settings" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-y2k-gunmetal text-y2k-gunmetal bg-white"
                    : "border-transparent text-y2k-gunmetal/50 hover:text-y2k-gunmetal hover:bg-white/40"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[9px] px-1 py-0.2 font-mono ${
                    isActive ? "bg-y2k-gunmetal text-white" : "bg-y2k-gunmetal/10 text-y2k-gunmetal/70"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content Zone ──────────────────────────────────────────── */}
        <div>
          {/* 1. ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {loadingOrders ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/50">
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center">
                  <Package className="w-8 h-8 text-y2k-gunmetal/30 mx-auto mb-2.5" />
                  <p className="font-display font-medium text-sm uppercase tracking-tight mb-1 text-y2k-gunmetal">
                    NO ORDERS YET
                  </p>
                  <p className="text-xs text-y2k-gunmetal/70 mb-4 max-w-xs mx-auto">
                    Limited drop releases sell out fast. Browse the collection to place your first order.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                  >
                    <span>BROWSE DROPS</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-y2k-gunmetal/15 p-4 sm:p-5 shadow-xs"
                    >
                      {/* Order Title & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-y2k-gunmetal/10 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold tracking-tight">#{ord.orderNumber}</span>
                          <span className="text-[10px] text-y2k-gunmetal/40">·</span>
                          <span className="text-[11px] text-y2k-gunmetal/70 font-medium">
                            {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 border ${
                            ord.orderStatus === "DELIVERED"
                              ? "bg-y2k-gunmetal text-white border-y2k-gunmetal"
                              : "bg-y2k-ice text-y2k-gunmetal border-y2k-gunmetal/25"
                          }`}>
                            {ord.orderStatus}
                          </span>

                          {ord.trackingId && (
                            <button
                              onClick={() => handleCopyTracking(ord.trackingId)}
                              className="text-[8px] font-bold uppercase tracking-wider bg-y2k-ice border border-y2k-gunmetal/20 px-2 py-0.5 text-y2k-gunmetal flex items-center gap-1 hover:bg-white cursor-pointer"
                              title="Copy tracking number"
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
                          <div key={it.id} className="py-2 flex items-center justify-between gap-3 text-xs">
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
                                <p className="text-[11px] font-bold uppercase truncate text-y2k-gunmetal">{it.name}</p>
                                <p className="text-[9px] text-y2k-gunmetal/60 uppercase tracking-wider mt-0.5">
                                  Qty: {it.quantity} · {it.size} · {it.color}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-y2k-gunmetal shrink-0">
                              ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total Bar */}
                      <div className="pt-2.5 border-t border-y2k-gunmetal/10 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-y2k-gunmetal/60 truncate">
                          Ship to: {ord.shippingAddress?.fullName} ({ord.shippingAddress?.city})
                        </span>
                        <span className="font-display text-sm font-bold text-y2k-gunmetal">
                          Total: ₹{ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SAVED WISHLIST TAB */}
          {activeTab === "wishlist" && (
            <div className="space-y-4">
              {loadingWishlist ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal/50">
                  Loading saved pieces…
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center">
                  <Heart className="w-8 h-8 text-y2k-gunmetal/30 mx-auto mb-2.5" />
                  <p className="font-display font-medium text-sm uppercase tracking-tight mb-1 text-y2k-gunmetal">
                    WISHLIST EMPTY
                  </p>
                  <p className="text-xs text-y2k-gunmetal/70 mb-4 max-w-xs mx-auto">
                    Save pieces while browsing to track availability.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest inline-block"
                  >
                    EXPLORE ARCHIVE
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-y2k-gunmetal/15 p-2.5 flex flex-col justify-between group shadow-xs"
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
                        <h4 className="font-bold text-[11px] uppercase truncate text-y2k-gunmetal">{p.name}</h4>
                        <p className="font-bold text-[11px] text-y2k-gunmetal mt-0.5">₹{p.price.toLocaleString("en-IN")}</p>
                      </Link>

                      <div className="mt-2.5 pt-2 border-t border-y2k-gunmetal/10 flex items-center gap-1.5">
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
                          className="flex-1 btn-bagify text-[8px] font-bold uppercase tracking-wider py-1.5 cursor-pointer text-center"
                        >
                          Add to Bag
                        </button>
                        <button
                          onClick={() => toggleItem(p.id)}
                          className="p-1.5 border border-y2k-gunmetal/20 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer text-y2k-gunmetal"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-slate">
                  SAVED DESTINATIONS ({addresses.length})
                </span>
                <button
                  onClick={() => {
                    setShowAddressForm(!showAddressForm);
                    setAddressError("");
                  }}
                  className="btn-bagify text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddressForm ? "Cancel" : "Add New"}</span>
                </button>
              </div>

              {/* Form Card */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddAddress}
                    className="bg-white border border-y2k-gunmetal p-4 sm:p-5 flex flex-col gap-3 shadow-xs overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          Recipient Name *
                        </label>
                        <input
                          required
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-1.5 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="Alex Vance"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                          Phone (+91) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full border border-y2k-gunmetal/20 px-3 py-1.5 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block text-y2k-gunmetal/70">
                        Street Address *
                      </label>
                      <input
                        required
                        value={addressForm.street}
                        onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                        className="w-full border border-y2k-gunmetal/20 px-3 py-1.5 text-xs outline-none focus:border-y2k-gunmetal bg-white"
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
                          className="w-full border border-y2k-gunmetal/20 px-3 py-1.5 text-xs outline-none focus:border-y2k-gunmetal font-mono bg-white"
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
                          className="w-full border border-y2k-gunmetal/20 px-3 py-1.5 text-xs outline-none focus:border-y2k-gunmetal bg-white"
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
                          className="w-full border border-y2k-gunmetal/20 px-3 py-1.5 text-xs outline-none focus:border-y2k-gunmetal bg-white"
                          placeholder="Maharashtra"
                        />
                      </div>
                    </div>

                    {addressError && (
                      <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 border border-red-200">
                        {addressError}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-1.5 border border-y2k-gunmetal/30 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-bagify px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                      >
                        {savingAddress ? "Saving…" : "Save Address"}
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
                <div className="bg-white border border-y2k-gunmetal/15 p-6 text-center">
                  <MapPin className="w-7 h-7 text-y2k-gunmetal/30 mx-auto mb-2" />
                  <p className="text-xs text-y2k-gunmetal/70 mb-3">No saved addresses found.</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="btn-bagify px-4 py-2 text-[9px] font-bold uppercase tracking-widest inline-block cursor-pointer"
                  >
                    + Add Primary Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-y2k-gunmetal/15 p-4 flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-y2k-ice border border-y2k-gunmetal/15 px-1.5 py-0.5 text-y2k-gunmetal">
                            {idx === 0 ? "PRIMARY" : `SAVED #${idx + 1}`}
                          </span>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Remove
                          </button>
                        </div>
                        <p className="font-bold text-xs text-y2k-gunmetal">{addr.fullName}</p>
                        <p className="text-[10px] text-y2k-gunmetal/70 font-mono">{addr.phone}</p>
                        <p className="text-[11px] text-y2k-gunmetal/80 mt-1 leading-snug">
                          {addr.street}, {addr.city}, {addr.state} — <b className="font-mono">{addr.pincode}</b>
                        </p>
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
              <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-y2k-gunmetal/10">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
                      TIER STATUS
                    </span>
                    <h3 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                      {tier} VIP MEMBER
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block">Balance</span>
                    <span className="font-display text-2xl font-bold text-y2k-gunmetal">{points} PTS</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                  <div className={`p-3 border ${tier === "CHROME" ? "bg-y2k-ice/70 border-y2k-gunmetal" : "bg-y2k-ice/30 border-y2k-gunmetal/15"}`}>
                    <p className="font-bold text-[10px] uppercase text-y2k-gunmetal">CHROME (0-499 PTS)</p>
                    <p className="text-[10px] text-y2k-gunmetal/70 mt-1">Standard drop access &amp; free shipping over ₹2000</p>
                  </div>
                  <div className={`p-3 border ${tier === "STEEL" ? "bg-y2k-ice/70 border-y2k-gunmetal" : "bg-y2k-ice/30 border-y2k-gunmetal/15"}`}>
                    <p className="font-bold text-[10px] uppercase text-y2k-gunmetal">STEEL (500-1999 PTS)</p>
                    <p className="text-[10px] text-y2k-gunmetal/70 mt-1">Free express shipping &amp; 1.5x points multiplier</p>
                  </div>
                  <div className={`p-3 border ${tier === "GOLD" ? "bg-y2k-ice/70 border-y2k-gunmetal" : "bg-y2k-ice/30 border-y2k-gunmetal/15"}`}>
                    <p className="font-bold text-[10px] uppercase text-y2k-gunmetal">PLATINUM (2000+ PTS)</p>
                    <p className="text-[10px] text-y2k-gunmetal/70 mt-1">2x points multiplier &amp; secret drop presales</p>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-2">
                  ACTIVITY HISTORY
                </span>
                {loyaltyData?.history && loyaltyData.history.length > 0 ? (
                  <div className="divide-y divide-y2k-gunmetal/10 text-xs">
                    {loyaltyData.history.map((h: any) => (
                      <div key={h.id} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[11px] text-y2k-gunmetal">{h.reason}</p>
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
                  <p className="text-[11px] text-y2k-gunmetal/60 py-2">
                    Earn 10 points for every ₹100 spent on drop orders.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs space-y-4 text-xs">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block">
                ACCOUNT SETTINGS &amp; SECURITY
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-y2k-ice/40 border border-y2k-gunmetal/10">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                    Display Name
                  </label>
                  <p className="font-bold text-xs text-y2k-gunmetal">{user?.name || "Not Set"}</p>
                </div>

                <div className="p-3 bg-y2k-ice/40 border border-y2k-gunmetal/10">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 block mb-1">
                    Email Address
                  </label>
                  <p className="font-bold text-xs text-y2k-gunmetal truncate">{user?.email}</p>
                </div>
              </div>

              <div className="p-3 bg-y2k-ice/40 border border-y2k-gunmetal/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-y2k-gunmetal">Authentication Mode</p>
                  <p className="text-[10px] text-y2k-gunmetal/70">{user?.googleId ? "Google OAuth 2.0 Linked" : "Email & Password"}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-y2k-gunmetal text-white px-2 py-0.5">
                  VERIFIED
                </span>
              </div>

              <div className="pt-3 border-t border-y2k-gunmetal/10 flex items-center justify-between">
                <span className="text-[10px] text-y2k-gunmetal/60">Session active on this device</span>
                <button
                  onClick={handleSignOut}
                  className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
