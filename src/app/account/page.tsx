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
    if (!confirm("Clear your order history view? Your orders stay safe with us — they just won't show here.")) return;
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
                  <div className="flex items-center justify-between gap-3">
                    {clearMsg ? (
                      <p role={clearMsg.type === "error" ? "alert" : "status"} className={`text-[11px] font-bold uppercase tracking-[0.1em] ${clearMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                        {clearMsg.text}
                      </p>
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.12em] text-black/40">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
                    )}
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      disabled={clearingHistory || orders.length === 0}
                      className="shrink-0 cursor-pointer border border-black/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-black hover:text-black disabled:opacity-40"
                    >
                      {clearingHistory ? "Clearing…" : "Clear History"}
                    </button>
                  </div>
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
                    if (showAddressForm) cancelAddressForm();
                    else {
                      setEditingAddressId(null);
                      setAddressError("");
                      setShowAddressForm(true);
                    }
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
                        onClick={cancelAddressForm}
                        className="cursor-pointer border border-black/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-bagify cursor-pointer px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                      >
                        {savingAddress ? "Saving…" : editingAddressId ? "Save Changes" : "Save"}
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
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => startEditAddress(addr)}
                              className="cursor-pointer text-[9px] font-bold uppercase tracking-[0.14em] text-black/45 underline underline-offset-4 transition-colors hover:text-black"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="flex cursor-pointer items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black/45 transition-colors hover:text-black"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
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
            <div id="account-panel-settings" role="tabpanel" aria-labelledby="account-tab-settings" className="space-y-4">
              {/* Profile */}
              <section className="rounded-xl border border-black/10 bg-white p-5 text-xs sm:p-7">
                <div className="mb-4 border-b border-black/10 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Profile</p>
                  <p className="mt-2 text-xs leading-relaxed text-black/55">Name and avatar shown across the store.</p>
                </div>
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    {(profileAvatar ?? user?.avatar) ? (
                      <Image
                        src={profileAvatar ?? user?.avatar ?? "/placeholder.jpg"}
                        alt="Avatar preview"
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 shrink-0 rounded-full border border-black/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                        {(profileName ?? user?.name ?? "U")[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                        Avatar image URL
                      </label>
                      <input
                        type="url"
                        value={profileAvatar ?? user?.avatar ?? ""}
                        onChange={(e) => { setProfileAvatar(e.target.value); setProfileMsg(null); }}
                        placeholder="https://…"
                        className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                      />
                    </div>
                    {(profileAvatar ?? user?.avatar) ? (
                      <button
                        type="button"
                        onClick={() => { setProfileAvatar(""); setProfileMsg(null); }}
                        className="shrink-0 cursor-pointer text-[9px] font-bold uppercase tracking-[0.14em] text-black/45 underline underline-offset-4 transition-colors hover:text-black"
                      >
                        Remove
                      </button>
                    ) : null}
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
                      className="cursor-pointer border border-black/15 bg-[#f5f5f2] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:border-black disabled:opacity-50"
                    >
                      {uploadingAvatar ? "Uploading…" : "Upload From Gallery"}
                    </button>
                    <span className="text-[9px] uppercase tracking-[0.12em] text-black/40">JPG · PNG · WebP · Max 2MB</span>
                  </div>
                  {avatarMsg && (
                    <p role={avatarMsg.type === "error" ? "alert" : "status"} className={`text-[11px] font-bold uppercase tracking-[0.1em] ${avatarMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                      {avatarMsg.text}
                    </p>
                  )}
                  <div>
                    <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                      Display name
                    </label>
                    <input
                      value={profileName ?? user?.name ?? ""}
                      onChange={(e) => { setProfileName(e.target.value); setProfileMsg(null); }}
                      maxLength={60}
                      placeholder="Your name"
                      className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                    />
                  </div>
                  {profileMsg && (
                    <p role={profileMsg.type === "error" ? "alert" : "status"} className={`text-[11px] font-bold uppercase tracking-[0.1em] ${profileMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                      {profileMsg.text}
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="btn-bagify cursor-pointer px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                    >
                      {savingProfile ? "Saving…" : "Save Profile"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Email */}
              <section className="rounded-xl border border-black/10 bg-white p-5 text-xs sm:p-7">
                <div className="mb-4 border-b border-black/10 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Email address</p>
                  <p className="mt-2 text-xs leading-relaxed text-black/55">
                    Currently <b>{user?.email}</b>. Loyalty points move with it.
                  </p>
                </div>
                <form onSubmit={handleChangeEmail} className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                      New email *
                    </label>
                    <input
                      required
                      type="email"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailMsg(null); }}
                      placeholder="you@example.com"
                      className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                    />
                  </div>
                  {user?.hasPassword ? (
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                        Current password *
                      </label>
                      <input
                        required
                        type="password"
                        value={emailPassword}
                        onChange={(e) => { setEmailPassword(e.target.value); setEmailMsg(null); }}
                        placeholder="••••••••"
                        className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                      />
                    </div>
                  ) : null}
                  {emailMsg && (
                    <p role={emailMsg.type === "error" ? "alert" : "status"} className={`text-[11px] font-bold uppercase tracking-[0.1em] ${emailMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                      {emailMsg.text}
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingEmail}
                      className="btn-bagify cursor-pointer px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                    >
                      {savingEmail ? "Saving…" : "Change Email"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Password */}
              <section className="rounded-xl border border-black/10 bg-white p-5 text-xs sm:p-7">
                <div className="mb-4 border-b border-black/10 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Password</p>
                  <p className="mt-2 text-xs leading-relaxed text-black/55">
                    {user?.hasPassword
                      ? "Change the password used with email sign-in."
                      : "No password set (Google sign-in). Set one to enable email sign-in."}
                  </p>
                </div>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                  {user?.hasPassword ? (
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                        Current password *
                      </label>
                      <input
                        required
                        type="password"
                        value={currentPassword}
                        onChange={(e) => { setCurrentPassword(e.target.value); setPasswordMsg(null); }}
                        placeholder="••••••••"
                        className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                      />
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                        New password (8+ chars) *
                      </label>
                      <input
                        required
                        type="password"
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordMsg(null); }}
                        placeholder="••••••••"
                        className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
                        Confirm new password *
                      </label>
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMsg(null); }}
                        placeholder="••••••••"
                        className="w-full border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                      />
                    </div>
                  </div>
                  {passwordMsg && (
                    <p role={passwordMsg.type === "error" ? "alert" : "status"} className={`text-[11px] font-bold uppercase tracking-[0.1em] ${passwordMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                      {passwordMsg.text}
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="btn-bagify cursor-pointer px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50"
                    >
                      {savingPassword ? "Saving…" : user?.hasPassword ? "Change Password" : "Set Password"}
                    </button>
                  </div>
                </form>
                <div className="mt-4 border-t border-black/10 pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] leading-relaxed text-black/55">
                      Prefer email? We&apos;ll send a reset link to your Gmail — it opens a page to set a new password.
                    </p>
                    <button
                      type="button"
                      onClick={handleSendResetLink}
                      disabled={sendingResetLink}
                      className="shrink-0 cursor-pointer border border-black/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:border-black disabled:opacity-50"
                    >
                      {sendingResetLink ? "Sending…" : "Email Reset Link"}
                    </button>
                  </div>
                  {resetLinkMsg && (
                    <p role={resetLinkMsg.type === "error" ? "alert" : "status"} className={`mt-3 text-[11px] font-bold uppercase tracking-[0.1em] ${resetLinkMsg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
                      {resetLinkMsg.text}
                    </p>
                  )}
                </div>
              </section>

              {/* Session */}
              <section className="rounded-xl border border-black/10 bg-white p-5 text-xs sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Sign-in method</span>
                    <p className="mt-2 text-xs font-bold text-black">
                      {user?.googleId ? "Google OAuth" : "Email & Password"}
                      {user?.googleId && user?.hasPassword ? " + Password" : ""}
                    </p>
                  </div>
                  <span className="bg-black px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white">Verified</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
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
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
