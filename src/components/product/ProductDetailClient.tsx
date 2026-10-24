"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import Button from "@/components/ui/Button";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import CustomerReviews from "@/components/product/CustomerReviews";
import NotifyMeSection from "@/components/product/NotifyMeSection";
import SimilarProducts from "@/components/product/SimilarProducts";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { Clock, Heart, ChevronLeft, ChevronRight, Star, Minus, Plus, Truck, ShieldCheck, Check, ArrowRight, ArrowLeft, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { triggerPinataBurst } from "@/lib/confetti";
import type { ProductForDisplay } from "@/lib/product";
import ProductShareModal from "@/components/product/ProductShareModal";

/**
 * Reference-style product detail page:
 *   Gallery (left) + sticky buy panel (right): rating, price, sizes,
 *   quantity, CTA, trust badges, accordions.
 *   Below: related pieces, reviews with summary, recently viewed.
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function ProductDetailClient({ product }: { product: ProductForDisplay }) {
  const router = useRouter();
  const id = product.id;
  const firstAvailableVariant =
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];

  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(categoryHref(product.category));
    }
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(
    firstAvailableVariant?.size ?? product.sizes[0] ?? ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    firstAvailableVariant?.color ?? product.colors[0] ?? ""
  );
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [isReservedInCheckout, setIsReservedInCheckout] = useState(false);
  const [heldByYou, setHeldByYou] = useState(false);
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [idleExpired, setIdleExpired] = useState(false);
  const [isSoldOutLive, setIsSoldOutLive] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const effectiveSoldOut =
    product.isSoldOut ||
    isSoldOutLive ||
    (product.variants.length > 0 && product.totalStock <= 0);

  // Check if current user already has this product in cart
  const cartItem = useCartStore((state) => state.items.find((i) => i.id === product.id));

  // Sync immediately with cart item if present
  useEffect(() => {
    if (cartItem && cartItem.holdExpiresAt && cartItem.holdExpiresAt > Date.now()) {
      setIsReservedInCheckout(true);
      setHeldByYou(true);
      setReservationExpiresAt(new Date(cartItem.holdExpiresAt).toISOString());
    }
  }, [cartItem]);

  // Purge from cart immediately if piece is sold out or acquired by another collector
  useEffect(() => {
    if (effectiveSoldOut) {
      useCartStore.getState().removeItem(product.id);
    }
  }, [effectiveSoldOut, product.id]);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const wishlisted = isInWishlist(id);
  const productImages = product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean) as string[];
  const touchStartX = useRef<number | null>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  // Mobile peek carousel index (segment bar + arrows).
  const [mobileIndex, setMobileIndex] = useState(0);
  const scrollMobileTo = (idx: number) => {
    if (productImages.length === 0) return;
    const clamped = ((idx % productImages.length) + productImages.length) % productImages.length;
    setMobileIndex(clamped);
    mobileTrackRef.current
      ?.querySelectorAll(":scope > div")[clamped]
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };
  const handleMobileScroll = () => {
    const track = mobileTrackRef.current;
    const first = track?.querySelector(":scope > div") as HTMLElement | null;
    if (!track || !first || productImages.length === 0) return;
    const step = first.offsetWidth + 8;
    setMobileIndex(Math.min(productImages.length - 1, Math.max(0, Math.round(track.scrollLeft / step))));
  };

  const goToImage = (idx: number) => {
    if (productImages.length === 0) return;
    setActiveImageIndex(((idx % productImages.length) + productImages.length) % productImages.length);
  };
  const goToNextImage = () => goToImage(activeImageIndex + 1);
  const goToPrevImage = () => goToImage(activeImageIndex - 1);
  const hasVariants = product.variants.length > 0;
  const selectedVariant = product.variants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor
  );
  const isHeld = !effectiveSoldOut && isReservedInCheckout;
  const canAddSelectedVariant =
    !effectiveSoldOut &&
    (!hasVariants || Boolean(selectedVariant && selectedVariant.stock > 0)) &&
    !isHeld;
  const maxQuantity = Math.max(1, Math.min(10, selectedVariant?.stock ?? 10));

  const msLeft = reservationExpiresAt
    ? Math.max(0, new Date(reservationExpiresAt).getTime() - nowTick)
    : 0;
  const countdownStr = formatCountdown(msLeft);
  const holdProgressPct = Math.min(100, Math.max(0, (msLeft / (2 * 60 * 1000)) * 100));
  const holdExpiringSoon = msLeft > 0 && msLeft <= 30_000;

  useEffect(() => {
    // If already known as sold out, don't poll
    if (product.isSoldOut) {
      setIsSoldOutLive(true);
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;

    const checkStockReservation = async () => {
      // Don't poll in the background if the user switched tabs
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const response = await fetch(`/api/stock-status?productId=${product.id}`);
        if (response.ok && !cancelled) {
          const data = await response.json();
          if (data.isSoldOut) {
            setIsSoldOutLive(true);
            setIsReservedInCheckout(false);
            setHeldByYou(false);
            setReservationExpiresAt(null);
            useCartStore.getState().removeItem(product.id);
            // Stop polling permanently once sold out
            if (timerId !== null) {
              window.clearInterval(timerId);
              timerId = null;
            }
            return;
          } else {
            setIsSoldOutLive(false);
          }

          const inOurCart = useCartStore.getState().items.find((i) => i.id === product.id);
          if (inOurCart && inOurCart.holdExpiresAt && inOurCart.holdExpiresAt > Date.now()) {
            setIsReservedInCheckout(true);
            setHeldByYou(true);
            setReservationExpiresAt(new Date(inOurCart.holdExpiresAt).toISOString());
            return;
          }

          if (data.isReserved) {
            setIsReservedInCheckout(true);
            setHeldByYou(Boolean(data.heldByYou));
            setReservationExpiresAt(typeof data.expiresAt === "string" ? data.expiresAt : null);
          } else {
            setIsReservedInCheckout(false);
            setHeldByYou(false);
            setReservationExpiresAt(null);
          }
        }
      } catch {
        // Reservation status is informational
      }
    };

    // Initial check on mount
    checkStockReservation();

    // EMERGENCY: Poll every 5 minutes to cut CPU. The on-screen countdown
    // ticks locally every second, so this only delays the hold badge, never
    // the timer. Revert to 60s once Vercel CPU is back under control.
    timerId = window.setInterval(checkStockReservation, 300000);

    // Immediately refresh when the shopper switches back to this tab
    const handleVisibilityChange = () => {
      if (!document.hidden && !cancelled) {
        checkStockReservation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [product.id, product.isSoldOut]);

  // Live second-by-second countdown timer. When 0:00 is reached, release back to page!
  useEffect(() => {
    if (!isReservedInCheckout || !reservationExpiresAt) return;
    const ticker = window.setInterval(() => {
      const now = Date.now();
      const target = new Date(reservationExpiresAt).getTime();
      if (target - now <= 0) {
        // 2-minute hold expired! Return piece back to the shop
        setIsReservedInCheckout(false);
        setHeldByYou(false);
        setReservationExpiresAt(null);
        useCartStore.getState().removeItem(product.id);
        setIdleExpired(true);
      } else {
        setNowTick(now);
      }
    }, 1000);
    return () => window.clearInterval(ticker);
  }, [isReservedInCheckout, reservationExpiresAt, product.id]);

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    const pairOk = product.variants.some(
      (v) => v.size === size && v.color === selectedColor && v.stock > 0
    );
    if (!pairOk) {
      const fallback =
        product.variants.find((v) => v.size === size && v.stock > 0) ??
        product.variants.find((v) => v.size === size);
      if (fallback) setSelectedColor(fallback.color);
    }
    setQuantity(1);
    setSelectionError("");
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (!canAddSelectedVariant) {
      setSelectionError("This piece is no longer available.");
      return;
    }

    // Trigger joyful Piñata confetti burst right at the user's click location!
    triggerPinataBurst(e);

    const expiryTime = Date.now() + 2 * 60 * 1000;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.compareAtPrice ?? null,
      image: productImages[activeImageIndex] || productImages[0] || "/placeholder.jpg",
      quantity: 1,
      size: selectedSize || (product.sizes?.[0] ?? "One Size"),
      color: selectedColor || (product.colors?.[0] ?? "Default"),
      addedAt: Date.now(),
      holdExpiresAt: expiryTime,
    });
    // Immediately trigger the 2-minute hold and live countdown right when user clicks
    setIdleExpired(false);
    setIsReservedInCheckout(true);
    setHeldByYou(true);
    setReservationExpiresAt(new Date(expiryTime).toISOString());
    setNowTick(Date.now());
    setSelectionError("");
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1600);
  };

  // Turn the product description into short detail bullets.
  const detailBullets: string[] = [];
  if (product.description) {
    // Split on sentence boundaries or commas for bullet formatting
    const rawBullets = product.description
      .split(/[.;\n]/)
      .map((s) => s.trim().replace(/^[,\s]+/, ""))
      .filter((s) => s.length > 4);
    detailBullets.push(...rawBullets.slice(0, 5));
  }
  if (detailBullets.length === 0) {
    detailBullets.push(
      "Relaxed fit",
      "Heavyweight construction",
      "Unisex fit"
    );
  }

  return (
    <div className="w-full bg-white text-y2k-gunmetal min-h-screen">
      <div className="max-w-[1480px] mx-auto px-6 sm:px-10 lg:px-16 pt-0 lg:pt-8">

        {/* Back Button & Share Pill — desktop only, mobile uses gallery overlay */}
        <div className="mb-6 hidden items-center justify-between lg:flex">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-y2k-gunmetal/70 hover:text-y2k-gunmetal transition-colors py-1 cursor-pointer"
            aria-label={`Go back to ${categoryLabel(product.category)}`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-black/5 group-hover:bg-black group-hover:text-white transition-all">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            </span>
            <span>BACK</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] hover:bg-black hover:text-white px-3.5 py-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-black/70 transition-all cursor-pointer shadow-2xs"
            aria-label="Share this piece"
          >
            <Share2 className="h-3.5 w-3.5 text-black group-hover:text-white transition-colors" />
            <span>SHARE</span>
          </button>
        </div>

        {/* ── Main Grid: Gallery (left) + Buy panel (right) ─────────────────── */}
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,400px)] lg:gap-10 xl:gap-16 items-start">

          {/* ── MOBILE: full-bleed peek carousel with overlay actions ─────── */}
          <div className="relative -mx-6 sm:-mx-10 lg:hidden">
            <div
              ref={mobileTrackRef}
              onScroll={handleMobileScroll}
              className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0 pb-6 pt-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {productImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-[#e9e9ec]"
                >
                  <Image
                    src={img}
                    alt={idx === 0 ? product.name : `${product.name} view ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    draggable={false}
                    sizes="80vw"
                    className={`object-cover object-center rounded-2xl ${
                      effectiveSoldOut ? "blur-[3px] opacity-50 grayscale" : ""
                    }`}
                  />
                  {effectiveSoldOut && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/45 p-4 text-center">
                      <span className="rounded-full bg-white/95 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black">
                        Already gone
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Top overlay: back left, share + wishlist right */}
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex items-center justify-between px-5">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  aria-label="Share this piece"
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleItem(id)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-black" : ""}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Side arrows */}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollMobileTo(mobileIndex - 1)}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollMobileTo(mobileIndex + 1)}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}

            {/* Segment progress */}
            {productImages.length > 1 && (
              <div className="mt-2 flex items-center justify-center gap-1.5 px-6" aria-hidden="true">
                {productImages.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-[3px] rounded-full transition-all ${
                      idx === mobileIndex ? "w-6 bg-black" : "w-3 bg-black/15"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── DESKTOP: Gallery (Image itself is the card) ─────────────────── */}
          <div className="hidden min-w-0 p-2 pb-8 lg:block">
            <div
              className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-[#e9e9ec] touch-pan-y select-none isolate"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
                const deltaX = endX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(deltaX) < 40 || productImages.length < 2) return;
                if (deltaX < 0) goToNextImage();
                else goToPrevImage();
              }}
            >
              {productImages.length > 0 ? (
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={activeImageIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl"
                    drag={productImages.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.6}
                    onDragEnd={(_, info) => {
                      if (productImages.length < 2) return;
                      if (info.offset.x < -60 || info.velocity.x < -300) goToNextImage();
                      else if (info.offset.x > 60 || info.velocity.x > 300) goToPrevImage();
                    }}
                  >
                    <Image
                      src={productImages[activeImageIndex] || productImages[0]}
                      alt={product.name}
                      fill
                      priority
                      draggable={false}
                      sizes="(max-width: 1023px) 100vw, 60vw"
                      className={`object-cover object-center pointer-events-none transition-all duration-300 rounded-2xl sm:rounded-3xl ${
                        effectiveSoldOut ? "blur-[3px] opacity-50 grayscale" : ""
                      }`}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/30">
                  Image unavailable
                </div>
              )}

              {/* Sold Out / Already Gone Overlay in Main Gallery */}
              {effectiveSoldOut && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/45 backdrop-blur-[6px] select-none pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 text-black shadow-2xl">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
                      THIS PIECE IS ALREADY GONE
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] sm:text-[11px] font-mono text-white/90 uppercase tracking-[0.16em] font-medium drop-shadow-sm">
                    Sold Out · Single Original
                  </p>
                </div>
              )}

              {/* Prev / next arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    aria-label="Previous image"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-black/10 flex items-center justify-center text-black shadow-sm hover:bg-white active:scale-95 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    aria-label="Next image"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-black/10 flex items-center justify-center text-black shadow-sm hover:bg-white active:scale-95 transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                  {/* Counter - docked top-right, clear of the thumbnails */}
                  <span className="absolute right-3 top-3 z-10 text-[10px] font-mono tracking-[0.14em] text-black/70 bg-white/85 backdrop-blur px-2.5 py-1 rounded-full border border-black/10">
                    {activeImageIndex + 1} / {productImages.length}
                  </span>
                </>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="mt-3 relative z-10 hidden justify-center gap-2 px-1 lg:flex">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={activeImageIndex === idx}
                    className={`product-thumb-btn relative h-18 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#f2f2f2] transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "ring-1.5 ring-black opacity-100 shadow-xs"
                        : "opacity-60 hover:opacity-100 border border-black/10"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover object-center rounded-[10px]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sticky buy panel ───────────────────────────────────── */}
          <aside className="mt-4 min-w-0 lg:mt-0 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">
              {categoryLabel(product.category)} · Single original
            </p>
            <div className="mt-1.5 flex items-start justify-between gap-4">
              <h1 className="min-w-0 flex-1 text-[20px] sm:text-[24px] lg:text-[34px] font-display font-bold leading-[1.1] tracking-[-0.02em] text-black uppercase">
                {product.name}
              </h1>
              <div className="shrink-0 text-right">
                <p className="text-[20px] sm:text-[24px] lg:text-[30px] font-mono font-bold tracking-tight text-black leading-none">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
                {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                  <p className="mt-1 flex items-center justify-end gap-1.5">
                    <span className="text-xs font-mono text-black/35 line-through">
                      ₹{product.compareAtPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.08em] text-white">
                      Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                    </span>
                  </p>
                )}
              </div>
            </div>
            {product.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-black/60 line-clamp-2">
                {product.description}
              </p>
            )}

            {selectionError && (
              <p className="mt-4 text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-red-600" role="alert">
                {selectionError}
              </p>
            )}

            {/* The size + CTA row lives in the sticky bottom action bar
                (see the end of this component) so share / wishlist /
                ADD TO BAG stay reachable on every screen size. */}

            {/* Sizes: Only shown when 2 or more sizes are available — desktop */}
            {product.sizes.length > 1 && (
              <div className="mt-6 hidden lg:block">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-black">
                    Select size{selectedSize ? <span className="text-black/45">: {selectedSize}</span> : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const live = product.variants.some((v) => v.size === size && v.stock > 0);
                    const selected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSelectSize(size)}
                        aria-pressed={selected}
                        className={`min-h-10 min-w-10 cursor-pointer rounded-lg border px-3 text-[11px] font-mono font-bold uppercase tracking-[0.08em] transition-colors ${
                          selected
                            ? "border-black bg-black text-white"
                            : live
                              ? "border-black/15 bg-white text-black hover:border-black"
                              : "border-black/10 bg-transparent text-black/25 line-through"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live 2-Minute Hold Countdown — dark hold ticket with a live timer */}
            {isReservedInCheckout && !product.isSoldOut && (
              <div
                className={`mt-5 w-full overflow-hidden rounded-2xl ${
                  heldByYou
                    ? "bg-[#101012] text-white ring-1 ring-white/10"
                    : "border border-black/10 bg-black/[0.03] text-black"
                }`}
              >
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                          heldByYou ? (holdExpiringSoon ? "bg-red-400" : "bg-[#C6A96B]") : "bg-black/25"
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${
                          heldByYou ? (holdExpiringSoon ? "bg-red-400" : "bg-[#C6A96B]") : "bg-black/30"
                        }`}
                      />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`truncate font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
                          heldByYou ? "text-white" : "text-black/70"
                        }`}
                      >
                        {heldByYou ? "Reserved in your bag" : "In someone's bag · on hold"}
                      </p>
                      <p
                        className={`mt-1 truncate text-[10.5px] leading-tight ${
                          heldByYou ? "text-white/45" : "text-black/45"
                        }`}
                      >
                        {heldByYou
                          ? "Checkout before time runs out"
                          : "Returns to store when the hold ends"}
                      </p>
                    </div>
                  </div>

                  {/* Live countdown — the ticket's hero digits */}
                  <div
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 font-mono text-[20px] font-bold leading-none tracking-[0.06em] tabular-nums sm:text-[23px] ${
                      heldByYou
                        ? holdExpiringSoon
                          ? "bg-red-400/10 text-red-300 ring-1 ring-red-400/30"
                          : "bg-white/[0.07] text-[#EBD9A9] ring-1 ring-white/10"
                        : "border border-black/10 bg-white text-black shadow-2xs"
                    }`}
                  >
                    {countdownStr}
                  </div>
                </div>

                {/* Draining progress bar along the bottom edge */}
                <div className={`h-[3px] w-full ${heldByYou ? "bg-white/[0.08]" : "bg-black/[0.07]"}`}>
                  <div
                    className={`h-full transition-[width] duration-1000 ease-linear ${
                      heldByYou ? (holdExpiringSoon ? "bg-red-400" : "bg-[#C6A96B]") : "bg-black/50"
                    }`}
                    style={{ width: `${holdProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Hold Expired Notice (When countdown reaches 00:00 idle) */}
            {idleExpired && !isReservedInCheckout && !product.isSoldOut && (
              <div className="mt-5 w-full rounded-xl border border-black/10 bg-[#f5f5f3] p-3.5 text-black shadow-2xs animate-in fade-in duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-black">
                        Reservation Expired (Idle) · Piece Back In Store
                      </p>
                      <p className="text-[10.5px] text-black/55 mt-0.5 leading-snug">
                        Since the 2-minute hold reached 00:00 without checkout, this 1-of-1 piece has returned to store stock and is available to add again.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIdleExpired(false)}
                    className="text-black/35 hover:text-black text-xs font-bold p-1 cursor-pointer shrink-0"
                    aria-label="Dismiss notice"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* CTA + Action area */}
            {effectiveSoldOut ? (
              <div className="mt-6 hidden space-y-3.5 lg:block">
                <div className="p-4 rounded-xl bg-black/[0.04] border border-black/10 text-center space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 bg-black text-white text-[9.5px] font-mono font-bold uppercase tracking-[0.16em] px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    THIS PIECE IS ALREADY GONE
                  </span>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-black pt-1">
                    Sold Out · 1-of-1 Archival Drop
                  </p>
                  <p className="text-[10px] font-mono text-black/50 leading-relaxed">
                    Another collector has acquired this unique piece. Every drop is a single original, so it will not be restocked.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled
                    className="flex-1 rounded-full border border-black/15 bg-black/[0.05] text-black/40 px-5 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.16em] flex items-center justify-center cursor-not-allowed select-none"
                  >
                    <span>PIECE ALREADY GONE · SOLD OUT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(id)}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="w-12 h-12 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-black transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${wishlisted ? "fill-black text-black" : "text-black"}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    aria-label="Share product"
                    className="w-12 h-12 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-black transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-black" />
                  </button>
                </div>

                <Link
                  href="/products"
                  className="block w-full text-center py-3 px-4 rounded-full bg-black text-white hover:bg-black/85 text-[11px] font-mono font-bold uppercase tracking-[0.14em] transition-colors"
                >
                  EXPLORE LIVE DROPS →
                </Link>

                <NotifyMeSection productId={product.id} />
              </div>
            ) : isHeld ? (
              <div className="mt-6 hidden items-center gap-2.5 lg:flex">
                {heldByYou ? (
                  <Button
                    onClick={openCart}
                    variant="dark"
                    className="flex-1 text-[11px] uppercase tracking-[0.16em]"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>IN YOUR BAG · VIEW BAG</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 rounded-full border border-black/10 bg-black/[0.03] text-black/40 px-5 py-3 text-[10.5px] font-mono font-bold uppercase tracking-[0.16em] flex items-center justify-between cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-black/35" />
                      <span>ON HOLD BY ANOTHER SHOPPER</span>
                    </div>
                    <span className="text-[9px] font-mono">1 OF 1</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleItem(id)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="w-12 h-12 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-black transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${wishlisted ? "fill-black text-black" : "text-black"}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  aria-label="Share product"
                  className="w-12 h-12 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-black transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-black" />
                </button>
              </div>
            ) : (
              <div className="mt-6 hidden flex-col gap-3 lg:flex">
                <div className="flex items-center gap-2.5">
                  <motion.div whileTap={{ scale: 0.97 }} className="relative flex-1">
                    <Button
                      onClick={(e) => handleAddToCart(e)}
                      disabled={!canAddSelectedVariant}
                      variant="dark"
                      className="w-full text-[11px] uppercase tracking-[0.16em]"
                    >
                      <AnimatePresence mode="wait">
                        {addedAnimation ? (
                          <motion.span
                            key="added"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2"
                          >
                            <span>ADDED TO BAG</span>
                            <Check className="h-4 w-4 text-white stroke-[2.5]" aria-hidden="true" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="add"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <span>ADD TO BAG</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>

                    {/* Floating "+1 IN YOUR BAG" micro-pill */}
                    <AnimatePresence>
                      {addedAnimation && (
                        <motion.div
                          initial={{ opacity: 0, y: 0, scale: 0.8 }}
                          animate={{ opacity: 1, y: -34, scale: 1 }}
                          exit={{ opacity: 0, y: -48, scale: 0.8 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-30 flex items-center gap-1 rounded-full bg-black text-white px-2.5 py-0.5 text-[9px] font-mono font-bold shadow-md uppercase tracking-wider border border-white/20"
                        >
                          <span>+1 IN YOUR BAG</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => toggleItem(id)}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="w-12 h-12 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-black transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${wishlisted ? "fill-black text-black" : "text-black"}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    aria-label="Share product"
                    className="w-12 h-12 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-black transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            )}

            {/* Trust row — desktop only, mobile stays minimal like reference */}
            <div className="mt-4 hidden items-center gap-3 py-2 lg:flex">
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-black/40">
                <Truck className="w-3 h-3 text-black/30" aria-hidden="true" />
                Ships in 24–48 hrs
              </span>
              <span className="h-3 w-px bg-black/10" aria-hidden="true" />
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-black/40">
                <ShieldCheck className="w-3 h-3 text-black/30" aria-hidden="true" />
                Secure checkout
              </span>
            </div>

            {/* Accordions */}
            <div className="mt-8 lg:mt-1">
              <Accordion title="Details & fit">
                <dl className="pt-1">
                  {detailBullets.map((bullet, i) => {
                    const parts = bullet.split(/[-:]/);
                    const label = (parts[0] ?? bullet).trim().toUpperCase();
                    const value = parts.slice(1).join("-").trim().replace(/^[,\s]+/, "");
                    return (
                      <div
                        key={i}
                        className="flex items-baseline justify-between gap-4 border-b border-black/5 py-2 last:border-b-0"
                      >
                        <dt className="text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-black/45">
                          {label}
                        </dt>
                        <dd className="text-[12px] font-mono uppercase tracking-[0.04em] text-black text-right">
                          {value || bullet}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </Accordion>
              <Accordion title="Shipping & returns">
                <p className="text-[12px] leading-relaxed text-black/60 pt-1 font-sans">
                  Dispatched within 24–48 hours. Standard delivery across India takes 3–5 business
                  days. All sales are final. Each piece is a one-off authentic vintage original, so please review measurements and details before ordering.
                </p>
                <p className="mt-2 text-[10.5px] font-mono uppercase tracking-[0.08em] text-black/50">
                  <Link href="/shipping" className="underline underline-offset-4 hover:text-black transition-colors">
                    Full delivery details
                  </Link>
                </p>
              </Accordion>
            </div>
          </aside>
        </div>

        {/* ── YOU MAY ALSO LIKE ─────────────────────────────────────────────── */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className="mb-8">
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-y2k-gunmetal uppercase">
                 YOU MIGHT LIKE
              </h2>
            </div>
            <SimilarProducts products={product.relatedProducts} />
          </div>
        )}

        <div className="mt-20">
          <CustomerReviews />
        </div>

        <div className="mt-20">
          <RecentlyViewed productId={id} showAll={true} />
        </div>

      </div>

      {/* ── Sticky action bar ────────────────────────────────────────────────
          Share / wishlist / ADD TO BAG (plus the size picker when the piece
          has multiple sizes) stay pinned to the bottom of the viewport on
          every screen size. It's `sticky` rather than `fixed` on purpose: it
          holds the viewport bottom while browsing, then settles into the page
          once the content ends, so the footer is never covered. */}
      <div className="sticky bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.07)]">
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-2 px-4 py-3 sm:px-6">
          {effectiveSoldOut ? (
            <button
              type="button"
              disabled
              className="w-full rounded-full border border-black/15 bg-black/[0.05] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-black/40 cursor-not-allowed"
            >
              Sold out
            </button>
          ) : (
            <>
              {product.sizes.length > 1 ? (
                <select
                  value={selectedSize}
                  onChange={(e) => handleSelectSize(e.target.value)}
                  aria-label="Choose size"
                  className="min-h-[52px] w-full max-w-[140px] appearance-none rounded-full border border-black/15 bg-white px-4 text-[12px] font-bold uppercase tracking-[0.1em] text-black outline-none"
                >
                  {product.sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    aria-label="Share this piece"
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black transition active:scale-95 cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(id)}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black transition active:scale-95 cursor-pointer"
                  >
                    <Heart className={`h-4 w-4 ${wishlisted ? "fill-black" : ""}`} aria-hidden="true" />
                  </button>
                </>
              )}
              {isHeld && heldByYou ? (
                <Button onClick={openCart} variant="dark" className="w-full flex-1 text-[11px] uppercase tracking-[0.14em]">
                  <span>View bag</span>
                </Button>
              ) : (
                <Button
                  onClick={(e) => handleAddToCart(e)}
                  disabled={!canAddSelectedVariant}
                  variant="dark"
                  className="w-full flex-1 text-[11px] uppercase tracking-[0.14em]"
                >
                  <span>{isHeld ? "On hold" : "Add to bag"}</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ProductShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        product={product}
      />
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-black/8 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-3.5 text-left group"
      >
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-black group-hover:text-black/70 transition-colors">{title}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-black/50 group-hover:text-black transition-colors">
          {open ? (
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-[12px] leading-[1.65] text-black/60 font-sans">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
