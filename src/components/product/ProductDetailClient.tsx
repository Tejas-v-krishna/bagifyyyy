"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
import SizeGuideModal from "@/components/product/SizeGuideModal";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { Clock, Heart } from "lucide-react";
import type { ProductForDisplay } from "@/lib/product";

/**
 * Clean editorial product detail page.
 * Layout matches the reference design:
 *   Left  — breadcrumb, big title, DETAILS & FIT bullets
 *   Center — large hero image (main active image)
 *   Right  — stacked thumbnails (top), then price / sizes / CTA (bottom)
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
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [isReservedInCheckout, setIsReservedInCheckout] = useState(false);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const wishlisted = isInWishlist(id);
  const productImages = product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean) as string[];
  const hasVariants = product.variants.length > 0;
  const selectedVariant = product.variants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor
  );
  const canAddSelectedVariant =
    !hasVariants || Boolean(selectedVariant && selectedVariant.stock > 0);

  useEffect(() => {
    let cancelled = false;

    const checkStockReservation = async () => {
      try {
        const response = await fetch(`/api/stock-status?productId=${product.id}`);
        if (response.ok && !cancelled) {
          const data = await response.json();
          setIsReservedInCheckout(Boolean(data.isReserved));
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

  const handleAddToCart = () => {
    if (!canAddSelectedVariant) {
      setSelectionError("Select an available size and color before adding this piece.");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: productImages[activeImageIndex] || productImages[0] || "/placeholder.jpg",
      quantity: 1,
      size: selectedSize || (product.sizes?.[0] ?? "One Size"),
      color: selectedColor || (product.colors?.[0] ?? "Default"),
    });
    setSelectionError("");
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setSelectionError("");

    if (hasVariants && !product.variants.some(
      (variant) => variant.size === size && variant.color === selectedColor && variant.stock > 0
    )) {
      const replacement = product.variants.find(
        (variant) => variant.size === size && variant.stock > 0
      );
      if (replacement) setSelectedColor(replacement.color);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectionError("");

    if (hasVariants && !product.variants.some(
      (variant) => variant.color === color && variant.size === selectedSize && variant.stock > 0
    )) {
      const replacement = product.variants.find(
        (variant) => variant.color === color && variant.stock > 0
      );
      if (replacement) setSelectedSize(replacement.size);
    }
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

        {/* ── Main Grid: Left / Center / Right ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] xl:grid-cols-[300px_1fr_320px] gap-0 lg:gap-8 xl:gap-12">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <div className="order-2 lg:order-1 flex flex-col pt-6 lg:pt-0">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-y2k-gunmetal/40 mb-6">
              <Link href="/products" className="hover:text-y2k-gunmetal transition-colors">SHOP</Link>
              <span>/</span>
              <Link href={categoryHref(product.category)} className="hover:text-y2k-gunmetal transition-colors">
                {categoryLabel(product.category).toUpperCase()}
              </Link>
            </nav>

            {/* Product Name — large editorial title */}
            <h1 className="text-[28px] sm:text-[34px] lg:text-[38px] xl:text-[44px] font-bold leading-[1.02] tracking-[-0.02em] text-y2k-gunmetal uppercase mb-10 lg:mb-12">
              {product.name}
            </h1>

            {isReservedInCheckout && !product.isSoldOut && (
              <div className="mb-6 flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-900">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>In checkout · another collector is completing payment</span>
              </div>
            )}

            {/* DETAILS & FIT */}
            <div className="mt-auto">
              <p className="text-[10px] uppercase tracking-[0.2em] text-y2k-gunmetal font-semibold mb-4">
                DETAILS
              </p>
              <ul className="space-y-2.5">
                {detailBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-y2k-gunmetal/70 leading-snug uppercase tracking-[0.06em]">
                    <span className="shrink-0 mt-0.5">—</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div className="border-t border-y2k-gunmetal/10 mt-8" />
            </div>
          </div>

          {/* ── CENTER COLUMN: Hero Image ────────────────────────────────────── */}
          <div className="order-1 lg:order-2 flex flex-col">
            <div className="relative w-full aspect-[3/4] md:aspect-[4/5] lg:aspect-auto lg:flex-1 lg:min-h-[560px] xl:min-h-[680px] bg-[#F2F2F2] overflow-hidden">
              {productImages.length > 0 ? (
                <Image
                  src={productImages[activeImageIndex] || productImages[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 45vw"
                  className="object-contain object-center"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/30">
                  Image unavailable
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Thumbnails + Price/CTA ────────────────────────── */}
          <div className="order-3 flex flex-col gap-0 pt-0 lg:pt-0">

            {/* Thumbnails — editorial strip */}
            {productImages.length > 1 && (
              <div
                className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 mb-5 lg:mb-0 scrollbar-none"
                style={{ scrollbarWidth: "none" }}
              >
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className="group shrink-0 flex items-stretch cursor-pointer focus:outline-none"
                  >
                    {/* Active left-edge indicator line (desktop only) */}
                    <span
                      className={`hidden lg:block w-[2px] self-stretch mr-2 shrink-0 transition-colors duration-200 ${
                        activeImageIndex === idx
                          ? "bg-y2k-gunmetal"
                          : "bg-transparent group-hover:bg-y2k-gunmetal/20"
                      }`}
                    />

                    {/* Image cell */}
                    <span
                      className={`relative overflow-hidden bg-[#EFEFEF] transition-opacity duration-200 block
                        w-[76px] h-[95px] lg:w-full lg:h-[118px]
                        ${activeImageIndex === idx ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        fill
                        sizes="(max-width: 1024px) 80px, 160px"
                        className="object-contain object-center p-2 lg:p-3"
                      />
                    </span>

                    {/* Index label (desktop only) */}
                    <span
                      className={`hidden lg:flex items-end pb-1 pl-2 text-[8px] font-mono tracking-widest shrink-0 transition-colors duration-200
                        ${activeImageIndex === idx
                          ? "text-y2k-gunmetal"
                          : "text-y2k-gunmetal/20 group-hover:text-y2k-gunmetal/45"}`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Spacer pushes price/CTA to bottom on desktop */}
            <div className="lg:flex-1" />

            {/* Price */}
            <div className="mt-6 lg:mt-0">
              <p className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-y2k-gunmetal mb-6">
                ₹{product.price.toLocaleString("en-IN")}
              </p>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/50 font-semibold">
                      SIZE
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[9px] uppercase tracking-[0.16em] text-y2k-gunmetal/40 hover:text-y2k-gunmetal transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s: string) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSizeChange(s)}
                        disabled={hasVariants && !product.variants.some((variant) => variant.size === s && variant.stock > 0)}
                        className={`text-[10.5px] uppercase tracking-wider px-4 py-2 min-h-[44px] border transition-all cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-25
                          ${selectedSize === s
                            ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                            : "border-y2k-gunmetal/20 text-y2k-gunmetal hover:border-y2k-gunmetal bg-white"
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
                <div className="mb-6">
                  <span className="mb-3 block text-[9.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/50 font-semibold">
                    COLOR / FINISH
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        disabled={hasVariants && !product.variants.some((variant) => variant.color === color && variant.stock > 0)}
                        className={`text-[10.5px] uppercase tracking-wider px-4 py-2 min-h-[44px] border transition-all cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-25
                          ${selectedColor === color
                            ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                            : "border-y2k-gunmetal/20 text-y2k-gunmetal hover:border-y2k-gunmetal bg-white"
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectionError && (
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-600" role="alert">
                  {selectionError}
                </p>
              )}

              {/* ADD TO BAG button */}
              {product.isSoldOut ? (
                <NotifyMeSection productId={product.id} />
              ) : (
                <div className="flex items-center gap-2">
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
                    className="w-12 h-12 border border-y2k-gunmetal/20 flex items-center justify-center hover:border-y2k-gunmetal transition-colors cursor-pointer shrink-0"
                  >
                    <Heart
                      className={`w-4 h-4 ${wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : "text-y2k-gunmetal"}`}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── YOU MAY ALSO LIKE ───────────────────────────────────────────────── */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.22em] text-y2k-gunmetal/40 font-semibold mb-1">
                 MORE PIECES
              </p>
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

      {/* ── Size Guide Modal ─────────────────────────────────────────────────── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />

      {/* ── Mobile Sticky Buy Bar ────────────────────────────────────────────── */}
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
