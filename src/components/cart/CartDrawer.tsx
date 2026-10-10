"use client";

import { X, Minus, Plus, Tag, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight, Clock } from "lucide-react";
import { useCartStore, getItemKey } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import { triggerPinataBurst, triggerPromoSuccessBurst } from "@/lib/confetti";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

type UpsellProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  images?: { url: string }[] | string[];
  sizes?: string[];
  colors?: string[];
  isSoldOut?: boolean;
};

function CartItemHoldBadge({ expiresAt }: { expiresAt?: number }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("0:00");
      } else {
        const totalSec = Math.floor(diff / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || !expiresAt) return null;

  return (
    <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold text-amber-950 bg-amber-400/25 border border-amber-500/30 px-1.5 py-0.5 rounded-sm">
      <Clock className="w-2.5 h-2.5 text-amber-700" />
      <span>Held: {timeLeft}</span>
    </span>
  );
}

/** "You may also like" rail inside the bag: live catalogue minus what's in it. */
function CartUpsell({ closeCart }: { closeCart: () => void }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        if (cancelled) return;
        const list: UpsellProduct[] = Array.isArray(data)
          ? data
          : (data as { products?: UpsellProduct[] }).products ?? [];
        const inBag = new Set(items.map((i) => i.id));
        setProducts(list.filter((p) => !inBag.has(p.id) && !p.isSoldOut).slice(0, 6));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [items]);

  if (products.length === 0) return null;

  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const handleAdd = (p: UpsellProduct, e?: React.MouseEvent) => {
    const hasOptions =
      (Array.isArray(p.sizes) && p.sizes.length > 1) ||
      (Array.isArray(p.colors) && p.colors.length > 1);
    if (hasOptions) {
      closeCart();
      router.push(`/product/${p.id}`);
      return;
    }
    triggerPinataBurst(e);
    const img = p.image
      ?? (typeof p.images?.[0] === "string" ? p.images[0] : (p.images?.[0] as { url?: string } | undefined)?.url)
      ?? "/placeholder.jpg";
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      mrp: p.compareAtPrice ?? null,
      image: img,
      quantity: 1,
      size: p.sizes?.[0] || "One Size",
      color: p.colors?.[0] || "Default",
    });
    setAddedId(p.id);
    window.setTimeout(() => setAddedId((cur) => (cur === p.id ? null : cur)), 1200);
  };

  return (
    <div className="mt-8 pt-6 border-t border-black/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-microgramma text-[15px] font-bold uppercase tracking-tight text-black leading-none">
            You may also like
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-black/45 mt-1">
            Complementary archive pieces
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label="Scroll recommendations back"
            className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer text-black active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            aria-label="Scroll recommendations forward"
            className="w-7 h-7 rounded-full bg-black hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer text-white active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p) => {
          const img = p.image
            ?? (typeof p.images?.[0] === "string" ? p.images[0] : (p.images?.[0] as { url?: string } | undefined)?.url)
            ?? "/placeholder.jpg";
          const added = addedId === p.id;
          return (
            <div
              key={p.id}
              className="group/item snap-start shrink-0 w-[200px] sm:w-[220px] border border-black/10 bg-white rounded-xl p-2 flex items-center gap-2.5 transition-colors hover:border-black/30"
            >
              <Link
                href={`/product/${p.id}`}
                onClick={closeCart}
                className="relative w-16 h-20 bg-[#e9e9ec] rounded-lg shrink-0 overflow-hidden"
                aria-label={p.name}
              >
                <Image src={img} alt={p.name} fill draggable={false} sizes="80px" className="object-cover object-center transition-transform duration-500 group-hover/item:scale-105" />
              </Link>
              <div className="flex-1 min-w-0 pr-0.5">
                <Link href={`/product/${p.id}`} onClick={closeCart} className="block truncate text-[11px] font-semibold uppercase tracking-tight text-black hover:opacity-60 transition-opacity" title={p.name}>
                  {p.name}
                </Link>
                <p className="text-[11px] font-mono font-medium text-black mt-0.5 tabular-nums">
                  ₹{p.price.toLocaleString("en-IN")}
                </p>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  type="button"
                  onClick={(e) => handleAdd(p, e)}
                  disabled={added}
                  className={`mt-2 w-full py-1 px-2.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    added
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-black text-white hover:bg-black/80"
                  }`}
                >
                  {added ? "Added ✓" : "Add to bag +"}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const pathname = usePathname();
  const {
    isOpen,
    closeCart,
    items,
    removeItem,
    updateQuantity,
    cartSubtotal,
    bundleDiscount,
    cartTotal,
    promoCode,
    promoDiscount,
    promoType,
    isFreeShipping,
    applyPromo,
    setPromo,
    clearPromo,
    promoAmount,
    shippingFee,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [promoInput, setPromoInput] = useState<string | null>(null);
  const promoInputValue = promoInput ?? promoCode ?? "";
  const [promoError, setPromoError] = useState("");
  const appliedPromo = promoCode ? { code: promoCode, discount: promoDiscount } : null;

  // Body scroll lock — ref-counted via scrollLock so overlapping overlays
  // (e.g. cart + search) don't stomp each other's lock/restore.
  useEffect(() => {
    if (!isOpen) return;
    acquireScrollLock();
    return () => releaseScrollLock();
  }, [isOpen]);

  const [applyingPromo, setApplyingPromo] = useState(false);
  const [shakePromo, setShakePromo] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmRemoveKey) return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-remove-tooltip]")) return;
      setConfirmRemoveKey(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmRemoveKey(null);
    };
    window.addEventListener("click", handleDocClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleDocClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [confirmRemoveKey]);

  const triggerShake = () => {
    setShakePromo(true);
    setTimeout(() => setShakePromo(false), 500);
  };

  const handleApplyPromo = async (e?: React.MouseEvent) => {
    if (!promoInputValue.trim()) {
      triggerShake();
      return;
    }
    setApplyingPromo(true);
    setPromoError("");

    try {
      // First try local store (instant)
      const res = applyPromo(promoInputValue);
      if (res.ok) {
        setPromoInput(promoInputValue.trim().toUpperCase());
        setPromoError("");
        setApplyingPromo(false);
        triggerPromoSuccessBurst(e);
        return;
      }

      // Check dynamic coupon from DB via API
      const apiRes = await fetch(
        `/api/coupons?code=${encodeURIComponent(promoInputValue.trim())}&subtotal=${goodsTotal}`
      );
      const data = await apiRes.json();

      if (apiRes.ok && data.coupon) {
        setPromo(data.coupon);
        setPromoInput(data.coupon.code);
        setPromoError("");
        triggerPromoSuccessBurst(e);
      } else {
        setPromoError(data.error || "Invalid promo code.");
        triggerShake();
      }
    } catch {
      setPromoError("Unable to validate coupon.");
      triggerShake();
    } finally {
      setApplyingPromo(false);
    }
  };

  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
    return null;
  }

  // Set discounts come off before the promo code, matching priceCart() on the
  // server. `goodsTotal` is what the shopper actually pays for the items.
  const subtotal = cartSubtotal();
  const setDiscount = bundleDiscount();
  const goodsTotal = cartTotal();
  const discountAmount = promoAmount();
  const deliveryFee = shippingFee();
  const isFree = isFreeShipping || promoType === "FREE_SHIPPING";
  const finalTotal = Math.max(0, Math.round((goodsTotal - discountAmount + deliveryFee) * 100) / 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[9999] bg-black/35 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            data-lenis-prevent="true"
            role="dialog"
            aria-modal="true"
            aria-label={`Shopping bag with ${items.reduce((t, i) => t + i.quantity, 0)} items`}
            className="fixed inset-y-0 right-0 z-[10000] w-full max-w-md border-l border-black/10 bg-[#f5f5f2] flex flex-col h-[100dvh] text-black selection:bg-black selection:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-6 border-b border-black/10 bg-white">
              <div className="flex items-baseline gap-3">
                <h2 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
                  Your Bag
                </h2>
                {!isAuthenticated && (
                  <Link
                    href="/login"
                    onClick={closeCart}
                    className="text-[10px] font-mono uppercase tracking-[0.14em] text-black/45 hover:text-black underline underline-offset-2 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-[#f2f2f2] hover:bg-black hover:text-white flex items-center justify-center transition-colors cursor-pointer text-black"
              >
                <span className="sr-only">Close cart</span>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col py-1">
                  <div className="text-center mb-6">
                    <p className="font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black leading-none">
                      Your bag is empty
                    </p>
                    <p className="text-[11px] text-black/50 leading-relaxed mt-2 font-mono uppercase tracking-[0.08em]">
                      Explore the archive & categories below
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {[
                      { href: "/products", label: "All pieces", count: "Archive & Drops", image: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg", pos: "object-[50%_25%]" },
                      { href: "/topwears", label: "Topwears", count: "Hoodies & Jackets", image: "/assets/ai/prod_model_1_hoodie_1786659181183.jpg", pos: "object-[50%_18%]" },
                      { href: "/bottomwears", label: "Bottomwears", count: "Cargos & Denim", image: "/assets/ai/prod_model_2_cargo_1786659253971.jpg", pos: "object-[50%_48%]" },
                      { href: "/accessories", label: "Accessories", count: "Bags & Chains", image: "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg", pos: "object-[50%_45%]" },
                    ].map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={closeCart}
                        className="group relative flex h-[104px] items-center justify-between overflow-hidden rounded-2xl bg-[#e7e7e9] pl-5 border border-black/[0.04] transition-all duration-300 hover:border-black/20 hover:bg-[#dedee0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
                      >
                        <div className="relative z-10 flex flex-col justify-center min-w-0 pr-2">
                          <span className="font-microgramma text-[17px] font-bold uppercase tracking-tight text-[#0a0a0a] leading-tight">
                            {cat.label}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-black/45 mt-1">
                            {cat.count}
                          </span>
                        </div>

                        <div className="relative h-full w-[46%] shrink-0 overflow-hidden">
                          <Image
                            src={cat.image}
                            alt={`Shop ${cat.label}`}
                            fill
                            draggable={false}
                            sizes="200px"
                            className={`object-cover ${cat.pos} transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]`}
                            style={{
                              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 28%, black 65%)",
                              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 28%, black 65%)",
                            }}
                          />
                          <div
                            className="pointer-events-none absolute inset-y-0 left-0 w-8 backdrop-blur-[2px]"
                            style={{
                              maskImage: "linear-gradient(to right, black 0%, transparent 100%)",
                              WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 100%)",
                            }}
                            aria-hidden="true"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white">
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-5 pt-5 border-t border-black/10">
                    <Link
                      href="/products"
                      onClick={closeCart}
                      className="btn-bagify btn-bagify-dark w-full justify-between text-[11px] uppercase tracking-[0.12em]"
                    >
                      <span>Explore all pieces</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <ul className="space-y-3.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {items.map((item) => {
                        const key = getItemKey(item);
                        return (
                          <motion.li
                            key={key}
                            layout
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
                            transition={{ type: "spring", damping: 25, stiffness: 280 }}
                            className={`relative flex gap-4 py-4 border-b border-black/10 transition-colors ${
                              item.isSoldOut ? "opacity-75" : ""
                            }`}
                          >
                            {/* If product was bought / out of stock, blur and show overlay */}
                            {item.isSoldOut && (
                              <div className="absolute inset-0 bg-white/85 backdrop-blur-[3px] flex items-center justify-between p-3.5 z-20 rounded-lg border border-red-200 shadow-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-red-600">
                                    Somebody bought this · Out of stock
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(key)}
                                  className="text-[10px] font-mono uppercase tracking-wider text-black underline font-bold hover:text-red-600 cursor-pointer ml-2 shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            {/* Image is the card cover thumbnail */}
                            <div className="relative h-24 w-18 sm:h-28 sm:w-20 bg-[#e9e9ec] rounded-lg shrink-0 overflow-hidden">
                              <Image
                                src={item.image || "/placeholder.jpg"}
                                alt={item.name}
                                fill
                                draggable={false}
                                className={`object-cover object-center ${item.isSoldOut ? "blur-[2px] opacity-60 grayscale" : ""}`}
                              />
                            </div>

                            {/* Details */}
                            <div className="flex flex-1 flex-col justify-between min-w-0">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-tight text-black leading-snug line-clamp-2 flex-1">
                                    {item.name}
                                  </h3>
                                  <p className="font-mono font-bold text-xs sm:text-[13px] text-black shrink-0 tabular-nums">
                                    ₹{item.price.toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <p className="text-[10px] sm:text-[10.5px] font-mono uppercase tracking-[0.12em] text-black/50 mt-1">
                                  {item.color} / {item.size}
                                </p>
                                {item.bundleName && (
                                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700 mt-1">
                                    Part of {item.bundleName}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-1">
                                <div className="relative inline-flex items-center" data-remove-tooltip="true">
                                  {/* Tooltip pop-up confirmation */}
                                  <AnimatePresence>
                                    {confirmRemoveKey === key && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.94 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute bottom-full left-0 mb-2 z-40 w-52 rounded-xl bg-white text-black p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-black/15"
                                      >
                                        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-black leading-snug">
                                          Are you sure you want to remove this?
                                        </p>
                                        <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-black/10">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmRemoveKey(null);
                                            }}
                                            className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-black/50 hover:text-black transition-colors cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeItem(key);
                                              setConfirmRemoveKey(null);
                                            }}
                                            className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white rounded transition-colors cursor-pointer active:scale-90 shadow-2xs"
                                          >
                                            Yes, remove
                                          </button>
                                        </div>
                                        {/* Caret arrow */}
                                        <div className="absolute top-full left-3.5 -mt-1 w-2 h-2 bg-white border-r border-b border-black/15 rotate-45" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  <div className="inline-flex items-center border border-black/15 rounded-sm bg-white overflow-hidden shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmRemoveKey((prev) => (prev === key ? null : key));
                                      }}
                                      aria-label={`Remove ${item.name} from bag`}
                                      className="w-7 h-7 flex items-center justify-center text-black hover:bg-black/5 active:scale-95 transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                    <span
                                      aria-live="polite"
                                      className="w-7 text-center font-mono font-bold text-xs text-black select-none"
                                    >
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={true}
                                      aria-label="Max quantity reached (1-of-1 piece)"
                                      title="1 of 1 unique piece"
                                      className="w-7 h-7 flex items-center justify-center text-black/25 bg-black/[0.03] cursor-not-allowed border-l border-black/10 select-none"
                                    >
                                      <Plus className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CartItemHoldBadge expiresAt={item.holdExpiresAt} />
                                  <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-black/40">
                                    1 of 1 piece
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                  <CartUpsell closeCart={closeCart} />
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/10 px-6 sm:px-8 py-6 bg-white space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                {/* Promo Code Row */}
                {appliedPromo ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: -6 }}
                    animate={{ opacity: 1, scale: [0.95, 1.04, 1], y: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                    className="flex items-center justify-between bg-[#f4f4f2] border border-black/10 rounded-xl px-4 py-2.5 shadow-2xs"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                      <span className="bg-black text-white px-2 py-0.5 rounded text-[9px] tracking-widest font-bold shadow-2xs">
                        {appliedPromo.code}
                      </span>
                      <span className="text-black/40">·</span>
                      <span className="text-black font-bold">
                        {isFreeShipping ? "FREE SHIPPING" : `${(appliedPromo.discount * 100).toFixed(0)}% OFF`}
                      </span>
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => { clearPromo(); setPromoInput(""); }}
                      className="text-[9.5px] font-mono uppercase tracking-wider text-black/50 hover:text-black underline cursor-pointer"
                      aria-label="Remove promo code"
                    >
                      Remove
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={shakePromo ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="space-y-1.5"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-[#f8f8f8] border border-black/10 focus-within:border-black focus-within:ring-2 focus-within:ring-black/5 focus-within:scale-[1.01] transition-all duration-200 rounded-xl px-3 py-2">
                        <Tag className={`w-3.5 h-3.5 transition-colors ${promoInputValue ? "text-black" : "text-black/40"} shrink-0`} aria-hidden="true" />
                        <motion.input
                          key="promo-input"
                          type="text"
                          autoComplete="off"
                          aria-label="Promo code"
                          value={promoInputValue}
                          onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                          placeholder="PROMO CODE"
                          className="w-full text-xs font-bold uppercase tracking-widest outline-none !bg-transparent text-black placeholder:text-black/35 font-mono border-0 transition-all selection:bg-black selection:text-white"
                        />
                        {promoInputValue && (
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-[8.5px] font-mono text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold shrink-0 tracking-wider"
                          >
                            READY ↵
                          </motion.span>
                        )}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 1.02 }}
                        type="button"
                        onClick={(e) => handleApplyPromo(e)}
                        disabled={applyingPromo}
                        className="btn-bagify btn-bagify-dark px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] cursor-pointer active:scale-95 transition-all shadow-xs"
                        aria-label="Apply promo code"
                      >
                        {applyingPromo ? "..." : "Apply"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
                {promoError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-600 font-bold uppercase tracking-wider"
                  >
                    {promoError}
                  </motion.p>
                )}

                {/* Totals */}
                <div className="space-y-2 pt-2 border-t border-black/5">
                  <div className="flex justify-between items-baseline text-xs text-black/60 font-mono">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {setDiscount > 0 && (
                    <div className="flex justify-between items-baseline text-xs text-emerald-700 font-bold font-mono">
                      <span>Set discount</span>
                      <span>−₹{setDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {discountAmount > 0 && appliedPromo && !isFree && (
                    <div className="flex justify-between items-baseline text-xs text-emerald-700 font-bold font-mono">
                      <span>Promo ({appliedPromo.code})</span>
                      <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-xs text-black/60 font-mono">
                    <span>Standard Shipping</span>
                    <span>
                      {isFree ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="line-through text-black/40">₹80</span>
                          <span className="text-emerald-700 font-bold">FREE</span>
                        </span>
                      ) : (
                        <span>₹80</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-black/10">
                    <span className="text-xs uppercase tracking-[0.16em] font-bold text-black">Total</span>
                    <span className="font-microgramma font-bold text-xl sm:text-2xl tracking-tight text-black tabular-nums">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-bagify btn-bagify-dark block w-full uppercase tracking-[0.2em] py-4 text-center text-xs font-bold"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
