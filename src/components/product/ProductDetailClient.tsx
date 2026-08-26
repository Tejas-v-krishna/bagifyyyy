"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import NotifyMeSection from "@/components/product/NotifyMeSection";
import SimilarProducts from "@/components/product/SimilarProducts";
import ReviewSection from "@/components/product/ReviewSection";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { Heart, Ruler, ShieldCheck, Truck, ChevronLeft, ChevronRight, Eye, Clock } from "lucide-react";
import type { ProductForDisplay } from "@/lib/product";

/**
 * The interactive half of the product page. The server component fetches the
 * product, renders metadata and JSON-LD, and hands the row down here as a prop
 * — so there is no client-side fetch and no loading flash, and crawlers get the
 * real content in the initial HTML.
 */
export default function ProductDetailClient({ product }: { product: ProductForDisplay }) {
  const id = product.id;

  const { addItem, items } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] ?? "");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Live active viewers state with natural dynamic fluctuation
  const initialBaseViewers = 6 + ((product.id.charCodeAt(0) + product.id.charCodeAt(product.id.length - 1)) % 8);
  const [viewersCount, setViewersCount] = useState(initialBaseViewers);
  const [isReservedInCheckout, setIsReservedInCheckout] = useState(false);

  useEffect(() => {
    // Dynamic viewer count heartbeat simulation
    const viewerInterval = setInterval(() => {
      setViewersCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const next = prev + delta;
        return Math.min(Math.max(next, 4), 22);
      });
    }, 9000);

    // Live stock reservation check
    const checkStockReservation = async () => {
      try {
        const res = await fetch(`/api/stock-status?productId=${product.id}`);
        if (res.ok) {
          const data = await res.json();
          setIsReservedInCheckout(Boolean(data.isReserved));
        }
      } catch {}
    };

    checkStockReservation();
    const reservationInterval = setInterval(checkStockReservation, 15000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(reservationInterval);
    };
  }, [product.id]);

  // The buy bar below is `position: fixed`, but every storefront page is wrapped
  // in `.page-landing-animate`, which keeps `will-change: transform, opacity,
  // filter` after its fade-in. A transformed/will-change ancestor becomes the
  // containing block for fixed descendants, so `bottom-0` pinned the bar to the
  // bottom of the ~3000px document instead of the viewport — it was effectively
  // never on screen. Portalling to <body> escapes that containing block; the
  // client-only guard keeps `document.body` off the server render.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const wishlisted = isInWishlist(id);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[activeImageIndex] || product.images?.[0] || product.image || "/placeholder.jpg",
      quantity: 1,
      size: selectedSize || (product.sizes?.[0] ?? "One Size"),
      color: selectedColor || (product.colors?.[0] ?? "Default"),
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleWishlistClick = () => {
    toggleItem(id);
  };

  const totalBagValue = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const collectionTag = product.brand || "BAGIFYYYY";
  const productImages = product.images || [];

  return (
    <div className="w-full bg-white text-y2k-gunmetal min-h-screen pt-6 lg:pt-12 pb-32 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* Breadcrumb */}
        <div className="mb-5 lg:mb-12">
          <nav className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/40">
            <Link href="/" className="hover:text-y2k-gunmetal transition-colors">HOME</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-y2k-gunmetal transition-colors">DROPS</Link>
            <span>/</span>
            <Link href={categoryHref(product.category)} className="hover:text-y2k-gunmetal transition-colors">
              {categoryLabel(product.category)}
            </Link>
            <span>/</span>
            <span className="text-y2k-gunmetal/70 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.8fr_1.1fr] gap-6 lg:gap-14 xl:gap-20">

          {/* Left Column: Garment Details & Sizing */}
          <div className="flex flex-col order-2 lg:order-1 pt-0 lg:pt-10">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="section-label text-y2k-slate">
                {collectionTag}
              </span>
              <span className="text-[8.5px] font-mono text-y2k-gunmetal/30">· {product.id.substring(0, 8).toUpperCase()}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-[1.06] tracking-[-0.04em] text-y2k-gunmetal mb-5">
              {product.name}
            </h1>

            <p className="text-[12.5px] text-y2k-gunmetal/65 leading-loose mb-8">
              {product.description ||
                "A signature piece crafted with heavyweight construction and tailored modern streetwear silhouette."}
            </p>

            {/* Active Checkout Hold Alert (if 1 collector is currently paying) */}
            {isReservedInCheckout && (
              <div className="flex items-center gap-2.5 py-3 px-4 bg-amber-500/10 border border-amber-500/30 text-[9.5px] font-bold uppercase tracking-[0.14em] text-amber-900 mb-3 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>IN CHECKOUT · 1 COLLECTOR IS COMPLETING PAYMENT</span>
              </div>
            )}

            {/* Live Active Viewers & Scarcity Indicator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 py-3 px-4 bg-y2k-ice border border-y2k-gunmetal/[0.1] text-[9px] uppercase tracking-[0.18em] text-y2k-gunmetal/75 mb-8">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="font-bold text-black">{viewersCount} COLLECTORS VIEWING NOW</span>
              </div>
              <div className="flex items-center gap-1.5 text-y2k-gunmetal/50 text-[8.5px]">
                <span>100% AUTHENTIC ARCHIVE</span>
              </div>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label text-y2k-gunmetal/60">
                    SELECT SIZE
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.16em] text-y2k-gunmetal/50 hover:text-y2k-gunmetal transition-colors cursor-pointer"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`text-[10.5px] uppercase tracking-wider px-4 py-2.5 border transition-all cursor-pointer ${
                        selectedSize === s
                          ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                          : "border-y2k-gunmetal/[0.15] text-y2k-gunmetal hover:border-y2k-gunmetal/50 bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <span className="section-label text-y2k-gunmetal/60 block mb-3">
                  FINISH / COLOR
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`text-[10.5px] uppercase tracking-wider px-4 py-2.5 border transition-all cursor-pointer ${
                        selectedColor === c
                          ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                          : "border-y2k-gunmetal/[0.15] text-y2k-gunmetal hover:border-y2k-gunmetal/50 bg-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Material & Provenance Notes */}
            <div className="text-[10.5px] text-y2k-gunmetal/55 space-y-3 pt-6 border-t border-y2k-gunmetal/[0.07]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal/50" strokeWidth={1.5} />
                <span>100% Verified Heavyweight Quality Standard</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="font-bold w-3.5 h-3.5 text-y2k-gunmetal/50" strokeWidth={1.5} />
                <span>Complimentary Shipping Over ₹2000</span>
              </div>
            </div>
          </div>

          {/* Center Column: Image & Gallery */}
          <div className="flex flex-col items-center order-1 lg:order-2">
            {/*
              Until `lg`, the grid is a single column and this image is the first
              thing in it — unconstrained it grows to the full column width and
              filled the entire first viewport, pushing the name, size selector
              and price below the fold. The `vh` cap keeps the photo to roughly
              half the screen on any phone height, and the max-width stops the
              box from stretching into a wide letterbox on tablets. Both are
              lifted at `lg`, where the 3-column layout gives the image its own
              centre column.
            */}
            <div className="w-full max-w-[460px] lg:max-w-none aspect-[3/4] md:aspect-[4/5] max-h-[48vh] lg:max-h-none relative bg-[#F8F8F8] border border-y2k-gunmetal/[0.07] overflow-hidden group">
              {productImages.length > 0 ? (
                <>
                  <Image
                    src={
                      productImages[activeImageIndex] ||
                      productImages[0]
                    }
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    className="object-contain object-center transition-all duration-300"
                  />

                  {/* Arrow Controls */}
                  {productImages.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                        }}
                        className="w-8 h-8 rounded-full bg-white/85 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                        title="Previous Photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                        }}
                        className="w-8 h-8 rounded-full bg-white/85 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                        title="Next Photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/30">
                  No Image Available
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2.5 mt-5 flex-wrap justify-center">
                {productImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1.5 border transition-all cursor-pointer font-mono text-[10px] ${
                      activeImageIndex === idx
                        ? "bg-y2k-gunmetal text-white border-y2k-gunmetal"
                        : "bg-white text-y2k-gunmetal/50 border-y2k-gunmetal/[0.12] hover:border-y2k-gunmetal/40"
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Price & Add to Bag */}
          <div className="flex flex-col order-3 lg:order-3 pt-0 lg:pt-10">
            <h2 className="font-bold font-display text-4xl sm:text-5xl tracking-[-0.04em] text-y2k-gunmetal mb-8 lg:text-right">
              ₹{product.price.toLocaleString("en-IN")}
            </h2>

            {product.isSoldOut ? (
              <NotifyMeSection productId={product.id} />
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="btn-bagify w-full py-5 px-5 text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] flex items-center justify-between cursor-pointer"
                >
                  <span>{addedAnimation ? "✓ ADDED TO BAG" : `ADD TO BAG${selectedSize ? ` (${selectedSize})` : ""}`}</span>
                  <span className="font-bold text-[9px] text-white/55">
                    BAG: ₹{totalBagValue.toLocaleString("en-IN")}
                  </span>
                </button>

                <button
                  onClick={handleWishlistClick}
                  className="w-full py-4 border border-y2k-gunmetal/[0.12] text-y2k-gunmetal hover:border-y2k-gunmetal/40 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.16em] transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : ""
                    }`}
                    strokeWidth={1.5}
                  />
                  <span>{wishlisted ? "SAVED IN WISHLIST" : "SAVE TO WISHLIST"}</span>
                </button>
              </div>
            )}

            {/* Quick Policy Notice */}
            <div className="mt-10 pt-6 border-t border-y2k-gunmetal/[0.07] space-y-3">
              <p className="section-label text-y2k-gunmetal/70">7-DAY RETURNS &amp; VERIFIED QUALITY</p>
              <p className="text-[11px] text-y2k-gunmetal/50 leading-loose">
                Every piece is inspected for fabric density, hardware integrity, and provenance.
              </p>
            </div>
          </div>

        </div>

        {/* Similar Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <SimilarProducts products={product.relatedProducts} />
        )}

        {/* Reviews */}
        <ReviewSection productId={id} />

        {/* Recently Viewed */}
        <div className="mt-20 pt-10 border-t border-y2k-gunmetal/[0.07]">
          <RecentlyViewed productId={id} />
        </div>

      </div>

      {/* ── Size Guide Modal ────────────────────────────────────────────── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />

      {/* ── Mobile Sticky Buy Bar ───────────────────────────────────────── */}
      {!product.isSoldOut && mounted && createPortal(
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-y2k-gunmetal/[0.1] p-4 flex lg:hidden items-center justify-between shadow-xl">
          <div className="min-w-0 pr-4">
            <p className="text-[10.5px] uppercase tracking-[0.12em] truncate text-y2k-gunmetal">{product.name}</p>
            <p className="font-bold font-display text-lg tracking-tight text-y2k-gunmetal">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="btn-bagify px-6 py-3.5 text-[10px] uppercase tracking-[0.18em] shrink-0 cursor-pointer"
          >
            {addedAnimation ? "✓ ADDED" : "ADD TO BAG"}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
