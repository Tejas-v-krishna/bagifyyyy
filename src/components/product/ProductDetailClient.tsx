"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import Button from "@/components/ui/Button";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import NotifyMeSection from "@/components/product/NotifyMeSection";
import ReviewSection from "@/components/product/ReviewSection";
import SimilarProducts from "@/components/product/SimilarProducts";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { Clock, Heart, ChevronLeft, ChevronRight, Star, Minus, Plus, Truck, ShieldCheck, Package, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { triggerPinataBurst } from "@/lib/confetti";
import type { ProductForDisplay } from "@/lib/product";

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

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const wishlisted = isInWishlist(id);
  const productImages = product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean) as string[];
  const touchStartX = useRef<number | null>(null);

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
  const isHeld = isReservedInCheckout && !product.isSoldOut;
  const canAddSelectedVariant =
    (!hasVariants || Boolean(selectedVariant && selectedVariant.stock > 0)) && !isHeld;
  const maxQuantity = Math.max(1, Math.min(10, selectedVariant?.stock ?? 10));

  const msLeft = reservationExpiresAt
    ? Math.max(0, new Date(reservationExpiresAt).getTime() - nowTick)
    : 0;
  const countdownStr = formatCountdown(msLeft);

  const rating = product.rating;
  const hasRating = Boolean(rating && rating.count > 0);

  useEffect(() => {
    let cancelled = false;

    const checkStockReservation = async () => {
      try {
        const inOurCart = useCartStore.getState().items.find((i) => i.id === product.id);
        if (inOurCart && inOurCart.holdExpiresAt && inOurCart.holdExpiresAt > Date.now()) {
          setIsReservedInCheckout(true);
          setHeldByYou(true);
          setReservationExpiresAt(new Date(inOurCart.holdExpiresAt).toISOString());
          return;
        }

        const response = await fetch(`/api/stock-status?productId=${product.id}`);
        if (response.ok && !cancelled) {
          const data = await response.json();
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

    checkStockReservation();
    const interval = window.setInterval(checkStockReservation, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [product.id]);

  // Live second-by-second countdown timer. When 0:00 is reached, release back to page!
  useEffect(() => {
    if (!isReservedInCheckout || !reservationExpiresAt) return;
    const ticker = window.setInterval(() => {
      const now = Date.now();
      const target = new Date(reservationExpiresAt).getTime();
      if (target - now <= 0) {
        // 5-minute hold expired! Return piece back to the shop
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

    const expiryTime = Date.now() + 5 * 60 * 1000;
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
    // Immediately trigger the 5-minute hold and live countdown right when user clicks
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
    <div className="w-full bg-white text-y2k-gunmetal min-h-screen pb-24">
      <div className="max-w-[1480px] mx-auto px-6 sm:px-10 lg:px-16 pt-6 lg:pt-8">

        {/* Back Button */}
        <div className="mb-6">
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
        </div>

        {/* ── Main Grid: Gallery (left) + Buy panel (right) ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,400px)] gap-10 xl:gap-16 items-start">

          {/* ── LEFT: Gallery ─────────────────────────────────────────────── */}
          <div className="min-w-0 pb-8">
            <div
              className="relative h-[58vh] w-full overflow-hidden rounded-lg bg-[#F2F2F2] touch-pan-y select-none sm:h-[64vh] lg:h-[74vh]"
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
                    initial={{ opacity: 0, x: 48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -48 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
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
                      className={`object-contain object-center pointer-events-none transition-all ${
                        product.isSoldOut ? "blur-[3px] opacity-50 grayscale" : ""
                      }`}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/30">
                  Image unavailable
                </div>
              )}

              {/* Sold Out / Somebody Bought This Overlay in Main Gallery */}
              {product.isSoldOut && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/45 backdrop-blur-[6px] select-none pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 text-black shadow-2xl">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
                      Somebody bought this
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] sm:text-[11px] font-mono text-white/90 uppercase tracking-[0.16em] font-medium drop-shadow-sm">
                    Out of stock · Unique 1 of 1 piece
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
              <div className="mt-3 relative z-10 flex justify-center gap-2 px-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={activeImageIndex === idx}
                    className={`relative h-18 w-14 shrink-0 overflow-hidden rounded-[3px] bg-[#f2f2f2] transition-all cursor-pointer ${
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
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Live 5-Minute Hold Countdown Banner under the images */}
            {isReservedInCheckout && !product.isSoldOut && (
              <div className="mt-4 w-full rounded-xl border border-[#e4dec8] bg-[#fbf9f4] p-3.5 sm:p-4 text-black shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4a838] opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#cda434]" />
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-black leading-tight">
                        {heldByYou ? "Reserved In Your Bag" : "In Someone's Bag · On Hold"}
                      </h4>
                      <p className="text-[10.5px] text-black/55 font-normal leading-tight mt-0.5">
                        {heldByYou
                          ? "Held for 5 minutes · Complete checkout before 00:00"
                          : "Held for 5 minutes · Returns to store if session expires"}
                      </p>
                    </div>
                  </div>

                  {/* Digital Clock Box: 05:00 */}
                  <div className="flex items-center font-mono font-bold text-xs sm:text-sm bg-black/[0.04] border border-black/10 text-black px-3 py-1 rounded-md tracking-widest shadow-2xs shrink-0 select-none">
                    <span>{countdownStr}</span>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="w-full bg-black/[0.05] rounded-full h-1 overflow-hidden mt-3">
                  <div
                    className="bg-[#cda434]/70 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, (msLeft / (5 * 60 * 1000)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Hold Expired Notice under images (When countdown reaches 00:00 idle) */}
            {idleExpired && !isReservedInCheckout && !product.isSoldOut && (
              <div className="mt-4 w-full rounded-xl border border-black/10 bg-[#f5f5f3] p-3.5 text-black shadow-2xs animate-in fade-in duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-black">
                        Reservation Expired (Idle) · Piece Back In Store
                      </p>
                      <p className="text-[10.5px] text-black/55 mt-0.5 leading-snug">
                        Since the 5-minute hold reached 00:00 without checkout, this 1-of-1 piece has returned to store stock and is available to add again.
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
          </div>

          {/* ── RIGHT: Sticky buy panel ───────────────────────────────────── */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            {/* 1 of 1 unique piece pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/10 text-black mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-[0.16em]">
                1 of 1 Unique Piece · Only 1 Available
              </span>
            </div>

            <h1 className="mt-1 text-[30px] sm:text-[36px] font-bold leading-[1.02] tracking-[-0.02em] text-y2k-gunmetal uppercase">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              {hasRating ? (
                <>
                  <RatingStars value={rating.average ?? 0} />
                  <a href="#reviews" className="text-xs text-black/55 hover:text-black hover:underline transition-colors">
                    {rating.average?.toFixed(1)} ({rating.count} {rating.count === 1 ? "review" : "reviews"})
                  </a>
                </>
              ) : (
                <a href="#reviews" className="text-xs text-black/55 hover:text-black hover:underline transition-colors">
                  No reviews yet. Be the first
                </a>
              )}
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <p className="text-[26px] font-bold tracking-[-0.02em] text-y2k-gunmetal">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <p className="text-base text-black/35 line-through">
                  ₹{product.compareAtPrice.toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* 1 of 1 uniqueness guarantee note */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#f8f8f9] border border-black/[0.08] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 text-base select-none">
                ✨
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-tight text-black leading-snug">
                  Authentic 1-of-1 Thrift Piece
                </p>
                <p className="text-[10px] font-mono text-black/60 tracking-[0.02em] mt-0.5 leading-relaxed">
                  Only 1 piece in stock. Every item on BAGIFY is an authentic single-piece original. Once purchased, it will never be restocked.
                </p>
              </div>
            </div>

            {selectionError && (
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-600" role="alert">
                {selectionError}
              </p>
            )}

            {/* Sizes: Only shown when 2 or more sizes are available */}
            {product.sizes.length > 1 && (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
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
                        className={`min-h-10 min-w-10 cursor-pointer border px-3 text-[11px] font-mono font-bold uppercase tracking-[0.08em] transition-colors ${
                          selected
                            ? "border-black bg-black text-white"
                            : live
                              ? "border-black/15 bg-white text-black hover:border-black"
                              : "border-black/10 bg-transparent text-black/30 line-through"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + CTA */}
            {product.isSoldOut ? (
              <div className="mt-7 space-y-4">
                <div className="p-4 rounded-xl bg-black/[0.04] border border-black/15 text-center space-y-1.5 backdrop-blur-xs">
                  <span className="inline-flex items-center gap-1.5 bg-black text-white text-[9.5px] font-mono font-bold uppercase tracking-[0.16em] px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Somebody bought this
                  </span>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-black pt-1">
                    Out of stock · 1-of-1 Piece Sold
                  </p>
                  <p className="text-[10px] font-mono text-black/50 leading-relaxed">
                    This thrift piece was a unique single original and is no longer available.
                  </p>
                </div>
                <NotifyMeSection productId={product.id} />
              </div>
            ) : isHeld ? (
              <div className="mt-7 flex items-center gap-2">
                {heldByYou ? (
                  <Button
                    onClick={openCart}
                    variant="dark"
                    className="flex-1 text-[10.5px] uppercase tracking-[0.16em]"
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
                    className="flex-1 rounded-full border border-black/10 bg-black/[0.03] text-black/40 px-5 py-3 text-[10.5px] font-medium uppercase tracking-[0.16em] flex items-center justify-between cursor-not-allowed"
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
                  className="w-12 h-12 rounded-full border border-y2k-gunmetal/20 flex items-center justify-center hover:border-y2k-gunmetal transition-colors cursor-pointer shrink-0"
                >
                  <Heart
                    className={`w-4 h-4 ${wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : "text-y2k-gunmetal"}`}
                  />
                </button>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <motion.div whileTap={{ scale: 0.96 }} className="relative flex-1">
                    <Button
                      onClick={(e) => handleAddToCart(e)}
                      disabled={!canAddSelectedVariant}
                      className={`w-full text-[10.5px] uppercase tracking-[0.18em] transition-all duration-300 relative ${
                        addedAnimation
                          ? "!bg-black !text-white scale-[1.01]"
                          : "active:scale-[0.98]"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {addedAnimation ? (
                          <motion.span
                            key="added"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="flex items-center gap-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            <span>ADDED TO BAG</span>
                            <Check className="h-4 w-4 text-white stroke-[3] animate-bounce" aria-hidden="true" />
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
                          initial={{ opacity: 0, y: 0, scale: 0.7 }}
                          animate={{ opacity: 1, y: -36, scale: 1 }}
                          exit={{ opacity: 0, y: -50, scale: 0.8 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
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
                    className="w-[44px] h-[44px] rounded-full border border-y2k-gunmetal/20 flex items-center justify-center hover:border-y2k-gunmetal transition-colors cursor-pointer shrink-0 active:scale-90"
                  >
                    <Heart
                      className={`w-4 h-4 ${wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : "text-y2k-gunmetal"}`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-y border-black/8 py-3.5">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Package className="w-3.5 h-3.5 text-black/40" aria-hidden="true" />
                <span className="text-[8.5px] font-mono uppercase tracking-[0.12em] text-black/60 leading-tight">
                  {product.isSoldOut ? "Somebody bought this" : "1 of 1 · Single piece"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Truck className="w-3.5 h-3.5 text-black/40" aria-hidden="true" />
                <span className="text-[8.5px] font-mono uppercase tracking-[0.12em] text-black/45 leading-tight">
                  Ships in 24–48 hrs
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-black/40" aria-hidden="true" />
                <span className="text-[8.5px] font-mono uppercase tracking-[0.12em] text-black/45 leading-tight">
                  Secure checkout
                </span>
              </div>
            </div>

            {/* Accordions */}
            <div className="mt-1">
              <Accordion title="Details & fit" defaultOpen>
                <ul className="space-y-1.5 pt-0.5">
                  {detailBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 uppercase tracking-[0.06em] text-[11px] font-mono text-black/60">
                      <span className="shrink-0 text-black/30 select-none" aria-hidden="true">—</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Shipping & returns">
                <p className="text-[12px] leading-relaxed text-black/60">
                  Dispatched within 24–48 hours. Standard delivery across India takes 3–5 business
                  days. All sales are final. Many pieces are one-off vintage or small-run, so check
                  the measurements and photos before ordering.
                </p>
                <p className="mt-2.5 text-[11px] font-mono uppercase tracking-[0.08em] text-black/50">
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

        <ReviewSection productId={id} />

        <div className="mt-20 border-t border-y2k-gunmetal/10 pt-10">
          <RecentlyViewed productId={id} />
        </div>

      </div>

      {/* ── Mobile Sticky Buy Bar ───────────────────────────────────────────── */}
      {!product.isSoldOut && mounted && createPortal(
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-y2k-gunmetal/10 p-4 flex lg:hidden items-center justify-between gap-4 shadow-xl">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.12em] truncate text-y2k-gunmetal">{product.name}</p>
            <p className="font-bold text-base tracking-tight text-y2k-gunmetal">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
           <motion.div whileTap={{ scale: 0.94 }} className="shrink-0">
             {isHeld && heldByYou ? (
               <Button
                 onClick={openCart}
                 className="shrink-0 text-[10px] uppercase tracking-[0.16em] font-bold !bg-black !text-white flex items-center gap-1.5 shadow-sm"
               >
                 <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
                 <span>VIEW IN BAG</span>
               </Button>
             ) : (
               <Button
                 onClick={(e) => handleAddToCart(e)}
                 disabled={!canAddSelectedVariant}
                 className={`shrink-0 text-[10px] uppercase tracking-[0.18em] transition-all font-bold ${
                   addedAnimation ? "!bg-emerald-600 !text-white scale-[1.02]" : ""
                 }`}
               >
                 <AnimatePresence mode="wait">
                   {addedAnimation ? (
                     <motion.span
                       key="m-added"
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0 }}
                       className="flex items-center gap-1.5"
                     >
                       <span>ADDED</span>
                       <Check className="h-3.5 w-3.5 stroke-[3] animate-bounce" aria-hidden="true" />
                     </motion.span>
                   ) : (
                     <motion.span
                       key="m-add"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="flex items-center gap-1.5"
                     >
                       <span>ADD TO BAG</span>
                       <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                     </motion.span>
                   )}
                 </AnimatePresence>
               </Button>
             )}
           </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" role="img" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= Math.round(value) ? "fill-black text-black" : "text-black/20"}`}
          aria-hidden="true"
        />
      ))}
    </span>
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
    <div className="border-b border-black/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-3.5 text-left"
      >
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/90">{title}</span>
        <Plus className={`h-3.5 w-3.5 text-black/45 transition-transform duration-300 ${open ? "rotate-45" : ""}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-[12px] leading-[1.65] text-black/60">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
