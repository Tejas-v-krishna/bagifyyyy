"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Menu } from "lucide-react";
import SearchOverlay from "@/components/ui/SearchOverlay";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Header() {
  const pathname = usePathname();
  const { toggleCart, items } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      // 1. Check if window is scrolled over a dark section
      const y = Math.min(window.innerHeight - 1, 36);
      const points = [
        window.innerWidth * 0.2,
        window.innerWidth * 0.5,
        window.innerWidth * 0.8,
      ];

      let darkFound = false;
      for (const x of points) {
        const el = document.elementFromPoint(x, y);
        if (el?.closest('[data-nav-theme="dark"]')) {
          darkFound = true;
          break;
        }
      }

      setIsDark(darkFound);
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(currentScrollY > 12);
    };

    updateTheme();
    window.addEventListener("scroll", updateTheme, { passive: true });
    window.addEventListener("resize", updateTheme, { passive: true });
    window.__lenis?.on("scroll", updateTheme);

    const darkElements = document.querySelectorAll('[data-nav-theme="dark"]');
    const observer = new IntersectionObserver(
      () => {
        updateTheme();
      },
      {
        rootMargin: "0px 0px -85% 0px",
        threshold: [0, 0.05, 0.2, 0.5, 0.8, 1],
      }
    );

    darkElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", updateTheme);
      window.removeEventListener("resize", updateTheme);
      window.__lenis?.off("scroll", updateTheme);
      observer.disconnect();
    };
  }, [pathname]);

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

  // Studio/admin stay chromeless. /account keeps the navbar so first-time
  // members always have full navigation (shop, search, bag) — the inline
  // "Back to shop" link alone wasn't discoverable enough.
  if (
    pathname?.startsWith("/studio") ||
    pathname?.startsWith("/admin") ||
    pathname === "/login"
  ) {
    return null;
  }

  const navTextColor = isDark ? "text-white" : "text-[#050505]";
  const navHoverColor = isDark ? "hover:text-white/70" : "hover:text-black/60";
  const logoFilter = isDark
    ? "invert brightness-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
    : "invert-0 drop-shadow-none";

  return (
    <header
      className={`editorial-glass-nav sticky top-0 z-50 w-full font-sans pointer-events-none transition-all duration-300 ${
        isScrolled ? "is-scrolled" : "is-top"
      } ${isDark ? "is-dark" : "is-light"}`}
    >
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 h-[64px] lg:h-[72px] flex items-center justify-between relative">
        {/* Desktop nav — left side matching reference */}
        <nav className={`hidden lg:flex items-center gap-7 xl:gap-9 flex-1 ${navTextColor} pointer-events-auto transition-colors duration-200`}>
          <Link
            href="/new-arrivals"
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            New in
          </Link>
          <Link
            href="/topwears"
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
             Tops
          </Link>
          <Link
            href="/bottomwears"
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
             Bottoms
          </Link>
          <Link
            href="/accessories"
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            Accessories
          </Link>
          <Link
            href="/bundles"
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            Bundles
          </Link>
        </nav>

        {/* Brand wordmark / Logo (Centered, desktop only — mobile bar has its own) */}
        <Link
          href="/"
          className="hover:opacity-75 hidden lg:flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 transition-all duration-300 pointer-events-auto"
        >
          <span className="sr-only">BAGIFYYYY Home</span>
          <Image
            src="/bagifyyyy-wordmark-animated.gif"
            alt="BAGIFYYYY Logo"
            width={1024}
            height={265}
            fetchPriority="high"
            unoptimized
            className={`h-auto w-[130px] sm:w-[150px] lg:w-[180px] object-contain transition-all duration-300 ${logoFilter}`}
          />
        </Link>

        {/* Desktop nav — right side matching reference */}
        <nav className={`hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-end ${navTextColor} pointer-events-auto transition-colors duration-200`}>
          <Link
            href="/wishlist"
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            Wishlist
          </Link>

          <SearchOverlay variant="text" />

          {mounted && isAuthenticated ? (
            <Link
              href="/account"
              className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors flex items-center gap-1.5`}
            >
              <span>{user?.name?.split(" ")[0] || "Account"}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
            >
              Account
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCart}
            className={`text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors cursor-pointer flex items-center gap-1`}
            aria-label={`Cart, ${itemCount} items`}
          >
            <span>Cart ({itemCount})</span>
          </button>
        </nav>

        {/* Mobile top bar */}
        <div className={`flex lg:hidden items-center justify-between w-full ${navTextColor} pointer-events-auto transition-colors duration-200`}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`${navTextColor} ${navHoverColor} transition-colors cursor-pointer text-xs font-medium tracking-tight flex items-center gap-1.5 p-1`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menu</span>
          </button>

          <Link href="/" className="hover:opacity-75 transition-opacity">
            <span className="sr-only">BAGIFYYYY Home</span>
            <Image
              src="/bagifyyyy-wordmark-animated.gif"
              alt="BAGIFYYYY Logo"
              width={1024}
              height={265}
              unoptimized
              className={`h-auto w-[120px] object-contain transition-all duration-300 ${logoFilter}`}
            />
          </Link>

          <div className="flex items-center gap-3">
            <SearchOverlay variant="icon" />
            <button
              type="button"
              onClick={toggleCart}
              className={`${navTextColor} ${navHoverColor} transition-colors cursor-pointer text-xs font-medium`}
              aria-label={`Cart, ${itemCount} items`}
            >
              Cart ({itemCount})
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile side drawer menu ── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm lg:hidden cursor-pointer"
                />

                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 260 }}
                   className="fixed inset-y-0 left-0 z-[9999] w-[82vw] max-w-sm bg-[var(--surface-paper)] text-black border-r border-black/10 flex flex-col lg:hidden h-[100dvh]"
                >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08] shrink-0">
                    <Image
                      src="/bagifyyyy-wordmark-animated.gif"
                      alt="BAGIFYYYY Logo"
                      width={845}
                      height={219}
                      unoptimized
                      className="h-auto w-[120px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1 text-black/60 hover:text-black transition-colors cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="flex flex-col px-6 py-6 gap-6 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      {[
                        { href: "/new-arrivals", label: "New in" },
                         { href: "/topwears", label: "Tops" },
                         { href: "/bottomwears", label: "Bottoms" },
                        { href: "/accessories", label: "Accessories" },
                        { href: "/bundles", label: "Bundles" },
                        { href: "/wishlist", label: "Wishlist" },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-base font-normal tracking-tight text-black hover:opacity-60 transition-opacity flex items-center justify-between py-1"
                        >
                          <span>{label}</span>
                          <span className="text-black/30 text-xs">→</span>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 px-1 py-3 text-[11px] font-medium tracking-tight text-black/70">
                      <Link href="/track" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-black transition-colors">
                        Track Order
                      </Link>
                      <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-black transition-colors">
                        Contact
                      </Link>
                    </div>
                  </nav>

                  <div className="p-6 border-t border-black/[0.08] shrink-0">
                    {isAuthenticated ? (
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                         className="flex items-center gap-3 p-3.5 bg-white rounded-[var(--radius-image)] border border-black/10 text-[12px] font-medium tracking-tight text-black hover:bg-[var(--surface-panel)] transition-colors"
                      >
                        <div className="flex flex-col truncate min-w-0">
                          <span className="font-semibold text-black">
                            {user?.name || "Account"}
                          </span>
                          <span className="text-[10px] text-black/50 lowercase truncate font-normal">
                            {user?.email}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                         className="editorial-cta-dark flex w-full items-center justify-center gap-2 py-3.5 text-xs"
                      >
                         <span>Sign in</span>
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
