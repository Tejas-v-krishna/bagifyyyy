"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  brand?: string | null;
  colors?: string[];
}

export default function SimilarProducts({
  products,
}: {
  products: RelatedProduct[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update progress bar based on horizontal scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(progress);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, products]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!products || products.length === 0) return null;

  // Calculate indicator width & offset for the bottom progress line
  const indicatorWidthPercent = Math.max(18, Math.min(35, 100 / Math.max(1, products.length)));
  const indicatorLeftPercent = scrollProgress * (100 - indicatorWidthPercent);

  return (
    <section className="mt-20 pt-12 border-t border-gray-100 select-none">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-sans font-medium text-2xl sm:text-3xl lg:text-[32px] tracking-tight text-black">
            Recommendations
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mt-1">
            Curated archive pieces for you
          </p>
        </div>

        {/* Desktop Arrow Nav */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scrollByAmount("left")}
            disabled={!canScrollLeft}
            aria-label="Previous pieces"
            className="w-8 h-8 rounded-full border border-gray-200 hover:border-black hover:bg-black hover:text-white flex items-center justify-center text-black transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => scrollByAmount("right")}
            disabled={!canScrollRight}
            aria-label="Next pieces"
            className="w-8 h-8 rounded-full border border-gray-200 hover:border-black hover:bg-black hover:text-white flex items-center justify-center text-black transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Horizontal Track (Phone & Desktop) ───────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x snap-mandatory touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group shrink-0 w-[160px] sm:w-[190px] md:w-[220px] lg:w-[240px] snap-start flex flex-col cursor-pointer"
          >
            {/* Image Box */}
            <div className="relative w-full aspect-[4/5] bg-[#F7F7F7] overflow-hidden flex items-center justify-center transition-colors group-hover:bg-[#EFEFEF]">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
                  className="object-contain object-center mix-blend-multiply group-hover:scale-[1.04] transition-transform duration-500 p-3 sm:p-4"
                />
              ) : (
                <div className="text-[9px] uppercase tracking-widest text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Product Meta (Title, Price, Color Attributes) */}
            <div className="pt-3 flex flex-col">
              <h3 className="font-sans text-xs md:text-sm font-semibold text-black leading-snug line-clamp-2 group-hover:opacity-70 transition-opacity">
                {product.name}
              </h3>
              
              <p className="font-sans text-xs md:text-sm font-bold text-black mt-1">
                ₹{product.price.toLocaleString("en-IN")}
              </p>

              {/* Subtitle / Attributes (matching reference image style) */}
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium capitalize mt-1 truncate">
                {product.category || "Unisex"}
                {product.colors && product.colors.length > 0
                  ? ` · ${product.colors.length} color${product.colors.length > 1 ? "s" : ""}`
                  : " · Archive"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Scroll Progress Line (Exact Match to Screenshot) ────────────────── */}
      <div className="w-full mt-4 pt-1">
        <div className="relative w-full h-[1.5px] bg-gray-200 overflow-hidden">
          <div
            className="absolute top-0 h-full bg-black transition-all duration-100 ease-out"
            style={{
              width: `${indicatorWidthPercent}%`,
              transform: `translateX(${indicatorLeftPercent * (100 / indicatorWidthPercent)}%)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
