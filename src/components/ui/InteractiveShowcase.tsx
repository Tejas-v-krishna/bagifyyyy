"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useAppStore } from "@/store/useAppStore";
import AddToBagButton from "@/components/ui/AddToBagButton";

gsap.registerPlugin(ScrollTrigger);

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Position & Drag Refs
  const currentXRef = useRef(0);
  const targetXRef = useRef(0);
  const minXRef = useRef(0);
  const isPressedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const trackStartXRef = useRef(0);
  const lastMouseXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityXRef = useRef(0);

  // ── 1. Calculate Track Limits & Step Sizes ──────────────────────────────────
  const calculateLimits = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return { cardStep: 280, minX: 0, maxIdx: 0 };

    const firstCard = track.children[0] as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth : 240;
    const gap = window.innerWidth < 768 ? 16 : 24;
    const cardStep = cardWidth + gap;

    const totalTrackWidth = total * cardStep - gap;
    const viewportWidth = viewport.offsetWidth;
    const minX = Math.min(0, -(totalTrackWidth - viewportWidth));

    const visibleCards = Math.max(1, Math.floor(viewportWidth / cardStep));
    const maxIdx = Math.max(0, total - visibleCards);

    minXRef.current = minX;
    setMaxIndex(maxIdx);

    return { cardStep, minX, maxIdx };
  }, [total]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      const { minX, cardStep, maxIdx } = calculateLimits();
      // Clamp current position
      const clampedX = Math.max(minX, Math.min(0, targetXRef.current));
      targetXRef.current = clampedX;
      currentXRef.current = clampedX;
      if (trackRef.current) {
        gsap.set(trackRef.current, { x: clampedX });
      }
      const idx = Math.round(-clampedX / cardStep);
      setCurrentIndex(Math.min(maxIdx, Math.max(0, idx)));
    };

    calculateLimits();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateLimits]);

  // ── 2. Switch Tabs with Clean Fade-in ──────────────────────────────────────
  const handleTabChange = (newTab: "new" | "top") => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setCurrentIndex(0);
    targetXRef.current = 0;
    currentXRef.current = 0;

    if (trackRef.current) {
      gsap.killTweensOf(trackRef.current);
      gsap.fromTo(
        trackRef.current,
        {
          opacity: 0,
          x: newTab === "top" ? 40 : -40,
          filter: "blur(10px)",
        },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power3.out",
          clearProps: "filter",
        }
      );
    }
  };

  // ── 3. Smooth Navigation to a Specific Index ──────────────────────────────
  const animateToX = useCallback((newX: number, duration = 0.65) => {
    const { minX, cardStep, maxIdx } = calculateLimits();
    const clampedX = Math.max(minX, Math.min(0, newX));
    targetXRef.current = clampedX;
    currentXRef.current = clampedX;

    if (trackRef.current) {
      gsap.to(trackRef.current, {
        x: clampedX,
        duration: duration,
        ease: "power3.out",
        overwrite: "auto",
        onUpdate: () => {
          if (trackRef.current) {
            const x = gsap.getProperty(trackRef.current, "x") as number;
            currentXRef.current = x;
            const currentIdx = Math.round(-x / cardStep);
            setCurrentIndex(Math.min(maxIdx, Math.max(0, currentIdx)));
          }
        },
      });
    }
  }, [calculateLimits]);

  const goToCard = useCallback((index: number) => {
    const { cardStep } = calculateLimits();
    animateToX(-index * cardStep);
  }, [calculateLimits, animateToX]);

  const goNext = useCallback(() => {
    const nextIdx = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    goToCard(nextIdx);
  }, [currentIndex, maxIndex, goToCard]);

  const goPrev = useCallback(() => {
    const prevIdx = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    goToCard(prevIdx);
  }, [currentIndex, maxIndex, goToCard]);

  // ── 3.5. Autoplay (5s Interval) ─────────────────────────────────────────────
  const isHoveredRef = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPressedRef.current && !isDraggingRef.current && !isHoveredRef.current) {
        goNext();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [goNext]);

  // ── 4. Robust GSAP Mouse / Touch Drag Engine ───────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button (0) or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const track = trackRef.current;
    if (!track) return;

    calculateLimits();
    gsap.killTweensOf(track);

    isPressedRef.current = true;
    isDraggingRef.current = false;
    dragStartXRef.current = e.clientX;
    trackStartXRef.current = gsap.getProperty(track, "x") as number || 0;
    currentXRef.current = trackStartXRef.current;
    targetXRef.current = trackStartXRef.current;
    lastMouseXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityXRef.current = 0;
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isPressedRef.current) return;

      // Absolute safety guard: If user released left mouse button, cancel drag immediately
      if (e.pointerType === "mouse" && e.buttons !== 1) {
        isPressedRef.current = false;
        return;
      }

      const deltaX = e.clientX - dragStartXRef.current;
      if (Math.abs(deltaX) > 6) {
        isDraggingRef.current = true;
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      velocityXRef.current = (e.clientX - lastMouseXRef.current) / dt;
      lastMouseXRef.current = e.clientX;
      lastTimeRef.current = now;

      // Direct dragging position with boundary resistance (rubber-band)
      const minX = minXRef.current;
      let rawX = trackStartXRef.current + deltaX;

      if (rawX > 0) {
        rawX = rawX * 0.3; // Right pull resistance
      } else if (rawX < minX) {
        rawX = minX + (rawX - minX) * 0.3; // Left pull resistance
      }

      targetXRef.current = rawX;
      currentXRef.current = rawX;

      if (trackRef.current) {
        gsap.set(trackRef.current, { x: rawX });
      }
    };

    const handleGlobalPointerUp = () => {
      if (!isPressedRef.current) return;
      isPressedRef.current = false;

      const track = trackRef.current;
      if (!track) return;

      const { minX, cardStep, maxIdx } = calculateLimits();
      const currentPos = gsap.getProperty(track, "x") as number;

      // Calculate inertia target based on release velocity
      const velocity = velocityXRef.current;
      const momentumDistance = velocity * 180;
      const projectedX = currentPos + momentumDistance;

      // Snap to nearest card step
      const nearestCardIdx = Math.round(-projectedX / cardStep);
      const clampedIdx = Math.min(maxIdx, Math.max(0, nearestCardIdx));
      const snapTargetX = Math.max(minX, Math.min(0, -clampedIdx * cardStep));

      gsap.to(track, {
        x: snapTargetX,
        duration: Math.min(0.85, Math.max(0.4, 0.5 + Math.abs(velocity) * 0.2)),
        ease: "power3.out",
        overwrite: "auto",
        onUpdate: () => {
          if (trackRef.current) {
            const x = gsap.getProperty(trackRef.current, "x") as number;
            currentXRef.current = x;
            const idx = Math.round(-x / cardStep);
            setCurrentIndex(Math.min(maxIdx, Math.max(0, idx)));
          }
        },
      });

      // Clear dragging state slightly after release so clicks don't accidentally navigate
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 60);
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [calculateLimits]);

  // ── 5. Trackpad & Wheel Horizontal Scrolling ──────────────────────────────
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Only capture if scrolling horizontally or Shift key is held
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (delta === 0) return;

    e.preventDefault();
    const { minX, cardStep, maxIdx } = calculateLimits();
    const newTargetX = Math.max(minX, Math.min(0, targetXRef.current - delta * 1.2));
    targetXRef.current = newTargetX;

    if (trackRef.current) {
      gsap.to(trackRef.current, {
        x: newTargetX,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          if (trackRef.current) {
            const x = gsap.getProperty(trackRef.current, "x") as number;
            currentXRef.current = x;
            const idx = Math.round(-x / cardStep);
            setCurrentIndex(Math.min(maxIdx, Math.max(0, idx)));
          }
        },
      });
    }
  };

  // ── 6. Scroll-Triggered Stagger Card Animation ────────────────────────────
  useGSAP(() => {
    if (!isPreloaderFinished) {
      gsap.set(".showcase-card", { opacity: 0, y: 60, x: -30 });
      return;
    }

    // Kill any previous ScrollTriggers scoped to this container
    ScrollTrigger.getAll()
      .filter((st) => st.vars?.id === "showcase-stagger")
      .forEach((st) => st.kill());

    const cards = gsap.utils.toArray<HTMLElement>(".showcase-card", containerRef.current!);
    if (cards.length === 0) return;

    // Set all cards hidden initially
    gsap.set(cards, { opacity: 0, y: 60, x: -30, scale: 0.97 });

    // Create a timeline triggered by the section entering the viewport
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",       // fires when section top reaches 80% of viewport
        end: "top 30%",
        toggleActions: "play none none none",
        id: "showcase-stagger",
      },
    });

    tl.to(cards, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: 0.7,
      stagger: {
        each: 0.09,           // 90ms gap between each card
        from: "start",        // left to right
        ease: "power2.out",
      },
      ease: "power3.out",
      clearProps: "transform",
    });

    return () => {
      ScrollTrigger.getAll()
        .filter((st) => st.vars?.id === "showcase-stagger")
        .forEach((st) => st.kill());
    };
  }, { dependencies: [isPreloaderFinished], scope: containerRef });

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col select-none"
    >
      {/* ── 1. Header with Animated Tabs ── */}
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

      {/* ── 2. GSAP Draggable Viewport & Track ──────────────────────────────── */}
      <div 
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => (isHoveredRef.current = true)}
        onMouseLeave={() => (isHoveredRef.current = false)}
        className="w-full overflow-hidden mb-4 py-2 cursor-grab active:cursor-grabbing touch-pan-y select-none"
      >
        <div
          ref={trackRef}
          className="flex gap-4 md:gap-6 will-change-transform"
          style={{ transform: "translate3d(0px, 0px, 0px)" }}
        >
          {currentList.map((product, productIdx) => {
            const imgUrl = product.images[0]?.url || "/placeholder.jpg";
            const hoverImgUrl = product.images[1]?.url || null;

            return (
              <Link
                key={`${activeTab}-${product.id || productIdx}`}
                href={`/product/${product.id}`}
                onClick={(e) => {
                  // Prevent navigation if the user was actively dragging
                  if (isDraggingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="showcase-card interactive-card group flex flex-col shrink-0 w-[160px] sm:w-[200px] md:w-[240px] lg:w-[calc(16.666%-20px)] select-none"
              >
                {/* Borderless Floating Image Container with Alternate View on Hover */}
                <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-black/[0.02] group-hover:bg-black/[0.05] transition-colors duration-500">
                  
                  {/* Minimalist Brand "NEW" Label */}
                  {product.isNew && (
                    <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-[#232D3B] text-white px-1.5 py-0.5 shadow-sm">
                        NEW
                      </span>
                    </div>
                  )}

                  {/* Add to Bag Button Top Right */}
                  <div onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}>
                    <AddToBagButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: imgUrl,
                        isSoldOut: product.isSoldOut,
                      }}
                      className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-white text-y2k-gunmetal hover:text-black z-20 shadow-sm rounded-none border-0"
                    />
                  </div>

                  {/* Base Product Image */}
                  <Image
                    src={imgUrl}
                    alt={product.name}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 16vw"
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
                      sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 16vw"
                      className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2] select-none pointer-events-none"
                    />
                  )}

                  {/* Sold Out Badge */}
                  {product.isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                      <span className="bg-[#232D3B] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-wider">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details Below Image */}
                <div className="flex flex-col pt-3 pb-1 pointer-events-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 truncate">
                    {product.brand || "BAGIFYYYY ARCHIVE"}
                  </p>
                  <h3 className="font-sans text-xs md:text-[13px] font-semibold text-y2k-gunmetal group-hover:text-black transition-colors line-clamp-2 leading-snug mt-0.5">
                    {product.name}
                  </h3>
                  <p className="font-bold font-sans text-xs md:text-sm font-extrabold text-y2k-gunmetal mt-1.5">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-y2k-gunmetal/45 font-medium capitalize mt-0.5 truncate">
                    {product.category || "Topwears"} · Archive Edition
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 3. Continuous Scroll Progress Line (Phone & Desktop) ──────────────── */}
      <div className="w-full mt-2 mb-4 px-1">
        <div className="relative w-full h-[1.5px] bg-gray-200 overflow-hidden">
          <div
            className="absolute top-0 h-full bg-y2k-gunmetal transition-all duration-150 ease-out"
            style={{
              width: `${Math.max(15, 100 / Math.max(1, total))}%`,
              left: `${maxIndex > 0 ? (currentIndex / maxIndex) * (100 - Math.max(15, 100 / Math.max(1, total))) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* ── 4. Synchronized Controls Below Track ─────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-1">
        {/* Left: Product Counter */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal/60">
          <span className="text-y2k-gunmetal">{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="opacity-30">/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>

        {/* Center: Slide Step Indicators */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToCard(i)}
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
            className="w-8 h-8 rounded-full border border-y2k-gunmetal/10 hover:border-y2k-gunmetal hover:bg-y2k-gunmetal hover:text-white flex items-center justify-center text-y2k-gunmetal transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next products"
            className="w-8 h-8 rounded-full border border-y2k-gunmetal/10 hover:border-y2k-gunmetal hover:bg-y2k-gunmetal hover:text-white flex items-center justify-center text-y2k-gunmetal transition-all cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
