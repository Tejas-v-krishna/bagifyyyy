"use client";

import { X, Minus, Plus, ShoppingBag, Tag, CheckCircle2 } from "lucide-react";
import { useCartStore, getItemKey } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const VALID_PROMOS: Record<string, number> = { BAGIFY10: 0.10 };

import { usePathname } from "next/navigation";

export default function CartDrawer() {
  const pathname = usePathname();
  const { isOpen, closeCart, items, removeItem, updateQuantity, cartTotal } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
    return null;
  }

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [removingItemKey, setRemovingItemKey] = useState<string | null>(null);

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

  const subtotal = cartTotal();
  const discountAmount = appliedPromo ? Math.round(subtotal * appliedPromo.discount * 100) / 100 : 0;
  const finalTotal = subtotal - discountAmount;

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
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[10000] w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col h-[100dvh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-2xl uppercase tracking-tighter">
                Your Bag
              </h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
              >
                <span className="sr-only">Close cart</span>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p className="font-medium uppercase tracking-wide">
                    Your bag is empty
                  </p>
                  <button
                    onClick={closeCart}
                    className="text-accent-hover underline underline-offset-4 font-medium mt-4 cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {!isAuthenticated && (
                    <div className="mb-5 p-2.5 bg-y2k-ice border border-y2k-gunmetal/15 text-[10px] font-semibold uppercase tracking-wider text-y2k-gunmetal/80 flex items-center justify-between">
                      <span>Guest Checkout Active</span>
                      <Link
                        href="/login"
                        onClick={closeCart}
                        className="font-bold underline text-black hover:opacity-80"
                      >
                        Sign in for points →
                      </Link>
                    </div>
                  )}
                  <ul className="space-y-6">
                    {items.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <li key={key} className="flex gap-4">
                          {/* Image */}
                          <div className="relative h-24 w-20 bg-muted shrink-0 overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <div className="flex justify-between">
                                <h3 className="font-bold text-sm">{item.name}</h3>
                                <p className="font-medium text-sm">
                                  ₹{item.price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.color} / {item.size}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-border">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      key,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="p-1 hover:bg-muted cursor-pointer"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(key, item.quantity + 1)
                                  }
                                  className="p-1 hover:bg-muted cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              {removingItemKey === key ? (
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                  <span className="text-red-500">Remove?</span>
                                  <button
                                    onClick={() => removeItem(key)}
                                    className="text-black underline cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setRemovingItemKey(null)}
                                    className="text-gray-400 hover:text-black cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRemovingItemKey(key)}
                                  className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
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
              <div className="border-t border-border p-6 bg-background space-y-4">
                {/* Free Shipping Progress */}
                <div className="space-y-2 pb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-center">
                    {subtotal >= 2000
                      ? "You've unlocked free shipping! 🎉"
                      : `₹${(2000 - subtotal).toFixed(0)} away from free shipping`}
                  </p>
                  <div className="bg-gray-200 h-1 w-full">
                    <div
                      className="bg-[#232D3B] h-1 transition-all duration-300"
                      style={{ width: `${Math.min((subtotal / 2000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Promo Code Row */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-y2k-ice border border-y2k-gunmetal/20 px-3 py-2">
                    <span className="text-[10px] font-bold text-y2k-gunmetal uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {appliedPromo.code} — {(appliedPromo.discount * 100).toFixed(0)}% OFF
                    </span>
                    <button
                      onClick={() => { setAppliedPromo(null); setPromoInput(""); }}
                      className="text-[10px] font-bold text-y2k-slate hover:text-black underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 border border-border px-3 py-2">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Promo code"
                        className="w-full text-xs font-medium uppercase outline-none bg-transparent tracking-wider placeholder:normal-case placeholder:tracking-normal"
                      />
                    </div>
                    <button
                      onClick={handleApplyPromo}
                      className="px-3 py-2 bg-[#232D3B] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider -mt-2">{promoError}</p>
                )}

                {/* Totals */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600 font-bold">
                      <span>Promo ({appliedPromo!.code})</span>
                      <span>−₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg pt-1 border-t border-border">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout.
                </p>

                <Link
                  href={`/checkout${appliedPromo ? `?promo=${appliedPromo.code}` : ""}`}
                  onClick={closeCart}
                  className="block w-full bg-[#232D3B] text-[#F8F5E9] rounded-none font-bold uppercase tracking-widest py-4 text-center hover:opacity-90 transition-opacity"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
