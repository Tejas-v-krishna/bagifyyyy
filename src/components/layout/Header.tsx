"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";
import { X, Menu } from "lucide-react";

export default function Header() {
  const { toggleCart, items } = useCartStore();
  const { openAuthModal, isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-y2k-ice border-b border-y2k-gunmetal/15">
      {/* ── Top announcement strip ─────────────────────────────────────────── */}
      <div className="w-full border-b border-y2k-gunmetal/15 hidden md:block">
        <div className="w-full grid grid-cols-3 divide-x divide-y2k-gunmetal/15 text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider text-y2k-gunmetal/85 py-2.5">
          <div className="flex items-center justify-center px-4 hover:text-y2k-gunmetal transition-colors">
            <span className="text-center truncate">SUBSCRIBE TO OUR NEWSLETTER</span>
          </div>
          <div className="flex items-center justify-center px-4 hover:text-y2k-gunmetal transition-colors">
            <span className="text-center truncate">NEW DROPS EVERY WEEK</span>
          </div>
          <div className="flex items-center justify-center px-4 hover:text-y2k-gunmetal transition-colors">
            <span className="text-center truncate">FREE SHIPPING OVER ₹299</span>
          </div>
        </div>
      </div>

      {/* ── Main nav bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[54px] md:h-[62px] relative">
        {/* Desktop nav — left side */}
        <nav className="hidden lg:flex items-center gap-8 flex-1">
          <Link
            href="/topwears"
            className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors"
            data-animate="button"
          >
            Topwears
          </Link>
          <Link
            href="/bottomwears"
            className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors"
            data-animate="button"
          >
            Bottomwears
          </Link>
          <Link
            href="/accessories"
            className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors"
            data-animate="button"
          >
            Accessories
          </Link>
        </nav>

        {/* Brand wordmark (Centered on desktop, left on mobile) */}
        <Link
          href="/"
          className="hover:opacity-70 transition-opacity flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          <Image
            src="/logo.png"
            alt="Bagifyyyy Logo"
            width={220}
            height={48}
            priority
            className="object-contain w-[150px] md:w-[180px] lg:w-[210px]"
          />
        </Link>

        {/* Desktop nav — right side */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-end">
          <Link
            href="/products"
            className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors"
            data-animate="button"
          >
            All Drops
          </Link>

          {isAuthenticated ? (
            <Link
              href="/account"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal hover:opacity-80 transition-opacity"
              data-animate="button"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-5 h-5 rounded-full object-cover border border-y2k-gunmetal/20"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-[9px] font-bold">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </span>
              )}
              <span className="truncate max-w-[90px]">{user?.name ? user.name.split(" ")[0] : "Account"}</span>
            </Link>
          ) : (
            <button
              onClick={openAuthModal}
              className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors"
              data-animate="button"
            >
              Account
            </button>
          )}

          <Link
            href="/wishlist"
            className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors relative"
            data-animate="button"
          >
            Wishlist
          </Link>

          {/* Bag with superscript count */}
          <button
            onClick={toggleCart}
            className="text-xs font-semibold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-y2k-gunmetal transition-colors relative"
            data-animate="button"
          >
            Bag
            {itemCount > 0 && (
              <sup className="text-[9px] font-black ml-1 text-y2k-gunmetal">
                ({itemCount})
              </sup>
            )}
          </button>
        </nav>

        {/* Mobile right: bag + hamburger */}
        <div className="flex lg:hidden items-center gap-4">
          <button
            onClick={toggleCart}
            className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal relative"
            data-animate="text-down"
          >
            Bag
            {itemCount > 0 && (
              <sup className="text-[9px] font-black ml-1">({itemCount})</sup>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-y2k-gunmetal"
            data-animate="text-down"
          >
            {isMobileMenuOpen ? (
              <X strokeWidth={1.5} className="h-5 w-5" />
            ) : (
              <Menu strokeWidth={1.5} className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-down menu ─────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-y2k-gunmetal/15 bg-y2k-ice">
          <nav className="flex flex-col px-6 py-6 gap-5">
            {[
              { href: "/topwears", label: "Topwears" },
              { href: "/bottomwears", label: "Bottomwears" },
              { href: "/accessories", label: "Accessories" },
              { href: "/products", label: "All Drops" },
              { href: "/wishlist", label: "Wishlist" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal border-b border-y2k-gunmetal/10 pb-4"
              >
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal border-b border-y2k-gunmetal/10 pb-4 flex items-center justify-between"
              >
                <span>My Account ({user?.name || user?.email})</span>
                {user?.avatar && (
                  <img src={user.avatar} alt="Avatar" className="w-5 h-5 rounded-full" />
                )}
              </Link>
            ) : (
              <button
                onClick={() => {
                  openAuthModal();
                  setIsMobileMenuOpen(false);
                }}
                className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal text-left border-b border-y2k-gunmetal/10 pb-4"
              >
                Account / Sign In
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
