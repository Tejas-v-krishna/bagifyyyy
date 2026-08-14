"use client";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore, getItemKey } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, cartTotal } =
    useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-2xl uppercase tracking-tighter">
                Your Bag
              </h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <span className="sr-only">Close cart</span>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p className="font-medium uppercase tracking-wide text-center">
                    Sign in to view your bag
                  </p>
                  <button
                    onClick={() => {
                      closeCart();
                      openAuthModal();
                    }}
                    className="btn-bagify rounded-none mt-4 px-6 py-3 font-bold text-xs tracking-widest uppercase"
                  >
                    Sign In
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p className="font-medium uppercase tracking-wide">
                    Your bag is empty
                  </p>
                  <button
                    onClick={closeCart}
                    className="text-accent-hover underline underline-offset-4 font-medium mt-4"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
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
                                className="p-1 hover:bg-muted"
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
                                className="p-1 hover:bg-muted"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(key)}
                              className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground underline underline-offset-2"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-6 bg-background space-y-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Subtotal</span>
                  <span>₹{cartTotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout.
                </p>
                <div className="space-y-2 py-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-center">
                    {cartTotal() >= 2000
                      ? "You've unlocked free shipping! 🎉"
                      : `You're ₹${(2000 - cartTotal()).toFixed(
                          2
                        )} away from free shipping`}
                  </p>
                  <div className="bg-gray-200 h-1 w-full">
                    <div
                      className="bg-[#232D3B] h-1 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (cartTotal() / 2000) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <Link
                  href="/checkout"
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
