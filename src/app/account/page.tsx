"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import {
  LogOut,
  User,
  Truck,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Package,
  Sliders,
  Check,
  CheckCircle2,
  ShieldCheck,
  Award,
  ChevronRight,
  Mail,
  Key,
  Shield,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { orderStatusLabel } from "@/lib/orderStatus";

type AccountTab = "orders" | "wishlist" | "addresses" | "loyalty" | "settings";

type LoyaltyTier = "CHROME" | "STEEL" | "GOLD";

const loyaltyTiers: Record<LoyaltyTier, { minimum: number; next: number | null; nextName: string | null; multiplier: string; perks: string[] }> = {
  CHROME: {
    minimum: 0,
    next: 500,
    nextName: "STEEL",
    multiplier: "1.0x",
    perks: [
      "Early drop access on all new vintage releases",
      "5-minute bag reservation lock at checkout",
      "Standard points accumulation (10 PTS per ₹100)",
      "Digital order tracking & archive receipt storage",
    ],
  },
  STEEL: {
    minimum: 500,
    next: 2000,
    nextName: "GOLD",
    multiplier: "1.5x",
    perks: [
      "Priority order dispatch within 24 hours",
      "1.5x points multiplier on all orders",
      "Secret drop previews & archive password access",
      "Exclusive community member promotions",
    ],
  },
  GOLD: {
    minimum: 2000,
    next: null,
    nextName: null,
    multiplier: "2.0x",
    perks: [
      "2x points multiplier on all purchases",
      "First priority concierge fulfillment on every drop",
      "Direct 1-of-1 archive requests & vintage sourcing",
      "Zero delivery fee on all domestic drop orders",
    ],
  },
};

function getLoyaltyTier(points: number, rawTier?: unknown): LoyaltyTier {
  if (points >= 2000) return "GOLD";
  if (points >= 500) return "STEEL";
  if (rawTier === "GOLD" || rawTier === "STEEL") return rawTier as LoyaltyTier;
  return "CHROME";
}

