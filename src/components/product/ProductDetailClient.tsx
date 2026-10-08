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
import { Clock, Heart, ChevronLeft, ChevronRight, Star, Minus, Plus, Truck, ShieldCheck, Package } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductForDisplay } from "@/lib/product";

/**
 * Reference-style product detail page:
 *   Gallery (left) + sticky buy panel (right): rating, price, sizes,
 *   quantity, CTA, trust badges, accordions.
 *   Below: related pieces, reviews with summary, recently viewed.
 */
export default function ProductDetailClient({ product }: { product: ProductForDisplay }) {
  const id = product.id;
  const firstAvailableVariant =
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];

  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

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
  // Any active hold (yours or another shopper's) means the piece is
  // effectively taken until expiry — grey out the CTA.
  const isHeld = isReservedInCheckout && !product.isSoldOut;
  const canAddSelectedVariant =
    (!hasVariants || Boolean(selectedVariant && selectedVariant.stock > 0)) && !isHeld;
  const maxQuantity = Math.max(1, Math.min(10, selectedVariant?.stock ?? 10));
  const holdMinutesLeft = reservationExpiresAt
    ? Math.max(1, Math.ceil((new Date(reservationExpiresAt).getTime() - nowTick) / 60000))
    : null;

  const rating = product.rating;
  const hasRating = Boolean(rating && rating.count > 0);

  useEffect(() => {
    let cancelled = false;

    const checkStockReservation = async () => {
      try {
        // Hold identity rides in the server-minted HttpOnly cookie.
        const response = await fetch(`/api/stock-status?productId=${product.id}`);
        if (response.ok && !cancelled) {
          const data = await response.json();
          setIsReservedInCheckout(Boolean(data.isReserved));
          setHeldByYou(Boolean(data.heldByYou));
          setReservationExpiresAt(typeof data.expiresAt === 'string' ? data.expiresAt : null);
        }
      } catch {
        // Reservation status is informational; a failed poll must not block buying.
      }
    };

    checkStockReservation();
    const interval = window.setInterval(checkStockReservation, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [product.id]);

  // Live countdown while a hold is active, so the signal stays honest.
  useEffect(() => {
    if (!isReservedInCheckout || !reservationExpiresAt) return;
    const ticker = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(ticker);
  }, [isReservedInCheckout, reservationExpiresAt]);

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    // Keep the colour if that pair exists and is live, otherwise fall back to
    // the first live colour for the chosen size.
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

  const handleAddToCart = () => {
    if (!canAddSelectedVariant) {
      setSelectionError("This piece is no longer available.");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.compareAtPrice ?? null,
      image: productImages[activeImageIndex] || productImages[0] || "/placeholder.jpg",
      quantity: Math.max(1, Math.min(quantity, maxQuantity)),
      size: selectedSize || (product.sizes?.[0] ?? "One Size"),
      color: selectedColor || (product.colors?.[0] ?? "Default"),
    });
    setSelectionError("");
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
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

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-y2k-gunmetal/40 mb-6" aria-label="Breadcrumb">
          <Link href="/products" className="hover:text-y2k-gunmetal transition-colors">SHOP</Link>
          <span>/</span>
          <Link href={categoryHref(product.category)} className="hover:text-y2k-gunmetal transition-colors">
            {categoryLabel(product.category).toUpperCase()}
          </Link>
          <span>/</span>
          <span className="text-y2k-gunmetal/70 truncate max-w-[40vw]">{product.name.toUpperCase()}</span>
        </nav>

        {/* ── Main Grid: Gallery (left) + Buy panel (right) ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,400px)] gap-10 xl:gap-16 items-start">

          {/* ── LEFT: Gallery ─────────────────────────────────────────────── */}
          <div className="min-w-0">
            <div
              className="relative h-[58vh] w-full overflow-hidden rounded-[15px] bg-[#F2F2F2] touch-pan-y select-none sm:h-[64vh] lg:h-[74vh]"
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
                      className="object-contain object-center pointer-events-none"
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/30">
                  Image unavailable
                </div>
              )}

              {/* Prev / next arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    aria-label="Previous image"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 backdrop-blur border border-black/10 flex items-center justify-center text-black shadow-sm hover:bg-white active:scale-95 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    aria-label="Next image"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/90 backdrop-blur border border-black/10 flex items-center justify-center text-black shadow-sm hover:bg-white active:scale-95 transition cursor-pointer"
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
                  {/* Thumbnails - docked inside the frame */}
                  <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 px-4">
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        aria-label={`View image ${idx + 1}`}
                        aria-pressed={activeImageIndex === idx}
                        className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-[10px] bg-white/90 backdrop-blur transition-all cursor-pointer ${
                          activeImageIndex === idx
                            ? "ring-2 ring-black ring-offset-2 ring-offset-transparent"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-contain object-center p-1"
                        />
                      </button>
                    ))}
                  </div>
          </div>

          {/* ── RIGHT: Sticky buy panel ───────────────────────────────────── */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <h1 className="mt-2 text-[30px] sm:text-[36px] font-bold leading-[1.02] tracking-[-0.02em] text-y2k-gunmetal uppercase">
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
                  No reviews yet — be the first
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

            {/* Hold signal */}
            {isReservedInCheckout && !product.isSoldOut && (
              heldByYou ? (
                <div className="mt-5 flex items-center gap-3 border-2 border-black bg-black px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  <Clock className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                  <span>In your bag — Reserved for you{holdMinutesLeft ? ` · ${holdMinutesLeft}m left` : ""}</span>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3 border-2 border-amber-500 bg-amber-400 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black">
                  <Clock className="h-4 w-4 shrink-0 text-black" aria-hidden="true" />
                  <span>On hold — another collector has this{holdMinutesLeft ? ` (~${holdMinutesLeft}m left)` : ""}</span>
                </div>
              )
            )}

            {selectionError && (
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-600" role="alert">
                {selectionError}
              </p>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                    Select size{selectedSize ? <span className="text-black/45"> — {selectedSize}</span> : null}
                  </p>
                  <Link href="/size-guide" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/50 underline underline-offset-4 hover:text-black transition-colors">
                    Size guide
                  </Link>
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
                        className={`min-h-11 min-w-11 cursor-pointer border px-4 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
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
              <div className="mt-7">
                <NotifyMeSection productId={product.id} />
              </div>
            ) : isHeld ? (
              <div className="mt-7 flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="flex-1 cursor-not-allowed border border-black/10 bg-[#e8e8e8] px-5 py-4 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/40"
                >
                  <span>{heldByYou ? "RESERVED — IN YOUR BAG" : "ON HOLD — CHECK BACK SOON"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleItem(id)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="w-12 h-12 border border-y2k-gunmetal/20 flex items-center justify-center hover:border-y2k-gunmetal transition-colors cursor-pointer shrink-0"
                >
                  <Heart
                    className={`w-4 h-4 ${wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : "text-y2k-gunmetal"}`}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {/* Quantity stepper */}
                  <div className="flex h-[52px] items-center border border-black/15" aria-label="Quantity">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-full w-11 items-center justify-center text-black transition-colors hover:bg-black/5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      disabled={quantity >= maxQuantity}
                      aria-label="Increase quantity"
                      className="flex h-full w-11 items-center justify-center text-black transition-colors hover:bg-black/5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!canAddSelectedVariant}
                    className="flex-1 px-5 py-4 text-[10.5px] font-bold uppercase tracking-[0.18em]"
                  >
                    <span>{addedAnimation ? "✓ ADDED TO BAG" : "ADD TO BAG"}</span>
                    <span className="text-[11px]" aria-hidden="true">→</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleItem(id)}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="w-[52px] h-[52px] border border-y2k-gunmetal/20 flex items-center justify-center hover:border-y2k-gunmetal transition-colors cursor-pointer shrink-0"
                  >
                    <Heart
                      className={`w-4 h-4 ${wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : "text-y2k-gunmetal"}`}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-y border-black/10 py-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Package className="w-4 h-4 text-black" aria-hidden="true" />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/60 leading-tight">
                  {product.isSoldOut ? "Sold out" : "In stock now"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Truck className="w-4 h-4 text-black" aria-hidden="true" />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/60 leading-tight">
                  Ships in 24–48 hrs
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <ShieldCheck className="w-4 h-4 text-black" aria-hidden="true" />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/60 leading-tight">
                  Secure checkout
                </span>
              </div>
            </div>

            {/* Accordions */}
            <div className="mt-2 border-t border-black/10">
              <Accordion title="Details & fit" defaultOpen>
                <ul className="space-y-2">
                  {detailBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 uppercase tracking-[0.04em] text-[12px]">
                      <span className="shrink-0 mt-0.5" aria-hidden="true">—</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Shipping & returns">
                <p>
                  Dispatched within 24–48 hours. Standard delivery across India takes 3–5 business
                  days. All sales are final — many pieces are one-off vintage or small-run, so check
                  the measurements and photos before ordering.
                </p>
                <p className="mt-3">
                  <Link href="/shipping" className="underline underline-offset-4 hover:text-black transition-colors">
                    Full delivery details
                  </Link>
                  {" · "}
                  <Link href="/size-guide" className="underline underline-offset-4 hover:text-black transition-colors">
                    Size guide
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
           <Button
             onClick={handleAddToCart}
             disabled={!canAddSelectedVariant}
             className="shrink-0 px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em]"
           >
            {addedAnimation ? "✓ ADDED" : "ADD TO BAG"}
          </Button>
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
          strokeWidth={1.5}
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
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-black">{title}</span>
        <Plus className={`h-4 w-4 text-black transition-transform duration-300 ${open ? "rotate-45" : ""}`} aria-hidden="true" />
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
            <div className="pb-5 text-[13px] leading-[1.7] text-black/70">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
