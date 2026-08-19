"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Menu, Heart, ShoppingBag, User } from "lucide-react";
import SearchOverlay from "@/components/ui/SearchOverlay";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
  const { toggleCart, items } = useCartStore();
  const { openAuthModal, isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-y2k-ice/95 backdrop-blur-md border-b border-y2k-gunmetal/10 font-sans">
      {/* ── Top announcement strip ─────────────────────────────────────────── */}
      <div className="w-full border-b border-y2k-gunmetal/10 hidden md:block">
        <div className="w-full grid grid-cols-3 divide-x divide-y2k-gunmetal/10 text-[10px] font-semibold uppercase tracking-[0.16em] text-y2k-gunmetal/75 py-2">
          <div className="flex items-center justify-center px-4 hover:text-black transition-colors">
            <span className="text-center truncate">SUBSCRIBE FOR 10% OFF FIRST DROP</span>
          </div>
          <div className="flex items-center justify-center px-4 hover:text-black transition-colors">
            <span className="text-center truncate">AUTHENTIC ARCHIVE SOURCING</span>
          </div>
          <div className="flex items-center justify-center px-4 hover:text-black transition-colors">
            <span className="text-center truncate">COMPLIMENTARY SHIPPING OVER ₹2000</span>
          </div>
        </div>
      </div>

      {/* ── Main nav bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 h-[56px] md:h-[64px] relative">
        {/* Desktop nav — left side */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1">
          <Link
            href="/topwears"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/75 hover:text-black hover:opacity-100"
          >
            Shirts &amp; Tees
          </Link>
          <Link
            href="/bottomwears"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/75 hover:text-black hover:opacity-100"
          >
            Pants &amp; Cargos
          </Link>
          <Link
            href="/accessories"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/75 hover:text-black hover:opacity-100"
          >
            Accessories
          </Link>
          <Link
            href="/bundles"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/75 hover:text-black hover:opacity-100"
          >
            Bundles
          </Link>
        </nav>

        {/* Brand wordmark (Centered on desktop, left on mobile) */}
        <Link
          href="/"
          className="hover:opacity-85 flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          <Image
            src="/logo.png"
            alt="Bagifyyyy Logo"
            width={220}
            height={48}
            priority
            className="object-contain w-[140px] md:w-[170px] lg:w-[200px]"
          />
        </Link>

        {/* Desktop nav — right side */}
        <nav className="hidden lg:flex items-center gap-6 flex-1 justify-end">
          <Link
            href="/products"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/75 hover:text-black hover:opacity-100 mr-2"
          >
            All Drops
          </Link>

          {/* Search */}
          <SearchOverlay />

          <Link
            href="/wishlist"
            className="text-y2k-gunmetal/75 hover:text-black transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </Link>

          {isAuthenticated ? (
            <Link
              href="/account"
              className="flex items-center gap-2 text-y2k-gunmetal/90 hover:text-black transition-colors"
              aria-label="Account"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-5 h-5 rounded-full object-cover border border-y2k-gunmetal/30"
                />
              ) : (
                <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-y2k-gunmetal/75 hover:text-black transition-colors"
              aria-label="Account"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Link>
          )}

          {/* Bag with count badge */}
          <button
            onClick={toggleCart}
            className="relative text-y2k-gunmetal/90 hover:text-black transition-colors cursor-pointer"
            aria-label="Bag"
          >
            <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 text-[9px] font-black text-white bg-y2k-gunmetal w-4 h-4 flex items-center justify-center rounded-full leading-none">
                {itemCount}
              </span>
            )}
          </button>
        </nav>

        {/* Mobile right: search + bag + hamburger */}
        <div className="flex lg:hidden items-center gap-5">
          <SearchOverlay />
          
          <button
            onClick={toggleCart}
            className="relative text-y2k-gunmetal hover:text-black transition-colors cursor-pointer"
            aria-label="Bag"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 text-[9px] font-black text-white bg-y2k-gunmetal w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-y2k-gunmetal p-1 -mr-1"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X strokeWidth={1.5} className="h-5 w-5" />
            ) : (
              <Menu strokeWidth={1.5} className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile side drawer menu (Portal to body for clean viewport stacking) ── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm lg:hidden cursor-pointer"
                />

                {/* Drawer */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 240 }}
                  className="fixed inset-y-0 left-0 z-[9999] w-[82vw] max-w-sm bg-[#E8EDF2] text-y2k-gunmetal border-r border-y2k-gunmetal/20 shadow-2xl flex flex-col lg:hidden h-full max-h-screen"
                  style={{ backgroundColor: "#E8EDF2" }}
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-y2k-gunmetal/15 bg-[#E8EDF2] shrink-0">
                    <Image
                      src="/logo.png"
                      alt="Bagifyyyy Logo"
                      width={130}
                      height={30}
                      className="object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 hover:bg-y2k-gunmetal/10 rounded-full transition-colors cursor-pointer text-y2k-gunmetal"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col px-6 py-6 gap-5 flex-1 overflow-y-auto bg-[#E8EDF2]">
                    {[
                      { href: "/topwears", label: "Shirts & Tees" },
                      { href: "/bottomwears", label: "Pants & Cargos" },
                      { href: "/accessories", label: "Accessories" },
                      { href: "/bundles", label: "Bundles & Sets" },
                      { href: "/products", label: "All Drops" },
                      { href: "/wishlist", label: "Wishlist" },
                    ].map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[13px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal hover:text-black transition-colors border-b border-y2k-gunmetal/10 pb-4 flex items-center justify-between"
                      >
                        <span>{label}</span>
                        <span className="text-y2k-gunmetal/30 text-xs">→</span>
                      </Link>
                    ))}
                  </nav>

                  {/* Drawer Footer / Account */}
                  <div className="p-6 border-t border-y2k-gunmetal/15 bg-[#E8EDF2] shrink-0">
                    {isAuthenticated ? (
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-none bg-white/70 border border-y2k-gunmetal/15 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:bg-white transition-colors"
                      >
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-y2k-gunmetal/20 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-xs font-bold">
                            {user?.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="flex flex-col truncate">
                          <span className="text-[11px] font-bold tracking-wider truncate">
                            {user?.name || "Member"}
                          </span>
                          <span className="text-[9px] text-y2k-gunmetal/60 lowercase font-normal truncate">
                            {user?.email}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="btn-bagify flex items-center justify-center w-full py-4 text-[11px] font-bold uppercase tracking-[0.15em] gap-2 shadow-md"
                      >
                        <User className="w-4 h-4" />
                        Sign In / Register
                      </Link>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
}