export default function AccountPage() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
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
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Profile / email / password editing
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearMsg, setClearMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingResetLink, setSendingResetLink] = useState(false);
  const [resetLinkMsg, setResetLinkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const startEditAddress = (addr: any) => {
    setAddressForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "Maharashtra",
      pincode: addr.pincode || "",
    });
    setEditingAddressId(addr.id);
    setAddressError("");
    setShowAddressForm(true);
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressError("");
    setAddressForm({
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "Maharashtra",
      pincode: "",
    });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");
    setSavingAddress(true);
    try {
      const isEdit = Boolean(editingAddressId);
      const res = await fetch(
        isEdit ? `/api/account/addresses/${editingAddressId}` : "/api/account/addresses",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setAddressError(data.error || "Failed to save address.");
      } else if (isEdit) {
        setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? data.address : a)));
        cancelAddressForm();
      } else {
        setAddresses((prev) => [data.address, ...prev]);
        cancelAddressForm();
      }
    } catch {
      setAddressError("Error saving address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarMsg(null);
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setAvatarMsg({ type: "error", text: data.error || "Failed to upload avatar." });
      } else {
        setUser(data.user);
        setProfileAvatar(null);
        setAvatarMsg({ type: "success", text: "Profile picture updated." });
      }
    } catch {
      setAvatarMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear your order history view? Your orders stay safe with us, they just won't show here.")) return;
    setClearMsg(null);
    setClearingHistory(true);
    try {
      const res = await fetch("/api/account/orders/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setClearMsg({ type: "error", text: data.error || "Failed to clear history." });
      } else {
        setOrders([]);
        setClearMsg({ type: "success", text: "Order history cleared from your view." });
      }
    } catch {
      setClearMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!user?.email) return;
    setResetLinkMsg(null);
    setSendingResetLink(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetLinkMsg({ type: "error", text: data.error || "Failed to send reset link." });
      } else {
        setResetLinkMsg({ type: "success", text: `Reset link sent to ${user.email}. Check your Gmail.` });
      }
    } catch {
      setResetLinkMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSendingResetLink(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        if (editingAddressId === id) cancelAddressForm();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName ?? user?.name ?? "",
          avatar: profileAvatar ?? user?.avatar ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.error || "Failed to update profile." });
      } else {
        setUser(data.user);
        setProfileName(null);
        setProfileAvatar(null);
        setProfileMsg({ type: "success", text: "Profile updated." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    setSavingEmail(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, currentPassword: emailPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailMsg({ type: "error", text: data.error || "Failed to change email." });
      } else {
        setUser(data.user);
        setNewEmail("");
        setEmailPassword("");
        setEmailMsg({ type: "success", text: "Email updated. Points moved with it." });
      }
    } catch {
      setEmailMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPassword || undefined, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ type: "error", text: data.error || "Failed to update password." });
      } else {
        setUser({ ...(user as NonNullable<typeof user>), hasPassword: true });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMsg({ type: "success", text: "Password updated." });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSavingPassword(false);
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
                <User className="mt-8 h-8 w-8 text-white/75" aria-hidden="true" />
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

  const points = Number(loyaltyData?.points) || 0;
  const tier = getLoyaltyTier(points, loyaltyData?.tier);
  const tierInfo = loyaltyTiers[tier];
  const pointsToNext = tierInfo.next === null ? 0 : Math.max(0, tierInfo.next - points);
  const tierProgress = tierInfo.next === null
    ? 100
    : Math.min(100, Math.max(0, Math.round(((points - tierInfo.minimum) / (tierInfo.next - tierInfo.minimum)) * 100)));

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10 selection:bg-black selection:text-white">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* ── Top Bar Breadcrumb ── */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between border-b border-black/10 pb-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-black/60 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span>Shop</span>
          </Link>
        </div>

        {/* ── Page Header ── */}
        <header className="mb-8 border-b border-black/10 pb-6">
          <h1 className="font-microgramma text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
            Your Account
          </h1>
        </header>

        {/* ── Identity & Loyalty Overview (Luxury Dual Cards) ── */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-5">
          {/* 1. Member Profile Identity Card */}
          <section className="relative rounded-3xl border border-black/8 bg-white/90 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="Avatar"
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 shrink-0 rounded-full border-2 border-black/10 object-cover shadow-xs"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0c0c0e] font-microgramma text-base font-bold text-white shadow-xs">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="truncate font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black">
                        {user?.name || "Member"}
                      </h2>
                      {isAdmin && (
                        <span className="rounded-full bg-black px-2.5 py-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-white">
                          Studio Admin
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs font-mono text-black/50 mt-1">{user?.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.03] px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/70 hover:bg-black hover:text-white transition-all cursor-pointer shrink-0"
                  title="Sign out of account"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-black/[0.03] border border-black/8 p-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  Store Administration
                </span>
                <Link
                  href="/studio"
                  className="btn-bagify btn-bagify-dark text-[9.5px] uppercase tracking-[0.14em] py-1.5 px-3"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Open Studio</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </Link>
              </div>
            )}
          </section>

          {/* 2. Chrome Club VIP Pass Card */}
          <section className="relative rounded-3xl bg-[#0c0c0e] text-white p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col justify-between">
            {/* Ambient luxury metallic gradient */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.14),_transparent_65%)]" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/[0.03] blur-2xl" aria-hidden="true" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/80">
                    Chrome Club
                  </span>
                </div>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {tier}
                </span>
              </div>

              {/* Balance */}
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-microgramma text-4xl sm:text-5xl font-bold tracking-tight text-white leading-none">
                      {points.toLocaleString("en-IN")}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-white/50">
                      Points
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("loyalty")}
                  className="cursor-pointer text-[10px] font-mono font-bold uppercase tracking-wider text-white/70 hover:text-white underline underline-offset-4 transition-colors shrink-0"
                >
                  View Perks →
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15 mb-2.5">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>

              <div className="text-[10px] font-mono text-white/60">
                <span>
                  {tierInfo.next
                    ? `${pointsToNext.toLocaleString("en-IN")} pts to ${tierInfo.nextName}`
                    : "Top Tier Unlocked"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Segmented Navigation Tabs (Pill Controls) ── */}
        <nav
          className="mb-8 flex items-center gap-1.5 sm:gap-2 overflow-x-auto rounded-2xl border border-black/8 bg-white/70 p-1.5 backdrop-blur-md select-none scrollbar-none shadow-xs"
          role="tablist"
          aria-label="Account sections"
        >
          {[
            { id: "orders", label: "Orders", icon: Package, count: orders.length },
            { id: "wishlist", label: "Saved", icon: Heart, count: wishlistIds.length },
            { id: "addresses", label: "Addresses", icon: MapPin, count: addresses.length },
            { id: "loyalty", label: "VIP Perks", icon: Sparkles },
            { id: "settings", label: "Settings", icon: Sliders },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`account-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`account-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id as AccountTab)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                  isActive
                    ? "bg-black text-white shadow-xs"
                    : "text-black/55 hover:text-black hover:bg-black/[0.04]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-black/50"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-black/[0.06] text-black/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Main Tab Panels ─────────────────────────────────────────────── */}
        <div>
          {/* 1. ORDERS TAB */}
          {activeTab === "orders" && (
            <div id="account-panel-orders" role="tabpanel" aria-labelledby="account-tab-orders" className="space-y-4">
              {loadingOrders ? (
                <div className="rounded-2xl border border-black/8 bg-white p-12 text-center text-xs font-mono font-bold uppercase tracking-[0.16em] text-black/45 shadow-xs">
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-black/8 bg-white p-12 text-center shadow-xs">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.03] border border-black/8">
                    <ShoppingBag className="h-6 w-6 text-black/40" />
                  </div>
                  <h3 className="font-microgramma text-base sm:text-lg font-bold uppercase tracking-tight text-black mb-1.5">
                    No Orders Recorded Yet
                  </h3>
                  <p className="text-xs text-black/55 max-w-sm mx-auto mb-5 leading-relaxed">
                    Pieces you purchase will show up here along with live dispatch tracking and receipts.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify btn-bagify-dark inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                  >
                    <span>Shop Available Drops</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 px-1">
                    {clearMsg ? (
                      <p role={clearMsg.type === "error" ? "alert" : "status"} className={`text-[11px] font-bold uppercase tracking-[0.1em] ${clearMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                        {clearMsg.text}
                      </p>
                    ) : (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-black/50">
                        {orders.length} {orders.length === 1 ? "Order" : "Orders"} Recorded
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      disabled={clearingHistory || orders.length === 0}
                      className="cursor-pointer text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/50 hover:text-black underline underline-offset-4 transition-colors disabled:opacity-40"
                    >
                      {clearingHistory ? "Clearing…" : "Clear View History"}
                    </button>
                  </div>

                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:border-black/20 transition-all duration-300"
                    >
                      {/* Order Header */}
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-3.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold tracking-tight text-black">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-black/20">/</span>
                          <span className="font-mono text-[11px] uppercase tracking-wider text-black/50">
                            {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-black">
                            {orderStatusLabel(ord.orderStatus)}
                          </span>

                          {ord.trackingId && (
                            <button
                              onClick={() => handleCopyTracking(ord.trackingId)}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-black/10 bg-[#f5f5f2] px-3 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-black transition-colors hover:bg-white"
                              title="Copy tracking number"
                            >
                              <Truck className="w-2.5 h-2.5 text-black/70" />
                              <span>{copiedTrackingId === ord.trackingId ? "Copied" : ord.trackingId}</span>
                              <Copy className="w-2 h-2 opacity-50" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="mb-4 divide-y divide-black/5">
                        {ord.items?.map((it: any) => (
                          <div key={it.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-black/8 bg-[#e9e9ec]">
                                <Image
                                  src={it.image || "/placeholder.jpg"}
                                  alt={it.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-microgramma text-xs font-bold uppercase tracking-tight text-black">
                                  {it.name}
                                </p>
                                <p className="text-[10px] font-mono text-black/50 uppercase tracking-wider mt-0.5">
                                  {it.quantity}x · {it.size || "One Size"} · {it.color || "Default"}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 font-mono text-xs font-bold text-black">
                              ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Row */}
                      <div className="flex items-center justify-between gap-4 border-t border-black/8 pt-3.5 text-xs">
                        <span className="truncate text-[10.5px] font-mono uppercase tracking-wider text-black/50">
                          Ship to: {ord.shippingAddress?.fullName} ({ord.shippingAddress?.city})
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-black/50">Total</span>
                          <span className="font-microgramma text-base font-bold text-black">
                            ₹{ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SAVED PIECES TAB */}
          {activeTab === "wishlist" && (
            <div id="account-panel-wishlist" role="tabpanel" aria-labelledby="account-tab-wishlist" className="space-y-4">
              {loadingWishlist ? (
                <div className="rounded-2xl border border-black/8 bg-white p-12 text-center text-xs font-mono font-bold uppercase tracking-[0.16em] text-black/45 shadow-xs">
                  Loading saved pieces…
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="rounded-3xl border border-black/8 bg-white p-12 text-center shadow-xs">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.03] border border-black/8">
                    <Heart className="h-6 w-6 text-black/40" />
                  </div>
                  <h3 className="font-microgramma text-base sm:text-lg font-bold uppercase tracking-tight text-black mb-1.5">
                    Your Wishlist Is Empty
                  </h3>
                  <p className="text-xs text-black/55 max-w-sm mx-auto mb-5 leading-relaxed">
                    Heart any 1-of-1 archive find while browsing to save it to your personal curation here.
                  </p>
                  <Link
                    href="/products"
                    className="btn-bagify btn-bagify-dark inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                  >
                    <span>Browse New Arrivals</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-3 shadow-xs hover:border-black/20 hover:shadow-md transition-all duration-300"
                    >
                      <Link href={`/product/${p.id}`} className="block">
                        <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-xl bg-[#ededeb]">
                          <Image
                            src={p.images?.[0]?.url || p.images?.[0] || "/placeholder.jpg"}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                        <h4 className="truncate font-microgramma text-xs font-bold uppercase tracking-tight text-black">
                          {p.name}
                        </h4>
                        <p className="mt-1 font-mono text-xs font-bold text-black">
                          ₹{p.price.toLocaleString("en-IN")}
                        </p>
                      </Link>

                      <div className="mt-3 flex items-center gap-1.5 border-t border-black/8 pt-3">
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
                          className="btn-bagify btn-bagify-dark flex-1 cursor-pointer py-2 text-center text-[9px] font-bold uppercase tracking-[0.12em]"
                        >
                          Add to Bag
                        </button>
                        <button
                          onClick={() => toggleItem(p.id)}
                          className="cursor-pointer rounded-lg border border-black/10 p-2 text-black/50 transition-colors hover:border-black hover:text-black hover:bg-black/5"
                          title="Remove from saved"
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
            <div id="account-panel-addresses" role="tabpanel" aria-labelledby="account-tab-addresses" className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
                    Addresses <span className="font-mono text-sm text-black/40">({addresses.length})</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showAddressForm) cancelAddressForm();
                    else {
                      setEditingAddressId(null);
                      setAddressError("");
                      setShowAddressForm(true);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-black/85 cursor-pointer shadow-xs"
                >
                  <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${showAddressForm ? "rotate-45" : ""}`} />
                  <span>{showAddressForm ? "Close Form" : "Add Address"}</span>
                </button>
              </div>

              {/* Add Address Form */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onSubmit={handleAddAddress}
                    className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs overflow-hidden space-y-4"
                  >
                    <div className="border-b border-black/8 pb-4">
                      <h4 className="font-microgramma text-lg font-bold uppercase tracking-tight text-black">
                        {editingAddressId ? "Edit Address" : "New Address"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                          Recipient Full Name *
                        </label>
                        <input
                          required
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                          placeholder="Alex Vance"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                          Contact Phone (+91) *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 font-mono text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                        Street Address & Landmark *
                      </label>
                      <input
                        required
                        value={addressForm.street}
                        onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                        className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                        placeholder="Flat 402, Lotus Heights, MG Road"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                          Pincode *
                        </label>
                        <input
                          required
                          maxLength={6}
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value }))}
                          className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 font-mono text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                          placeholder="400001"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                          City *
                        </label>
                        <input
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                          className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                          State *
                        </label>
                        <input
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                          className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                          placeholder="Maharashtra"
                        />
                      </div>
                    </div>

                    {addressError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3 text-xs font-mono font-bold text-red-600" role="alert">
                        {addressError}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelAddressForm}
                        className="rounded-full border border-black/12 px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/70 transition-all hover:border-black hover:text-black cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="rounded-full bg-black px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-black/85 cursor-pointer disabled:opacity-50"
                      >
                        {savingAddress ? "Saving…" : editingAddressId ? "Save Changes" : "Save Destination"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Grid */}
              {loadingAddresses ? (
                <div className="rounded-3xl border border-black/8 bg-white p-12 text-center text-xs font-mono font-bold uppercase tracking-[0.16em] text-black/45">
                  Accessing address archive…
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-3xl border border-black/8 bg-white p-12 text-center shadow-xs">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f5f2] border border-black/8 text-black/40">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h4 className="font-microgramma text-lg font-bold uppercase tracking-tight text-black">
                    No Saved Destinations
                  </h4>
                  <p className="mt-1.5 mb-5 text-xs text-black/55 max-w-sm mx-auto">
                    Save your primary dispatch addresses for instant 1-click checkout on upcoming drops.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-black/85 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Destination</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr.id}
                      className="group relative rounded-3xl border border-black/8 bg-white p-6 transition-all hover:border-black/20 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.12em] ${idx === 0 ? "bg-black text-white" : "bg-black/5 text-black/70"}`}>
                          {idx === 0 && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {idx === 0 ? "Primary Destination" : `Destination #${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditAddress(addr)}
                            className="rounded-full border border-black/10 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-black/60 transition-all hover:border-black hover:text-black cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="rounded-full border border-red-200/60 p-1.5 text-red-500 transition-all hover:bg-red-50 hover:border-red-400 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="font-microgramma text-base font-bold uppercase tracking-tight text-black">{addr.fullName}</p>
                      <p className="mt-1 font-mono text-[11px] text-black/50">{addr.phone}</p>
                      <p className="mt-3 text-xs leading-relaxed text-black/70">
                        {addr.street}<br />
                        {addr.city}, {addr.state} — <span className="font-mono font-bold text-black">{addr.pincode}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. VIP PERKS TAB */}
          {activeTab === "loyalty" && (
            <div id="account-panel-loyalty" role="tabpanel" aria-labelledby="account-tab-loyalty" className="space-y-6">
              {/* Header Box */}
              <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col gap-2 border-b border-black/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-microgramma text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black">
                      Member Tiers
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black text-white">
                      {points.toLocaleString("en-IN")} Total Points
                    </span>
                  </div>
                </div>

                {/* 3 Tier Cards */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {(["CHROME", "STEEL", "GOLD"] as LoyaltyTier[]).map((tierKey) => {
                    const info = loyaltyTiers[tierKey];
                    const isCurrent = tier === tierKey;
                    const tierLabel = tierKey === "CHROME" ? "0 - 499 PTS" : tierKey === "STEEL" ? "500 - 1,999 PTS" : "2,000+ PTS";
                    return (
                      <div
                        key={tierKey}
                        className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                          isCurrent
                            ? "border-2 border-black bg-[#f5f5f2] shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                            : "border border-black/10 bg-white/80 hover:bg-white hover:border-black/20"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-black/50">
                              {tierLabel}
                            </span>
                            {isCurrent ? (
                              <span className="rounded-full bg-black px-2.5 py-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-white">
                                ACTIVE TIER
                              </span>
                            ) : null}
                          </div>

                          <h3 className="font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black">
                            {tierKey}
                          </h3>
                          <p className="mt-1 text-[11px] font-mono font-bold uppercase tracking-wider text-black/60">
                            {info.multiplier} Multiplier
                          </p>

                          <ul className="mt-5 space-y-2.5 border-t border-black/8 pt-4">
                            {info.perks.map((perk, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-black/75 leading-snug">
                                <span className="text-black font-bold text-[10px] shrink-0 mt-0.5">✦</span>
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Points Activity Ledger */}
              <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-black/8">
                  <div>
                    <h3 className="font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black">
                      Points Activity
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-black/50">
                    10 PTS = ₹100 SPENT
                  </span>
                </div>

                {loyaltyData?.history && loyaltyData.history.length > 0 ? (
                  <div className="divide-y divide-black/8">
                    {loyaltyData.history.map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between gap-4 py-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-black uppercase tracking-tight block">
                              {h.reason}
                            </span>
                            <span className="text-[10px] font-mono text-black/40">
                              {new Date(h.createdAt || Date.now()).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                          +{h.points} PTS
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-black/50">
                      No points activity recorded yet. Earn 10 points for every ₹100 spent on completed orders.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 5. SETTINGS TAB */}
          {activeTab === "settings" && (
            <div id="account-panel-settings" role="tabpanel" aria-labelledby="account-tab-settings" className="space-y-6">
              {/* Profile Card */}
              <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
                <div className="border-b border-black/8 pb-4 mb-6">
                  <h3 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
                    Profile
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-[#fbfbf9] border border-black/5">
                    {(profileAvatar ?? user?.avatar) ? (
                      <Image
                        src={profileAvatar ?? user?.avatar ?? "/placeholder.jpg"}
                        alt="Avatar preview"
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 shrink-0 rounded-2xl border border-black/10 object-cover shadow-xs"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black font-microgramma text-xl font-bold text-white shadow-xs">
                        {(profileName ?? user?.name ?? "U")[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                        Custom Avatar Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={profileAvatar ?? user?.avatar ?? ""}
                          onChange={(e) => { setProfileAvatar(e.target.value); setProfileMsg(null); }}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs outline-none transition-all focus:border-black focus:ring-1 focus:ring-black"
                        />
                        {(profileAvatar ?? user?.avatar) ? (
                          <button
                            type="button"
                            onClick={() => { setProfileAvatar(""); setProfileMsg(null); }}
                            className="shrink-0 rounded-xl border border-black/10 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-black/50 transition-all hover:border-black hover:text-black cursor-pointer"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="hidden"
                      aria-label="Upload profile picture from gallery"
                      onChange={handleAvatarFile}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-[#f5f5f2] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black transition-all hover:border-black hover:bg-white cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingAvatar ? "Uploading…" : "Upload From Device"}</span>
                    </button>
                  </div>

                  {avatarMsg && (
                    <div role={avatarMsg.type === "error" ? "alert" : "status"} className={`rounded-2xl p-3 text-xs font-mono font-bold ${avatarMsg.type === "error" ? "border border-red-200 bg-red-50 text-red-600" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                      {avatarMsg.text}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                      Display Name
                    </label>
                    <input
                      value={profileName ?? user?.name ?? ""}
                      onChange={(e) => { setProfileName(e.target.value); setProfileMsg(null); }}
                      maxLength={60}
                      placeholder="Your name"
                      className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {profileMsg && (
                    <div role={profileMsg.type === "error" ? "alert" : "status"} className={`rounded-2xl p-3 text-xs font-mono font-bold ${profileMsg.type === "error" ? "border border-red-200 bg-red-50 text-red-600" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-full bg-black px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-black/85 cursor-pointer disabled:opacity-50"
                    >
                      {savingProfile ? "Saving…" : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Email Credentials */}
              <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
                <div className="border-b border-black/8 pb-4 mb-6">
                  <h3 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
                    Email Address
                  </h3>
                  <p className="mt-1 text-xs text-black/50 font-mono">
                    {user?.email}
                  </p>
                </div>

                <form onSubmit={handleChangeEmail} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                      New Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailMsg(null); }}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {user?.hasPassword ? (
                    <div>
                      <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                        Current Account Password *
                      </label>
                      <input
                        required
                        type="password"
                        value={emailPassword}
                        onChange={(e) => { setEmailPassword(e.target.value); setEmailMsg(null); }}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                  ) : null}

                  {emailMsg && (
                    <div role={emailMsg.type === "error" ? "alert" : "status"} className={`rounded-2xl p-3 text-xs font-mono font-bold ${emailMsg.type === "error" ? "border border-red-200 bg-red-50 text-red-600" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                      {emailMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingEmail}
                      className="rounded-full bg-black px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-black/85 cursor-pointer disabled:opacity-50"
                    >
                      {savingEmail ? "Saving…" : "Update Email"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Password & Security */}
              <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
                <div className="border-b border-black/8 pb-4 mb-6">
                  <h3 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
                    Password
                  </h3>
                </div>

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  {user?.hasPassword ? (
                    <div>
                      <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                        Current Password *
                      </label>
                      <input
                        required
                        type="password"
                        value={currentPassword}
                        onChange={(e) => { setCurrentPassword(e.target.value); setPasswordMsg(null); }}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                        New Password (8+ characters) *
                      </label>
                      <input
                        required
                        type="password"
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordMsg(null); }}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60">
                        Confirm New Password *
                      </label>
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMsg(null); }}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-xs outline-none transition-all focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  {passwordMsg && (
                    <div role={passwordMsg.type === "error" ? "alert" : "status"} className={`rounded-2xl p-3 text-xs font-mono font-bold ${passwordMsg.type === "error" ? "border border-red-200 bg-red-50 text-red-600" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="rounded-full bg-black px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-black/85 cursor-pointer disabled:opacity-50"
                    >
                      {savingPassword ? "Saving…" : user?.hasPassword ? "Change Password" : "Set Password"}
                    </button>
                  </div>
                </form>

                <div className="mt-8 border-t border-black/8 pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase text-black">
                        Forgot your password?
                      </h4>
                      <p className="text-[11px] text-black/55 mt-0.5">
                        We will send a reset link to your registered email.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendResetLink}
                      disabled={sendingResetLink}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/12 bg-[#f5f5f2] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black transition-all hover:border-black hover:bg-white cursor-pointer disabled:opacity-50"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{sendingResetLink ? "Sending…" : "Send Reset Link"}</span>
                    </button>
                  </div>

                  {resetLinkMsg && (
                    <div role={resetLinkMsg.type === "error" ? "alert" : "status"} className={`mt-3 rounded-2xl p-3 text-xs font-mono font-bold ${resetLinkMsg.type === "error" ? "border border-red-200 bg-red-50 text-red-600" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                      {resetLinkMsg.text}
                    </div>
                  )}
                </div>
              </section>

              {/* Authentication & Session Info */}
              <section className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-microgramma text-lg font-bold uppercase tracking-tight text-black">
                      {user?.googleId ? "Google Account" : "Email & Password"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-emerald-800">
                      <Check className="w-2.5 h-2.5" />
                      Active Session
                    </span>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-2 rounded-full border border-black/12 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black transition-all hover:border-black hover:bg-black hover:text-white cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
