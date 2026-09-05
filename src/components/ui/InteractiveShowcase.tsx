"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import AddToBagButton from "@/components/ui/AddToBagButton";
import ProductMetaRow from "@/components/product/ProductMetaRow";

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
  sizes?: string[];
  colors?: string[];
};

export default function InteractiveShowcase({
  products = [],
  topPicks = [],
   eyebrow = "JUST IN",
   heading = "NEW IN",
  viewAllHref = "/new-arrivals",
   ariaLabel = "New pieces",
  mirroredLayout = false,
  tone = "light",
  showTabs = true,
}: {
  products: ShowcaseProduct[];
  topPicks?: ShowcaseProduct[];
  eyebrow?: string;
  heading?: string;
  viewAllHref?: string;
  ariaLabel?: string;
  mirroredLayout?: boolean;
  tone?: "light" | "dark";
  showTabs?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new" | "top">("new");

  // Build a rich infinite list: if catalogue has < 8 products, repeat to guarantee smooth infinite carousel
  const effectiveTab = showTabs ? activeTab : "new";
  const baseList = useMemo(() => {
    const list = effectiveTab === "new"
      ? (products.length > 0 ? products : [])
      : (topPicks && topPicks.length > 0 ? topPicks : [...products].reverse());

    if (list.length === 0) return [];
    if (list.length < 8) {
      // Repeat list so wrap-around has plenty of unique elements
      return [...list, ...list, ...list].map((item, idx) => ({
        ...item,
        uniqueKey: `${item.id}-${idx}`,
      }));
    }
    return list.map((item, idx) => ({
      ...item,
      uniqueKey: `${item.id}-${idx}`,
    }));
  }, [products, topPicks, effectiveTab]);

  const total = baseList.length;
  const [activeIndex, setActiveIndex] = useState(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigation handlers
  const goNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < total) {
      setActiveIndex(idx);
    }
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Handle Card Click
  const handleCardClick = (index: number, productId: string) => {
    if (isDragging) return;
    if (index === activeIndex) {
      router.push(`/product/${productId}`);
    } else {
      setActiveIndex(index);
    }
  };

  if (total === 0) return null;

  // Compute circular slot offset relative to activeIndex (-3 to +3 for 7 visible slots)
  const getSlotOffset = (index: number) => {
    let diff = index - activeIndex;
    if (total > 7) {
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
    }
    return diff;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none flex flex-col justify-between"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      tabIndex={0}
      aria-label={ariaLabel}
    >
      {/* ── TOP HEADER (Matching Reference Layout Exactly) ── */}
      <div className="w-full flex items-start justify-between mb-6 sm:mb-10 px-2 sm:px-4 md:px-6 z-30">
        <div className="flex flex-col gap-1 select-none pointer-events-none">
          <span className={`font-sans text-[11px] sm:text-[12px] tracking-[0.14em] font-medium select-none ${tone === "dark" ? "text-white/50" : "text-black/50"}`}>
            {eyebrow}
          </span>
          <h2 className={`font-display uppercase text-[20px] sm:text-[26px] md:text-[32px] font-bold tracking-[-0.03em] leading-none select-none ${tone === "dark" ? "text-white" : "text-[#111111]"}`}>
            {heading}
          </h2>
        </div>

        {showTabs && (
        <div className="flex items-center gap-2" role="tablist" aria-label="Showcase edits">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "new"}
            onClick={() => {
              setActiveTab("new");
              setActiveIndex(0);
            }}
            className={`h-9 px-4 rounded-[0.35rem] text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer ${activeTab === "new" ? (tone === "dark" ? "bg-white text-black" : "bg-black text-white") : (tone === "dark" ? "border border-white/25 text-white/70 hover:text-white" : "border border-black/10 text-black/60 hover:text-black")}`}
          >
            New In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "top"}
            onClick={() => {
              setActiveTab("top");
              setActiveIndex(0);
            }}
            className={`h-9 px-4 rounded-[0.35rem] text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer ${activeTab === "top" ? (tone === "dark" ? "bg-white text-black" : "bg-black text-white") : (tone === "dark" ? "border border-white/25 text-white/70 hover:text-white" : "border border-black/10 text-black/60 hover:text-black")}`}
          >
            Curated Grails
          </button>
        </div>
        )}

        {/* View-all CTA + Carousel Arrow Controls */}
        <div className="flex items-center gap-2">
          <Link
            href={viewAllHref}
            className={`h-10 inline-flex items-center gap-2 rounded-[0.35rem] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tone === "dark" ? "bg-white text-black hover:bg-white/85 focus-visible:outline-white" : "bg-[#111111] text-white hover:bg-black/80 focus-visible:outline-black"}`}
          >
            <span>See all pieces</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous product"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[0.35rem] flex items-center justify-center transition-all duration-200 cursor-pointer ${tone === "dark" ? "border border-white/25 bg-transparent text-white hover:bg-white hover:text-black" : "border border-black/10 bg-white text-black/80 hover:bg-black hover:text-white shadow-sm"}`}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next product"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[0.35rem] flex items-center justify-center transition-all duration-200 cursor-pointer ${tone === "dark" ? "border border-white/25 bg-transparent text-white hover:bg-white hover:text-black" : "border border-black/10 bg-white text-black/80 hover:bg-black hover:text-white shadow-sm"}`}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── DISPLAY AREA WITH PURE TRANSPARENT GLASS BLUR & FADE ── */}
      <div
        className="relative w-full overflow-hidden py-4"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 2%, rgba(0,0,0,0.85) 9%, black 15%, black 85%, rgba(0,0,0,0.85) 91%, rgba(0,0,0,0.1) 98%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 2%, rgba(0,0,0,0.85) 9%, black 15%, black 85%, rgba(0,0,0,0.85) 91%, rgba(0,0,0,0.1) 98%, transparent 100%)",
        }}
      >
        {/* Left Side Pure Transparent Glass Blur (No Dark/Grey Background Tint) */}
        <div
          className="pointer-events-none absolute left-0 inset-y-0 w-20 sm:w-32 md:w-48 lg:w-60 z-40 backdrop-blur-[5px]"
          style={{
            maskImage: "linear-gradient(to right, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, black 30%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Right Side Pure Transparent Glass Blur (No Dark/Grey Background Tint) */}
        <div
          className="pointer-events-none absolute right-0 inset-y-0 w-20 sm:w-32 md:w-48 lg:w-60 z-40 backdrop-blur-[5px]"
          style={{
            maskImage: "linear-gradient(to left, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 0%, black 30%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* ── DRAGGABLE STAGGERED CAROUSEL TRACK ── */}
        <motion.div
          className="relative w-full flex items-center justify-center min-h-[520px] sm:min-h-[580px] md:min-h-[640px] lg:min-h-[680px] cursor-grab active:cursor-grabbing select-none"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => {
            setIsDragging(true);
          }}
          onDrag={(_, info) => {
            dragX.set(info.offset.x);
          }}
          onDragEnd={(_, info) => {
            dragX.set(0);
            const swipeThreshold = 45;
            if (info.offset.x < -swipeThreshold || info.velocity.x < -200) {
              goNext();
            } else if (info.offset.x > swipeThreshold || info.velocity.x > 200) {
              goPrev();
            }
            setTimeout(() => setIsDragging(false), 60);
          }}
        >
          <div className="relative w-full flex items-center justify-center pointer-events-none select-none">
            {baseList.map((product, idx) => {
              const offset = getSlotOffset(idx);
              const isVisible = Math.abs(offset) <= 4;
              if (!isVisible) return null;

              const isCenter = offset === 0;
              const imgUrl = product.images[0]?.url || "/placeholder.jpg";

              // ── Dynamic Generous Spacing Geometry (No overlap, genuine gaps):
              // Center card: ~390px wide (half: 195px)
              // Side cards: ~250px wide (half: 125px)
              // Generous Gap: 60px
              // Distance to offset 1: 195 + 125 + 60 = 380px
              // Distance to offset 2: 380 + 250 + 55 = 685px
              // Distance to offset 3: 685 + 250 + 55 = 990px

              let slotY = 0;
              let cardWidth = "w-[170px] sm:w-[210px] md:w-[245px] lg:w-[260px]";
              let cardHeight = "h-[200px] sm:h-[250px] md:h-[280px] lg:h-[295px]";
              let horizontalX = 0;

              if (isCenter) {
                // Tall Hero Card in Center
                cardWidth = "w-[270px] sm:w-[330px] md:w-[380px] lg:w-[410px]";
                cardHeight = "h-[450px] sm:h-[520px] md:h-[580px] lg:h-[620px]";
                slotY = 0;
                horizontalX = 0;
              } else if (offset === -1) {
                slotY = mirroredLayout ? 100 : -115;
                horizontalX = -380;
              } else if (offset === -2) {
                slotY = mirroredLayout ? -115 : 100;
                horizontalX = -685;
              } else if (offset === -3) {
                slotY = mirroredLayout ? 100 : -115;
                horizontalX = -990;
              } else if (offset === 1) {
                slotY = mirroredLayout ? -115 : 100;
                horizontalX = 380;
              } else if (offset === 2) {
                slotY = mirroredLayout ? 100 : -115;
                horizontalX = 685;
              } else if (offset === 3) {
                slotY = mirroredLayout ? -115 : 100;
                horizontalX = 990;
              } else {
                slotY = 0;
                horizontalX = offset * 320;
              }

              return (
                <motion.div
                  key={product.uniqueKey || product.id}
                  layout
                  initial={false}
                  animate={{
                    x: horizontalX,
                    y: slotY,
                    scale: isCenter ? 1 : 0.94,
                    opacity: Math.abs(offset) > 3 ? 0 : Math.abs(offset) === 3 ? 0.45 : 1,
                    zIndex: isCenter ? 30 : 20 - Math.abs(offset),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 28,
                    mass: 0.85,
                  }}
                  onClick={() => handleCardClick(idx, product.id)}
                  className="absolute flex flex-col cursor-pointer group pointer-events-auto select-none"
                  style={{
                    willChange: "transform, opacity",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {/* Card Body with Clean Rounded Soft Grey Surface (Matching Reference) */}
                  <div
                    className={`relative ${cardWidth} ${cardHeight} rounded-xl sm:rounded-2xl bg-[#ebebeb] hover:bg-[#e4e4e4] transition-colors duration-300 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] select-none`}
                    style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  >
                    {/* Centered Product Cutout Image (Protected from Selection / Ghost Drag) */}
                    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        draggable={false}
                        sizes={isCenter ? "(max-width: 768px) 330px, 410px" : "260px"}
                        className="object-contain object-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                        priority={isCenter}
                      />
                    </div>

                    {/* Quick Add to Bag on Center Active Card */}
                    {isCenter && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 pointer-events-auto"
                      >
                        <AddToBagButton
                          product={{
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: imgUrl,
                            isSoldOut: product.isSoldOut,
                            sizes: product.sizes,
                            colors: product.colors,
                          }}
                          className="h-8 w-8 p-0"
                        />
                      </div>
                    )}
                  </div>

                  <ProductMetaRow name={product.name} price={product.price} tone={tone} className="pointer-events-none select-none px-1" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM FOOTER: PROGRESS STEP DOTS ── */}
      <div className="w-full flex items-center mt-6 sm:mt-10 px-2 sm:px-4 md:px-6 z-30">
        {/* Step dots for all products */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] py-1">
          {products.slice(0, Math.min(12, products.length)).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to product ${i + 1}`}
              className={`h-1.5 transition-all duration-300 rounded-[0.35rem] cursor-pointer ${
                  (activeIndex % Math.min(12, products.length)) === i
                    ? `w-6 ${tone === "dark" ? "bg-white" : "bg-[#111111]"}`
                    : `w-1.5 ${tone === "dark" ? "bg-white/20 hover:bg-white/40" : "bg-black/20 hover:bg-black/40"}`
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
