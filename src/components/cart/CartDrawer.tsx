"use client";

import { X, Minus, Plus, ShoppingBag, Tag, CheckCircle2 } from "lucide-react";
import { useCartStore, getItemKey } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const VALID_PROMOS: Record<string, number> = { BAGIFY10: 0.10 };

import { usePathname } from "next/navigation";

export default function CartDrawer() {
  const pathname = usePathname();
  const { isOpen, closeCart, items, removeItem, updateQuantity, cartSubtotal, bundleDiscount, cartTotal } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [removingItemKey, setRemovingItemKey] = useState<string | null>(null);

  // Body scroll lock — mirrors Header mobile menu, prevents background bleed
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    document.body.style.overflow = "";
  }, [isOpen]);

  const handleApplyPromo = () => {
    const upper = promoInput.trim().toUpperCase();
    if (VALID_PROMOS[upper]) {
      setAppliedPromo({ code: upper, discount: VALID_PROMOS[upper] });
      setPromoError("");
    } else {
      setPromoError("Invalid promo code.");
      setAppliedPromo(null);
    }
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
  const discountAmount = appliedPromo ? Math.round(goodsTotal * appliedPromo.discount * 100) / 100 : 0;
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
            className="fixed inset-y-0 right-0 z-[10000] w-full max-w-md bg-y2k-ice border-l border-y2k-gunmetal/[0.08] shadow-2xl flex flex-col h-[100dvh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-7 border-b border-y2k-gunmetal/[0.07]">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
                  Your Bag
                </h2>
                {items.length > 0 && (
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/45 mt-0.5">
                    {items.reduce((t, i) => t + i.quantity, 0)} {items.reduce((t, i) => t + i.quantity, 0) === 1 ? "item" : "items"}
                  </p>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-y2k-gunmetal/[0.06] transition-colors cursor-pointer text-y2k-gunmetal/60 hover:text-y2k-gunmetal"
              >
                <span className="sr-only">Close cart</span>
                <X className="h-4.5 w-4.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-y2k-gunmetal/40 space-y-5">
                  <ShoppingBag className="w-10 h-10" strokeWidth={1} />
                  <p className="text-[10.5px] uppercase tracking-[0.2em]">
                    Your bag is empty
                  </p>
                  <button
                    onClick={closeCart}
                    className="text-[10.5px] uppercase tracking-[0.14em] text-y2k-gunmetal underline underline-offset-4 mt-2 cursor-pointer hover:text-black transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {!isAuthenticated && (
                    <div className="mb-6 p-3 bg-white/50 border border-y2k-gunmetal/[0.1] text-[9.5px] uppercase tracking-[0.16em] text-y2k-gunmetal/70 flex items-center justify-between">
                      <span>Guest Checkout Active</span>
                      <Link
                        href="/login"
                        onClick={closeCart}
                        className="text-y2k-gunmetal underline hover:opacity-70 transition-opacity"
                      >
                        Sign in →
                      </Link>
                    </div>
                  )}
                  <ul className="space-y-8">
                    {items.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <li key={key} className="flex gap-5">
                          {/* Image */}
                          <div className="relative h-28 w-[88px] bg-y2k-pale/30 shrink-0 overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="text-xs uppercase tracking-[0.1em] text-y2k-gunmetal leading-snug line-clamp-2 flex-1">
                                  {item.name}
                                </h3>
                                <p className="font-bold text-xs text-y2k-gunmetal shrink-0">
                                  ₹{item.price.toFixed(0)}
                                </p>
                              </div>
                              <p className="text-[9.5px] uppercase tracking-[0.12em] text-y2k-gunmetal/45 mt-1.5">
                                {item.color} / {item.size}
                              </p>
                              {item.bundleName && (
                                <p className="text-[9px] uppercase tracking-[0.16em] text-green-700 mt-1.5">
                                  Part of {item.bundleName}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border border-y2k-gunmetal/[0.12]">
                                <button
                                  aria-label="Decrease quantity"
                                  disabled={item.quantity <= 1}
                                  onClick={() =>
                                    updateQuantity(
                                      key,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="p-1.5 hover:bg-y2k-gunmetal/[0.06] cursor-pointer text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-3 h-3" aria-hidden="true" />
                                </button>
                                <span className="w-8 text-center text-xs text-y2k-gunmetal" aria-live="polite" aria-label={`Quantity ${item.quantity}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  aria-label="Increase quantity"
                                  disabled={item.quantity >= 10}
                                  onClick={() =>
                                    updateQuantity(key, item.quantity + 1)
                                  }
                                  className="p-1.5 hover:bg-y2k-gunmetal/[0.06] cursor-pointer text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3" aria-hidden="true" />
                                </button>
                              </div>
                              {removingItemKey === key ? (
                                <div className="flex items-center gap-2 text-[9.5px] uppercase tracking-wider">
                                  <span className="text-red-500">Remove?</span>
                                  <button
                                    onClick={() => removeItem(key)}
                                    className="text-y2k-gunmetal underline cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setRemovingItemKey(null)}
                                    className="text-y2k-gunmetal/40 hover:text-y2k-gunmetal cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRemovingItemKey(key)}
                                  className="text-[9.5px] uppercase tracking-wider text-y2k-gunmetal/40 hover:text-y2k-gunmetal underline underline-offset-2 cursor-pointer transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-y2k-gunmetal/[0.07] px-8 py-7 bg-y2k-ice space-y-5">
                {/* Free Shipping Progress */}
                <div className="space-y-2">
                  <p className="font-bold text-[9.5px] uppercase tracking-[0.18em] text-center text-y2k-gunmetal/60">
                    {goodsTotal >= 2000
                      ? "Free shipping unlocked ✓"
                      : `₹${(2000 - goodsTotal).toFixed(0)} away from free shipping`}
                  </p>
                  <div className="bg-y2k-gunmetal/[0.08] h-[1px] w-full">
                    <div
                      className="bg-y2k-gunmetal h-[1px] transition-all duration-500"
                      style={{ width: `${Math.min((goodsTotal / 2000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Promo Code Row */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-white/50 border border-y2k-gunmetal/[0.1] px-4 py-3">
                    <span className="text-[9.5px] uppercase tracking-wider text-y2k-gunmetal flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      {appliedPromo.code} — {(appliedPromo.discount * 100).toFixed(0)}% OFF
                    </span>
                    <button
                      onClick={() => { setAppliedPromo(null); setPromoInput(""); }}
                      className="text-[9.5px] uppercase tracking-wider text-y2k-gunmetal/50 hover:text-y2k-gunmetal underline cursor-pointer"
                      aria-label="Remove promo code"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 flex items-center gap-2 border-b border-y2k-gunmetal/20 pb-1.5">
                      <Tag className="w-3 h-3 text-y2k-gunmetal/35 shrink-0" aria-hidden="true" />
                      <input
                        type="text"
                        autoComplete="off"
                        aria-label="Promo code"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Promo code"
                        className="w-full text-[10.5px] uppercase tracking-wider outline-none bg-transparent text-y2k-gunmetal placeholder:text-y2k-gunmetal/30 placeholder:normal-case placeholder:tracking-normal"
                      />
                    </div>
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-1.5 bg-y2k-gunmetal text-white text-[9.5px] uppercase tracking-[0.18em] hover:opacity-90 transition-opacity cursor-pointer"
                      aria-label="Apply promo code"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-[9.5px] text-red-600 uppercase tracking-wider -mt-3">{promoError}</p>
                )}

                {/* Totals */}
                <div className="space-y-2 pt-1">
                  <div className="font-bold flex justify-between items-center text-[10.5px] uppercase tracking-[0.12em] text-y2k-gunmetal/55">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(0)}</span>
                  </div>
                  {setDiscount > 0 && (
                    <div className="font-bold flex justify-between items-center text-[10.5px] uppercase tracking-[0.12em] text-green-700">
                      <span>Curated Set Discount</span>
                      <span>−₹{setDiscount.toFixed(0)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="font-bold flex justify-between items-center text-[10.5px] uppercase tracking-[0.12em] text-green-700">
                      <span>Promo ({appliedPromo!.code})</span>
                      <span>−₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-y2k-gunmetal/[0.07]">
                    <span className="text-[10.5px] uppercase tracking-[0.16em] text-y2k-gunmetal">Total</span>
                    <span className="font-bold text-lg tracking-tight text-y2k-gunmetal">₹{finalTotal.toFixed(0)}</span>
                  </div>
                </div>

                <p className="text-[9px] uppercase tracking-[0.16em] text-y2k-gunmetal/40">
                  Shipping &amp; taxes calculated at checkout.
                </p>

                <Link
                  href={`/checkout${appliedPromo ? `?promo=${appliedPromo.code}` : ""}`}
                  onClick={closeCart}
                  className="btn-bagify block w-full text-y2k-ice uppercase tracking-[0.18em] py-5 text-center text-[10.5px]"
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
