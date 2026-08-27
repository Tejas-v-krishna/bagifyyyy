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

import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { toggleCart, items } = useCartStore();
  const { openAuthModal, isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveSiteViewers, setLiveSiteViewers] = useState(24);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setLiveSiteViewers((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return Math.min(Math.max(next, 14), 45);
      });
    }, 10000);
    return () => clearInterval(timer);
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

  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-y2k-ice/80 backdrop-blur-2xl border-b border-y2k-gunmetal/[0.06] font-sans">
      {/* ── Top announcement strip ─────────────────────────────────────────── */}
      <div className="w-full hidden md:block border-b border-y2k-gunmetal/[0.06]">
        <div className="w-full grid grid-cols-3 divide-x divide-y2k-gunmetal/[0.06] text-[9.5px] font-semibold uppercase tracking-[0.2em] text-y2k-gunmetal/55 py-2.5">
          <div className="flex items-center justify-center gap-1.5 px-4 hover:text-y2k-gunmetal transition-colors">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
            </span>
            <span className="font-bold text-center truncate">{mounted ? liveSiteViewers : 24} COLLECTORS LIVE ON ARCHIVE</span>
          </div>
          <div className="flex items-center justify-center px-4 hover:text-y2k-gunmetal transition-colors">
            <span className="text-center truncate">AUTHENTIC ARCHIVE SOURCING</span>
          </div>
          <div className="flex items-center justify-center px-4 hover:text-y2k-gunmetal transition-colors">
            <span className="font-bold text-center truncate">COMPLIMENTARY SHIPPING OVER ₹2000</span>
          </div>
        </div>
      </div>

      {/* ── Main nav bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 sm:px-8 lg:px-12 h-[60px] md:h-[72px] relative">
        {/* Desktop nav — left side */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10 flex-1">
          <Link
            href="/topwears"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300"
          >
            Shirts &amp; Tees
          </Link>
          <Link
            href="/bottomwears"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300"
          >
            Pants &amp; Cargos
          </Link>
          <Link
            href="/accessories"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300"
          >
            Accessories
          </Link>
          <Link
            href="/bundles"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300"
          >
            Bundles
          </Link>
        </nav>

        {/* Brand wordmark (Centered on desktop, left on mobile) */}
        <Link
          href="/"
          className="hover:opacity-80 flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 transition-opacity duration-300"
        >
          <span className="sr-only">BAGIFYYYY (Bagify) Home</span>
          <Image
            src="/logo.png"
            alt="BAGIFYYYY (Bagify) Premium Streetwear Logo"
            width={220}
            height={48}
            priority
            className="object-contain w-[148px] md:w-[180px] lg:w-[210px]"
          />
        </Link>

        {/* Desktop nav — right side */}
        <nav className="hidden lg:flex items-center gap-7 flex-1 justify-end">
          <Link
            href="/products"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300 mr-1"
          >
            All Drops
          </Link>

          {/* Search */}
          <SearchOverlay />

          <Link
            href="/wishlist"
            className="text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300"
            aria-label="Wishlist"
          >
            <Heart className="w-[17px] h-[17px]" strokeWidth={1.5} />
          </Link>

          {/* User Auth: Profile when logged in, Sign In / Sign Up button when logged out */}
          {mounted && isAuthenticated ? (
            <Link
              href="/account"
              className="flex items-center gap-2 text-y2k-gunmetal/70 hover:text-y2k-gunmetal transition-colors duration-300 group"
              aria-label="Account"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-5 h-5 rounded-full object-cover border border-y2k-gunmetal/20 group-hover:border-y2k-gunmetal transition-colors"
                />
              ) : (
                <User className="w-[17px] h-[17px]" strokeWidth={1.5} />
              )}
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] hidden xl:inline max-w-[100px] truncate">
                {user?.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-bagify text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 flex items-center gap-1.5 transition-all shadow-sm hover:opacity-95 text-[#F8F5E9]"
              aria-label="Sign In / Sign Up"
            >
              <User className="w-3 h-3 opacity-80" strokeWidth={2} />
              <span>Sign In / Sign Up</span>
            </Link>
          )}

          {/* Bag with count badge */}
          <button
            onClick={toggleCart}
            className="relative text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors duration-300 cursor-pointer"
            aria-label={`Shopping bag, ${itemCount} items`}
          >
            <ShoppingBag className="w-[17px] h-[17px]" strokeWidth={1.5} aria-hidden="true" />
            {itemCount > 0 && (
              <span aria-hidden="true" className="absolute -top-1.5 -right-2 text-[8px] font-black text-white bg-y2k-gunmetal w-[15px] h-[15px] flex items-center justify-center rounded-full leading-none">
                {itemCount}
              </span>
            )}
          </button>
        </nav>

        {/* Mobile right: search + bag + hamburger */}
        <div className="flex lg:hidden items-center gap-1">
          <div className="p-2">
            <SearchOverlay />
          </div>
          
          <button
            onClick={toggleCart}
            className="relative text-y2k-gunmetal hover:text-black transition-colors cursor-pointer p-2"
            aria-label={`Shopping bag, ${itemCount} items`}
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            {itemCount > 0 && (
              <span aria-hidden="true" className="absolute top-0.5 right-0.5 text-[8px] font-black text-white bg-y2k-gunmetal w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-y2k-gunmetal p-2 -mr-2 cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
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
                  className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm lg:hidden cursor-pointer"
                />

                {/* Drawer */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 260 }}
                  className="fixed inset-y-0 left-0 z-[9999] w-[80vw] max-w-sm bg-y2k-ice text-y2k-gunmetal border-r border-y2k-gunmetal/[0.08] shadow-2xl flex flex-col lg:hidden h-[100dvh]"
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-7 py-6 border-b border-y2k-gunmetal/[0.08] shrink-0">
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
                      className="p-1.5 hover:bg-y2k-gunmetal/8 transition-colors cursor-pointer text-y2k-gunmetal/70"
                      aria-label="Close menu"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col px-7 py-8 gap-8 flex-1 overflow-y-auto">
                    {/* Collection Category Group */}
                    <div>
                      <span className="section-label block mb-4">
                        COLLECTIONS
                      </span>
                      <div className="flex flex-col gap-1">
                        {[
                          { href: "/topwears", label: "Shirts & Tees" },
                          { href: "/bottomwears", label: "Pants & Cargos" },
                          { href: "/accessories", label: "Accessories" },
                          { href: "/bundles", label: "Bundles & Sets" },
                        ].map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-sm uppercase tracking-[0.1em] text-y2k-gunmetal hover:text-black transition-colors flex items-center justify-between py-3 border-b border-y2k-gunmetal/[0.06] last:border-0"
                          >
                            <span>{label}</span>
                            <span className="text-y2k-gunmetal/25 text-xs">→</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Discover & VIP Group */}
                    <div>
                      <span className="section-label block mb-4">
                        DISCOVER
                      </span>
                      <div className="flex flex-col gap-1">
                        {[
                          { href: "/products", label: "All Drops" },
                          { href: "/wishlist", label: "Wishlist" },
                          { href: "/account", label: "VIP Club" },
                        ].map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-sm uppercase tracking-[0.1em] text-y2k-gunmetal hover:text-black transition-colors flex items-center justify-between py-3 border-b border-y2k-gunmetal/[0.06] last:border-0"
                          >
                            <span>{label}</span>
                            <span className="text-y2k-gunmetal/25 text-xs">→</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* VIP Brand Notice */}
                    <div className="font-bold mt-auto py-3 px-4 bg-white/50 border border-y2k-gunmetal/[0.08] flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-y2k-gunmetal/60">
                      <span>Free Shipping ₹2000+</span>
                      <span className="text-y2k-gunmetal/30">·</span>
                      <span>Verified 1-of-1</span>
                    </div>
                  </nav>

                  {/* Drawer Footer / Account */}
                  <div className="p-6 border-t border-y2k-gunmetal/[0.08] shrink-0">
                    {isAuthenticated ? (
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 bg-white/60 border border-y2k-gunmetal/[0.1] text-[11px] uppercase tracking-wider text-y2k-gunmetal hover:bg-white/80 transition-colors"
                      >
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-y2k-gunmetal/10 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-xs shrink-0">
                            {user?.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="flex flex-col truncate min-w-0">
                          <span className="text-[11px] tracking-wider truncate">
                            {user?.name || "Member Passport"}
                          </span>
                          <span className="text-[9px] text-y2k-gunmetal/50 lowercase truncate">
                            {user?.email}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="btn-bagify flex items-center justify-center w-full py-4 text-[10.5px] uppercase tracking-[0.18em] gap-2"
                      >
                        <User className="w-4 h-4" />
                        <span>Sign In / Sign Up</span>
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
