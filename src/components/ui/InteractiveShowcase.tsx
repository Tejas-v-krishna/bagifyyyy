"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAppStore } from "@/store/useAppStore";
import WishlistButton from "@/components/ui/WishlistButton";

export type ShowcaseProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isSoldOut: boolean;
  isNew?: boolean;
  category?: string;
  brand?: string | null;
  images: { url: string }[];
};

export default function InteractiveShowcase({
  products,
  topPicks,
}: {
  products: ShowcaseProduct[];
  topPicks?: ShowcaseProduct[];
}) {
  const [activeTab, setActiveTab] = useState<"new" | "top">("new");
  const isPreloaderFinished = useAppStore((state) => state.isPreloaderFinished);

  const currentList = activeTab === "new" 
    ? products 
    : (topPicks && topPicks.length > 0 ? topPicks : [...products].reverse());
  const total = currentList.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleSlots = windowWidth < 640 ? 2 : windowWidth < 1024 ? 4 : 6;
  const maxIndex = Math.max(0, total - visibleSlots);

  // Clamp index on resize or tab change
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handleTabChange = (newTab: "new" | "top") => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setCurrentIndex(0);

    if (trackRef.current) {
      gsap.fromTo(
        trackRef.current,
        {
          opacity: 0,
          x: newTab === "top" ? 30 : -30,
          filter: "blur(12px)",
        },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: 0.55,
          ease: "power3.out",
          clearProps: "filter",
        }
      );
    }
  };

  // ── Smooth slide animation when currentIndex changes ──────────────────────
  useGSAP(() => {
    if (!trackRef.current) return;
    const firstCard = trackRef.current.children[0] as HTMLElement;
    if (!firstCard) return;

    const gap = windowWidth < 768 ? 16 : 24;
    const cardWidth = firstCard.offsetWidth;
    const targetX = -currentIndex * (cardWidth + gap);

    gsap.to(trackRef.current, {
      x: targetX,
      duration: 0.55,
      ease: "power3.out",
    });
  }, { dependencies: [currentIndex, windowWidth, activeTab], scope: containerRef });

  // ── Entrance Loading Animation (Staggered Wave) ───────────────────────────
  useGSAP(() => {
    if (!isPreloaderFinished) {
      gsap.set(".showcase-card", { opacity: 0, y: 25 });
      return;
    }

    gsap.to(".showcase-card", {
      opacity: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.04,
      ease: "power3.out",
    });
  }, { dependencies: [isPreloaderFinished, activeTab], scope: containerRef });

  // ── Navigation Handlers ───────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(Math.min(idx, maxIndex));
  }, [maxIndex]);

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col select-none"
    >
      {/* ── 1. Minimal Header with Magnetic Animated Tabs ── */}
      <div className="flex flex-col items-center justify-center mb-12 text-center">
        <div className="flex items-center gap-6 sm:gap-12 select-none relative">
          
          {/* Tab 1: New Arrivals */}
          <button
            type="button"
            onClick={() => handleTabChange("new")}
            className={`relative pb-3 font-display text-2xl sm:text-3xl md:text-4xl lg:text-[46px] uppercase tracking-[-0.03em] leading-none transition-all duration-300 cursor-pointer ${
              activeTab === "new"
                ? "text-y2k-gunmetal font-medium scale-[1.02]"
                : "text-y2k-gunmetal/30 hover:text-y2k-gunmetal/70 font-normal hover:scale-[1.01]"
            }`}
          >
            <span>New Arrivals</span>
            {activeTab === "new" && (
              <motion.div
                layoutId="showcaseTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-y2k-gunmetal shadow-sm"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </button>

          {/* Tab 2: Curated Grails */}
          <button
            type="button"
            onClick={() => handleTabChange("top")}
            className={`relative pb-3 font-display text-2xl sm:text-3xl md:text-4xl lg:text-[46px] uppercase tracking-[-0.03em] leading-none transition-all duration-300 cursor-pointer ${
              activeTab === "top"
                ? "text-y2k-gunmetal font-medium scale-[1.02]"
                : "text-y2k-gunmetal/30 hover:text-y2k-gunmetal/70 font-normal hover:scale-[1.01]"
            }`}
          >
            <span>Curated Grails</span>
            {activeTab === "top" && (
              <motion.div
                layoutId="showcaseTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-y2k-gunmetal shadow-sm"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* ── 2. Borderless Card Track Container ─────────────────────────────────── */}
      <div className="w-full overflow-hidden mb-4 py-2">
        <div
          ref={trackRef}
          className="flex gap-4 md:gap-6 will-change-transform"
        >
          {currentList.map((product, productIdx) => {
            const imgUrl = product.images[0]?.url || "/placeholder.jpg";
            const hoverImgUrl = product.images[1]?.url || null;

            return (
              <Link
                key={`${activeTab}-${product.id || productIdx}`}
                href={`/product/${product.id}`}
                className="showcase-card interactive-card group flex flex-col shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-18px)] lg:w-[calc(16.666%-20px)] cursor-pointer select-none"
              >
                {/* Borderless Floating Image Container with Subtle Photographic Depth */}
                <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-black/[0.02] group-hover:bg-black/[0.05] transition-colors duration-500 cursor-pointer">
                  {/* Minimalist Brand "NEW" Label Top Left */}
                  {product.isNew && (
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <span className="text-[8px] font-bold uppercase tracking-[0.14em] bg-[#232D3B] text-white px-1.5 py-0.5 shadow-sm">
                        NEW
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button Top Right */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <WishlistButton
                      productId={product.id}
                      className="!top-2.5 !bottom-auto !right-2.5 !p-1.5 bg-white/85 hover:bg-white text-y2k-gunmetal z-20 shadow-sm rounded-none border-0"
                    />
                  </div>

                  {/* Primary Image */}
                  <Image
                    src={imgUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[1] ${
                      hoverImgUrl ? "group-hover:opacity-0" : ""
                    } ${product.isSoldOut ? "blur-sm opacity-70" : "opacity-100"}`}
                  />

                  {/* Alternate Image on Hover */}
                  {hoverImgUrl && (
                    <Image
                      src={hoverImgUrl}
                      alt={`${product.name} alternate view`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2]"
                    />
                  )}

                  {/* Sold Out Badge */}
                  {product.isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                      <span className="bg-[#232D3B] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>

                {/* Clean Borderless Product Details Below Image */}
                <div className="flex flex-col pt-3 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/60 truncate">
                    {product.brand || "BAGIFYYYY ARCHIVE"}
                  </p>
                  <h3 className="font-sans text-xs md:text-[13px] font-semibold text-y2k-gunmetal group-hover:text-black transition-colors line-clamp-2 leading-snug mt-0.5">
                    {product.name}
                  </h3>
                  <p className="font-sans text-xs md:text-sm font-extrabold text-y2k-gunmetal mt-1.5">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 3. Clean Minimalist Controls Below Track ─────────────────────────── */}
      <div className="w-full flex items-center justify-between mt-6 px-1">
        {/* Left: Product Counter */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/60">
          <span className="text-y2k-gunmetal">{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="opacity-30">/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>

        {/* Center: Progress Bar Dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-[2px] rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-7 bg-y2k-gunmetal"
                  : "w-2.5 bg-y2k-gunmetal/20 hover:bg-y2k-gunmetal/50"
              }`}
            />
          ))}
        </div>

        {/* Right: Arrow Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label="Previous products"
            className="w-8 h-8 rounded-full border border-y2k-gunmetal/20 hover:border-y2k-gunmetal hover:bg-y2k-gunmetal hover:text-white flex items-center justify-center text-y2k-gunmetal transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next products"
            className="w-8 h-8 rounded-full border border-y2k-gunmetal/20 hover:border-y2k-gunmetal hover:bg-y2k-gunmetal hover:text-white flex items-center justify-center text-y2k-gunmetal transition-all cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
