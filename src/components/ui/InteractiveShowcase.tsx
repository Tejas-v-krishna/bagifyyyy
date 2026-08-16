"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
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
  const [maxIndex, setMaxIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);

  // Update maxIndex and layout on resize / tab switch
  const updateMetrics = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const card = el.querySelector(".showcase-card") as HTMLElement | null;
    if (!card) return;

    const cardWidth = card.offsetWidth + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(el.offsetWidth / cardWidth));
    const calculatedMax = Math.max(0, total - visibleCards);
    setMaxIndex(calculatedMax);

    const currentCardIdx = Math.round(el.scrollLeft / cardWidth);
    setCurrentIndex(Math.min(calculatedMax, Math.max(0, currentCardIdx)));
  }, [total]);

  useEffect(() => {
    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    return () => window.removeEventListener("resize", updateMetrics);
  }, [updateMetrics, activeTab]);

  const handleTabChange = (newTab: "new" | "top") => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setCurrentIndex(0);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "instant" });
      gsap.fromTo(
        scrollContainerRef.current,
        {
          opacity: 0,
          x: newTab === "top" ? 30 : -30,
          filter: "blur(12px)",
        },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power3.out",
          clearProps: "filter,x",
        }
      );
    }
  };

  // ── Sync index during native or dragged scrolling ──────────────────────────
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const card = el.querySelector(".showcase-card") as HTMLElement | null;
    if (!card) return;

    const cardWidth = card.offsetWidth + 24;
    const currentCardIdx = Math.round(el.scrollLeft / cardWidth);
    setCurrentIndex(Math.min(maxIndex, Math.max(0, currentCardIdx)));
  };

  // ── Mouse Drag & Scroll Physics for the Whole Card Track ──────────────────
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    isDownRef.current = true;
    isDraggingRef.current = false;
    dragDistanceRef.current = 0;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.25; // 1.25x responsive scroll multiplier
    dragDistanceRef.current = Math.abs(x - startXRef.current);

    if (dragDistanceRef.current > 5) {
      isDraggingRef.current = true;
    }

    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const onMouseUpOrLeave = () => {
    isDownRef.current = false;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // ── Keyboard / Arrow Navigation ───────────────────────────────────────────
  const scrollToCard = useCallback((index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const card = el.querySelector(".showcase-card") as HTMLElement | null;
    if (!card) return;

    const cardWidth = card.offsetWidth + 24;
    const targetScroll = Math.max(0, index * cardWidth);
    el.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, []);

  const goNext = useCallback(() => {
    const nextIdx = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    setCurrentIndex(nextIdx);
    scrollToCard(nextIdx);
  }, [currentIndex, maxIndex, scrollToCard]);

  const goPrev = useCallback(() => {
    const prevIdx = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    setCurrentIndex(prevIdx);
    scrollToCard(prevIdx);
  }, [currentIndex, maxIndex, scrollToCard]);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    scrollToCard(idx);
  }, [scrollToCard]);

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

      {/* ── 2. Draggable & Horizontally Scrollable Card Track ─────────────────── */}
      <div className="w-full relative group/track mb-4 py-2">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-none scroll-smooth cursor-grab active:cursor-grabbing select-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {currentList.map((product, productIdx) => {
            const imgUrl = product.images[0]?.url || "/placeholder.jpg";
            const hoverImgUrl = product.images[1]?.url || null;

            return (
              <Link
                key={`${activeTab}-${product.id || productIdx}`}
                href={`/product/${product.id}`}
                onClick={(e) => {
                  // Prevent link navigation if user was dragging the carousel
                  if (isDraggingRef.current || dragDistanceRef.current > 5) {
                    e.preventDefault();
                  }
                }}
                className="showcase-card interactive-card group flex flex-col shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-18px)] lg:w-[calc(16.666%-20px)] select-none"
              >
                {/* Borderless Floating Image Container with Hover Swap */}
                <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-black/[0.02] group-hover:bg-black/[0.05] transition-colors duration-500">
                  {/* Minimalist Brand "NEW" Label Top Left */}
                  {product.isNew && (
                    <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
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

                  {/* Primary Base Image (Not individually draggable) */}
                  <Image
                    src={imgUrl}
                    alt={product.name}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[1] select-none pointer-events-none ${
                      hoverImgUrl ? "group-hover:opacity-0" : ""
                    } ${product.isSoldOut ? "blur-sm opacity-70" : "opacity-100"}`}
                  />

                  {/* Alternate Image on Hover */}
                  {hoverImgUrl && (
                    <Image
                      src={hoverImgUrl}
                      alt={`${product.name} alternate view`}
                      fill
                      draggable={false}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2] select-none pointer-events-none"
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
                <div className="flex flex-col pt-3 pb-1 pointer-events-none">
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
              className={`h-[2px] rounded-full transition-all duration-300 cursor-pointer ${
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
