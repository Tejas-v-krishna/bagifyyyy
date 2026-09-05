"use client";

import { X, Minus, Plus, Tag, CheckCircle2, Truck, ChevronRight, ChevronLeft } from "lucide-react";
import { useCartStore, getItemKey } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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

  const handleAdd = (p: UpsellProduct) => {
    const hasOptions =
      (Array.isArray(p.sizes) && p.sizes.length > 1) ||
      (Array.isArray(p.colors) && p.colors.length > 1);
    if (hasOptions) {
      closeCart();
      router.push(`/product/${p.id}`);
      return;
    }
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
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-[15px] font-medium tracking-tight text-black">
          You may also like…
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label="Scroll recommendations back"
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer text-black"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            aria-label="Scroll recommendations forward"
            className="w-8 h-8 rounded-full bg-black hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory"
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
              className="snap-start shrink-0 w-[240px] sm:w-[260px] border border-black/10 bg-white rounded-sm p-3 flex items-center gap-3"
            >
              <Link
                href={`/product/${p.id}`}
                onClick={closeCart}
                className="relative w-14 h-[72px] bg-[#f2f2f2] rounded-xs shrink-0 overflow-hidden"
                aria-label={p.name}
              >
                <Image src={img} alt={p.name} fill draggable={false} sizes="60px" className="object-contain p-1 mix-blend-multiply" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${p.id}`} onClick={closeCart} className="block truncate text-[11px] font-bold uppercase tracking-tight text-black hover:opacity-60 transition-opacity" title={p.name}>
                  {p.name}
                </Link>
                <p className="text-[11px] font-medium text-black mt-0.5 tabular-nums">
                  ₹{p.price.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(p)}
                disabled={added}
                className={`shrink-0 px-4 py-2 rounded-md text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${added ? "bg-emerald-700 text-white" : "bg-black text-white hover:bg-black/80 active:scale-95"}`}
              >
                {added ? "Added" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const pathname = usePathname();
  const { isOpen, closeCart, items, removeItem, updateQuantity, cartSubtotal, bundleDiscount, cartTotal, promoCode, promoDiscount, applyPromo, clearPromo, promoAmount } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [promoInput, setPromoInput] = useState<string | null>(null);
  const promoInputValue = promoInput ?? promoCode ?? "";
  const [promoError, setPromoError] = useState("");
  const appliedPromo = promoCode ? { code: promoCode, discount: promoDiscount } : null;

  // Body scroll lock — stops background scroll including Lenis smooth scrolling
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("lenis-stopped");
      window.__lenis?.stop();
      return () => {
        document.body.style.overflow = prevOverflow;
        document.documentElement.classList.remove("lenis-stopped");
        window.__lenis?.start();
      };
    } else {
      document.body.style.overflow = "";
      document.documentElement.classList.remove("lenis-stopped");
      window.__lenis?.start();
    }
  }, [isOpen]);

  const handleApplyPromo = () => {
    const res = applyPromo(promoInputValue);
    if (res.ok) {
      setPromoInput(promoInputValue.trim().toUpperCase());
      setPromoError("");
    }
    else setPromoError(res.error || "Invalid promo code.");
  };

  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
    return null;
  }

  // Set discounts come off before the promo code, matching priceCart() on the
  // server. `goodsTotal` is what the shopper actually pays for the items, so it
  // is also what the free-shipping progress bar measures against.
  const subtotal = cartSubtotal();
  const setDiscount = bundleDiscount();
  const goodsTotal = cartTotal();
  const discountAmount = promoAmount();
  const finalTotal = goodsTotal - discountAmount;

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
              <div>
                <h2 className="font-microgramma text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
                  Your Bag
                </h2>
                {items.length > 0 && (
                  <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-black/50 mt-0.5">
                     {items.reduce((t, i) => t + i.quantity, 0)} {items.reduce((t, i) => t + i.quantity, 0) === 1 ? "PIECE" : "PIECES"} IN YOUR BAG
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-[#f2f2f2] hover:bg-black hover:text-white flex items-center justify-center transition-colors cursor-pointer text-black"
              >
                <span className="sr-only">Close cart</span>
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Cart Items */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col py-2">
                  <p className="font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black text-center">
                    Your cart is empty.
                  </p>
                  <p className="text-xs text-black/55 leading-relaxed mt-1.5 mb-6 text-center">
                    Find trending collection, products right below!
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      { href: "/bottomwears", label: "Bottoms", image: "/assets/ai/prod_model_2_cargo_1786659253971.jpg", alt: "Shop bottoms" },
                      { href: "/topwears", label: "Tops", image: "/assets/ai/prod_model_1_hoodie_1786659181183.jpg", alt: "Shop tops" },
                      { href: "/accessories", label: "Accessories", image: "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg", alt: "Shop accessories" },
                    ].map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={closeCart}
                        className="group relative block aspect-[16/8] overflow-hidden rounded-xl bg-[#e7e7e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
                      >
                        <Image
                          src={cat.image}
                          alt={cat.alt}
                          fill
                          draggable={false}
                          sizes="(max-width: 768px) 100vw, 448px"
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                        <span className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/10 to-transparent pointer-events-none" aria-hidden="true" />
                        <span className="absolute inset-y-0 left-5 flex items-center font-microgramma text-xl font-bold uppercase tracking-tight text-[#0a0a0a]">
                          {cat.label}
                        </span>
                        <span className="absolute inset-y-0 right-4 flex items-center">
                          <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                            <ChevronRight className="w-5 h-5 text-black" strokeWidth={2} aria-hidden="true" />
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {!isAuthenticated && (
                    <div className="mb-6 p-4 rounded-xl bg-white border border-black/10 text-[10px] uppercase tracking-[0.16em] text-black/75 flex items-center justify-between shadow-xs">
                      <span className="font-semibold">Checking out as guest</span>
                      <Link
                        href="/login"
                        onClick={closeCart}
                        className="text-black font-bold underline underline-offset-4 hover:opacity-70 transition-opacity"
                      >
                        Sign in →
                      </Link>
                    </div>
                  )}
                  <ul className="space-y-4">
                    {items.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <li key={key} className="flex gap-4 p-4 rounded-2xl bg-white border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                          {/* Image */}
                          <div className="relative h-24 w-[76px] bg-[#f2f2f2] rounded-xl shrink-0 overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              fill
                              draggable={false}
                              className="object-contain p-1 mix-blend-multiply"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="text-xs font-bold uppercase tracking-tight text-black leading-snug line-clamp-2 flex-1">
                                  {item.name}
                                </h3>
                                <p className="font-bold text-xs text-black shrink-0 tabular-nums">
                                  ₹{item.price.toLocaleString("en-IN")}
                                </p>
                              </div>
                              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-black/50 mt-1">
                                {item.color} / {item.size}
                              </p>
                              {item.bundleName && (
                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700 mt-1">
                                  Part of {item.bundleName}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                              <div className="flex items-center rounded-lg border border-black/10 bg-[#f8f8f8] p-0.5">
                                <button
                                  type="button"
                                  aria-label={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                                  onClick={() =>
                                    item.quantity <= 1
                                      ? removeItem(key)
                                      : updateQuantity(key, item.quantity - 1)
                                  }
                                  className="p-1 min-h-10 min-w-10 inline-flex items-center justify-center hover:bg-white rounded cursor-pointer text-black/60 hover:text-black transition-colors"
                                >
                                  <Minus className="w-3 h-3" aria-hidden="true" />
                                </button>
                                <span className="w-7 text-center text-xs font-mono font-bold text-black" aria-live="polite" aria-label={`Quantity ${item.quantity}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label="Increase quantity"
                                  disabled={item.quantity >= 10}
                                  onClick={() =>
                                    updateQuantity(key, item.quantity + 1)
                                  }
                                  className="p-1 min-h-10 min-w-10 inline-flex items-center justify-center hover:bg-white rounded cursor-pointer text-black/60 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3" aria-hidden="true" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(key)}
                                className="text-[9.5px] font-mono uppercase tracking-wider text-black/40 hover:text-red-600 underline underline-offset-2 cursor-pointer transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <CartUpsell closeCart={closeCart} />
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/10 px-6 sm:px-8 py-6 bg-white space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                {/* Free Shipping Progress */}
                <div
                  className="space-y-2"
                  role="status"
                  aria-live="polite"
                  aria-label={
                    goodsTotal >= 2000
                       ? "Free shipping is on us"
                      : `Add ₹{(2000 - goodsTotal).toLocaleString("en-IN")} more for free shipping`
                  }
                >
                  <div className="flex items-center justify-center gap-2 text-center">
                    <Truck
                      className={`w-3.5 h-3.5 transition-colors ${goodsTotal >= 2000 ? "text-emerald-700" : "text-black/50"}`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p className={`text-[10px] uppercase tracking-[0.16em] font-bold transition-colors ${goodsTotal >= 2000 ? "text-emerald-700" : "text-black/70"}`}>
                      {goodsTotal >= 2000
                         ? "Free shipping is on us"
                        : `₹${(2000 - goodsTotal).toLocaleString("en-IN")} away from free shipping`}
                    </p>
                  </div>
                  <div className="bg-black/10 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-full ${goodsTotal >= 2000 ? "bg-emerald-600" : "bg-black"}`}
                      style={{ width: `${Math.min((goodsTotal / 2000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Promo Code Row */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-[#f8f8f8] border border-black/10 rounded-xl px-4 py-2.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      {appliedPromo.code} — {(appliedPromo.discount * 100).toFixed(0)}% OFF
                    </span>
                    <button
                      type="button"
                      onClick={() => { clearPromo(); setPromoInput(""); }}
                      className="text-[9.5px] font-mono uppercase tracking-wider text-black/50 hover:text-black underline cursor-pointer"
                      aria-label="Remove promo code"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-[#f8f8f8] border border-black/10 rounded-xl px-3 py-2">
                      <Tag className="w-3.5 h-3.5 text-black/40 shrink-0" aria-hidden="true" />
                      <input
                        type="text"
                        autoComplete="off"
                        aria-label="Promo code"
                        value={promoInputValue}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Promo code"
                        className="w-full text-xs uppercase tracking-wider outline-none bg-transparent text-black placeholder:text-black/35 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="btn-bagify btn-bagify-dark px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] cursor-pointer"
                      aria-label="Apply promo code"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">{promoError}</p>
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
                  {discountAmount > 0 && appliedPromo && (
                    <div className="flex justify-between items-baseline text-xs text-emerald-700 font-bold font-mono">
                      <span>Promo ({appliedPromo.code})</span>
                      <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
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
