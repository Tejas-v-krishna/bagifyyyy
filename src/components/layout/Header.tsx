"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Heart, User, ShoppingBag } from "lucide-react";
import SearchOverlay from "@/components/ui/SearchOverlay";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Desktop navbar action that morphs on hover: the text label slides up and
 * fades while a glass-blurred icon pill takes its place.
 */
function NavAction({
  label,
  icon,
  href,
  onClick,
  dark,
  textColor,
  hoverColor,
  ariaLabel,
}: {
  label: React.ReactNode;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  dark: boolean;
  textColor: string;
  hoverColor: string;
  ariaLabel: string;
}) {
  const className = `group relative inline-flex h-9 min-w-9 items-center justify-center overflow-hidden rounded-full border border-transparent px-2 transition-all duration-300 hover:backdrop-blur-md cursor-pointer ${textColor} ${hoverColor} ${
    dark ? "hover:border-white/25 hover:bg-white/10" : "hover:border-black/10 hover:bg-black/[0.04]"
  }`;
  const text = (
    <>
      <span className="text-[13px] md:text-[13.5px] font-normal tracking-tight whitespace-nowrap transition-all duration-300 group-hover:-translate-y-5 group-hover:opacity-0">
        {label}
      </span>
      <span className="absolute inset-0 flex translate-y-5 items-center justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true">
        {icon}
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {text}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label={ariaLabel}>
      {text}
    </button>
  );
}

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isMobileMenuOpen]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Bag bump: pops the cart icon whenever a piece lands in the bag.
  const [cartBump, setCartBump] = useState(false);
  const prevCountRef = useRef(itemCount);
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setCartBump(true);
      const t = window.setTimeout(() => setCartBump(false), 450);
      prevCountRef.current = itemCount;
      return () => window.clearTimeout(t);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

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
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 h-[56px] lg:h-[60px] flex items-center justify-between relative">
        {/* Desktop nav — left side matching reference */}
        <nav className={`hidden lg:flex items-center gap-5 xl:gap-6 flex-1 ${navTextColor} pointer-events-auto transition-colors duration-200`}>
          <Link
            href="/new-arrivals"
            className={`nav-link-animated text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            New in
          </Link>
          <Link
            href="/topwears"
            className={`nav-link-animated text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
             Tops
          </Link>
          <Link
            href="/bottomwears"
            className={`nav-link-animated text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
             Bottoms
          </Link>
          <Link
            href="/accessories"
            className={`nav-link-animated text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            Accessories
          </Link>
          <Link
            href="/bundles"
            className={`nav-link-animated text-[13px] md:text-[13.5px] font-normal tracking-tight ${navTextColor} ${navHoverColor} transition-colors`}
          >
            Bundles
          </Link>
        </nav>

        {/* Brand wordmark / Logo (Centered, desktop only — mobile bar has its own) */}
        <Link
          href="/"
          className="group/logo hover:opacity-75 hidden lg:flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 transition-all duration-300 pointer-events-auto"
        >
          <span className="sr-only">BAGIFYYYY Home</span>
          <span className="relative inline-block overflow-hidden transition-transform duration-300 group-hover/logo:scale-[1.03]">
            <Image
              src="/bagifyyyy-wordmark-animated.gif"
              alt="BAGIFYYYY Logo"
              width={1024}
              height={265}
              fetchPriority="high"
              unoptimized
              className={`h-auto w-[120px] sm:w-[135px] lg:w-[160px] object-contain transition-all duration-300 ${logoFilter}`}
            />
            <span
              className="pointer-events-none absolute inset-0 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover/logo:translate-x-[110%]"
              aria-hidden="true"
            />
          </span>
        </Link>

        {/* Desktop nav — right side: labels morph into glass icons on hover */}
        <nav className={`hidden lg:flex items-center gap-1.5 xl:gap-2 flex-1 justify-end ${navTextColor} pointer-events-auto transition-colors duration-200`}>
          <NavAction
            href="/wishlist"
            label="Wishlist"
            icon={<Heart className="w-[18px] h-[18px]" strokeWidth={1.8} />}
            dark={isDark}
            textColor={navTextColor}
            hoverColor={navHoverColor}
            ariaLabel="Wishlist"
          />

          <SearchOverlay variant="morph" dark={isDark} />

          {mounted && isAuthenticated ? (
            <NavAction
              href="/account"
              label={user?.name?.split(" ")[0] || "Account"}
              icon={<User className="w-[18px] h-[18px]" strokeWidth={1.8} />}
              dark={isDark}
              textColor={navTextColor}
              hoverColor={navHoverColor}
              ariaLabel="Your account"
            />
          ) : (
            <NavAction
              href="/login"
              label="Account"
              icon={<User className="w-[18px] h-[18px]" strokeWidth={1.8} />}
              dark={isDark}
              textColor={navTextColor}
              hoverColor={navHoverColor}
              ariaLabel="Account"
            />
          )}

          <NavAction
            onClick={toggleCart}
            label={`Cart (${itemCount})`}
            icon={
              <span className={`relative inline-flex transition-transform duration-300 ${cartBump ? "scale-125" : "scale-100"}`}>
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.8} />
                {itemCount > 0 && (
                  <span className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold tabular-nums ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
                    {itemCount}
                  </span>
                )}
              </span>
            }
            dark={isDark}
            textColor={navTextColor}
            hoverColor={navHoverColor}
            ariaLabel={`Cart, ${itemCount} items`}
          />
        </nav>

        {/* Mobile top bar */}
        <div className={`flex lg:hidden items-center justify-between w-full ${navTextColor} pointer-events-auto transition-colors duration-200`}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`${navTextColor} ${navHoverColor} transition-colors cursor-pointer text-xs font-medium tracking-tight flex items-center gap-2 p-1`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
              <span className={`absolute h-[1.5px] w-4 bg-current transition-all duration-300 ${isMobileMenuOpen ? "rotate-45" : "-translate-y-[4px]"}`} />
              <span className={`absolute h-[1.5px] w-4 bg-current transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45" : "translate-y-[4px]"}`} />
            </span>
            <span>Menu</span>
          </button>

          <Link href="/" className="group/logo hover:opacity-75 transition-opacity">
            <span className="sr-only">BAGIFYYYY Home</span>
            <span className="relative inline-block overflow-hidden transition-transform duration-300 group-hover/logo:scale-[1.03]">
              <Image
                src="/bagifyyyy-wordmark-animated.gif"
                alt="BAGIFYYYY Logo"
                width={1024}
                height={265}
                unoptimized
                className={`h-auto w-[120px] object-contain transition-all duration-300 ${logoFilter}`}
              />
              <span
                className="pointer-events-none absolute inset-0 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover/logo:translate-x-[110%]"
                aria-hidden="true"
              />
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <SearchOverlay variant="icon" />
            <button
              type="button"
              onClick={toggleCart}
              className={`${navTextColor} ${navHoverColor} transition-colors cursor-pointer text-xs font-medium`}
              aria-label={`Cart, ${itemCount} items`}
            >
              <span className={`inline-block transition-transform duration-300 ${cartBump ? "scale-125" : "scale-100"}`}>
                Cart ({itemCount})
              </span>
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
                   className="fixed inset-y-0 left-0 z-[9999] w-[86vw] max-w-sm sm:w-[70vw] sm:max-w-md bg-[#f5f5f2] text-black border-r border-black/10 flex flex-col lg:hidden h-[100dvh]"
                >
                  <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-black/[0.08] shrink-0">
                    <Image
                      src="/bagifyyyy-wordmark-animated.gif"
                      alt="BAGIFYYYY Logo"
                      width={845}
                      height={219}
                      unoptimized
                      className="h-auto w-[110px] sm:w-[120px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-black/60 hover:text-black active:text-black transition-colors cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="flex flex-col px-5 sm:px-6 py-5 sm:py-6 gap-5 sm:gap-6 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      {[
                        { href: "/new-arrivals", label: "New in" },
                         { href: "/topwears", label: "Tops" },
                         { href: "/bottomwears", label: "Bottoms" },
                        { href: "/accessories", label: "Accessories" },
                        { href: "/bundles", label: "Bundles" },
                        { href: "/wishlist", label: "Wishlist" },
                      ].map(({ href, label }, i) => (
                        <motion.span
                          key={href}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.12 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="block"
                        >
                          <Link
                            href={href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-[17px] sm:text-lg font-normal tracking-tight text-black hover:opacity-60 active:opacity-40 transition-opacity flex items-center justify-between py-2.5 min-h-[44px] group/drawer-link"
                          >
                            <span>{label}</span>
                            <span className="text-black/30 text-xs transition-transform duration-300 group-hover/drawer-link:translate-x-1 group-active/drawer-link:translate-x-1">→</span>
                          </Link>
                        </motion.span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 px-1 py-2 text-[12px] sm:text-[11px] font-medium tracking-tight text-black/70">
                      <Link href="/track" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-black active:text-black transition-colors py-2 min-h-[44px] flex items-center">
                        Track Order
                      </Link>
                      <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-black active:text-black transition-colors py-2 min-h-[44px] flex items-center">
                        Contact
                      </Link>
                    </div>
                  </nav>

                  <div className="px-5 sm:px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-black/[0.08] shrink-0">
                    {isAuthenticated ? (
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-black/10 text-[12px] font-medium tracking-tight text-black hover:bg-black/5 active:bg-black/10 transition-colors"
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
