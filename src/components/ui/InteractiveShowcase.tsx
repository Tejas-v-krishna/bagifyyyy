"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import WishlistButton from "@/components/ui/WishlistButton";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  isSoldOut: boolean;
  isNew?: boolean;
  category?: string;
  images: { url: string }[];
};

export default function InteractiveShowcase({ products }: { products: Product[] }) {
  const total = products.length;

  // viewStart: which product is the leftmost card in the visible window
  const [viewStart, setViewStart] = useState(0);
  // activeProductIdx: which product index is selected (null = idle)
  const [activeProductIdx, setActiveProductIdx] = useState<number | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevOffsets = useRef<Record<number, number>>({});

  const isActive = activeProductIdx !== null;
  const activeProduct = isActive ? products[activeProductIdx!] : null;

  // ── Window Resize Listener ────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine number of visible slots based on responsive width
  const visibleSlots = windowWidth < 768 ? 2 : windowWidth < 1024 ? 3 : 5;
  const halfSlots = (visibleSlots - 1) / 2;

  // ── Click to Activate ─────────────────────────────────────────────────────
  const onCardClick = useCallback((productIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeProductIdx === productIdx) {
      setActiveProductIdx(null);
      setImgIdx(0);
    } else {
      setActiveProductIdx(productIdx);
      setImgIdx(0);
    }
  }, [activeProductIdx]);

  const onContainerClick = useCallback(() => {
    if (activeProductIdx !== null) {
      setActiveProductIdx(null);
      setImgIdx(0);
    }
  }, [activeProductIdx]);

  // ── Arrow navigation ──────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setActiveProductIdx(null);
    setImgIdx(0);
    setViewStart((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveProductIdx(null);
    setImgIdx(0);
    setViewStart((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goTo = useCallback((idx: number) => {
    setActiveProductIdx(null);
    setImgIdx(0);
    setViewStart(idx % total);
  }, [total]);

  // ── Image slideshow on active card ────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setImgIdx((i) => i + 1), 1400);
    return () => clearInterval(interval);
  }, [activeProductIdx, isActive]);

  // ── Snap into view when activating ────────────────────────────────────────
  useEffect(() => {
    if (activeProductIdx !== null && containerRef.current) {
      if (typeof window !== "undefined" && (window as any).__lenis) {
        (window as any).__lenis.scrollTo(containerRef.current, { offset: -80, duration: 0.8 });
      }
    }
  }, [activeProductIdx]);

  // ── Image Blur Transition ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || activeProductIdx === null) return;
    const imgEl = document.querySelector(`.showcase-card-${activeProductIdx} img`) as HTMLElement;
    if (!imgEl) return;
    gsap.killTweensOf(imgEl);
    gsap.fromTo(
      imgEl,
      { filter: "blur(8px)", opacity: 0.7 },
      { filter: "blur(0px)", opacity: 1, duration: 0.5, ease: "power2.out" }
    );
  }, [imgIdx, activeProductIdx, isActive]);

  // ── GSAP Layout Positioning: Expand from bottom on select ─────────────────
  useGSAP(() => {
    if (total === 0) return;

    products.forEach((_, productIdx) => {
      // Offset relative to current viewStart
      const normalizedOffset = ((productIdx - viewStart) % total + total) % total;

      let slotIndex = normalizedOffset;
      const rightCapacity = Math.ceil((total - visibleSlots) / 2);
      if (slotIndex >= visibleSlots + rightCapacity) {
        slotIndex -= total; // Wrap to left
      }

      const isVisible = slotIndex >= 0 && slotIndex < visibleSlots;
      // Physical position offset relative to center
      const xSlot = slotIndex - halfSlots;
      const isSelected = activeProductIdx === productIdx;

      const prevX = prevOffsets.current[productIdx];

      // Instant teleport if card jumped across the wrap boundary
      if (prevX !== undefined && Math.abs(xSlot - prevX) > visibleSlots) {
        gsap.set(`.showcase-card-${productIdx}`, {
          xPercent: xSlot * 100,
          opacity: 0,
        });
      }

      gsap.to(`.showcase-card-${productIdx}`, {
        xPercent: xSlot * 100,
        scaleY: isSelected ? 1.09 : 1, // Grow larger downwards from top
        scaleX: 1, // Keep scaleX at 1 so no horizontal overlap with neighbors
        transformOrigin: "top center",
        opacity: isVisible ? 1 : 0,
        zIndex: isSelected ? 35 : isVisible ? 10 : 0,
        boxShadow: isSelected
          ? "0 25px 50px -12px rgba(40, 50, 63, 0.3)"
          : "0 0 0 0 transparent",
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });

      prevOffsets.current[productIdx] = xSlot;
    });

    // ── Details panel animation ─────────────────────────────────────────────
    if (isActive && activeProduct) {
      gsap.killTweensOf(".reveal-char, .reveal-item");
      gsap.to(".details-panel", { opacity: 1, height: "auto", duration: 0.5, ease: "power2.out" });
      gsap.fromTo(
        ".reveal-char",
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.015, duration: 0.6, ease: "power3.out", delay: 0.05 }
      );
      gsap.fromTo(
        ".reveal-item",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power3.out", delay: 0.15 }
      );
    } else {
      gsap.to(".details-panel", { opacity: 0, height: 0, duration: 0.3, ease: "power2.in" });
    }
  }, { dependencies: [activeProductIdx, isActive, viewStart, visibleSlots, windowWidth], scope: containerRef });

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col select-none"
      onClick={onContainerClick}
    >
      {/* ── Card track ────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[85vw] sm:h-[70vw] md:h-[39vw] xl:h-[630px] flex items-start justify-center mt-6 mb-2 overflow-visible">
        {/* ALL products rendered into fixed relative slots */}
        {products.map((product, productIdx) => {
          const isThisActive = isActive && productIdx === activeProductIdx;

          const imgUrl =
            product.images.length > 0
              ? product.images[(isThisActive ? imgIdx : 0) % product.images.length]?.url
              : null;

          return (
            <div
              key={product.id || productIdx}
              className={`showcase-card-${productIdx}
                         absolute top-0
                         w-[48%] md:w-[32%] lg:w-[19.6%] aspect-[2/3]
                         bg-[#f4f4f4] flex flex-col will-change-transform
                         cursor-pointer
                         border-r border-b border-t border-y2k-gunmetal/15 overflow-hidden transition-colors
                         ${isThisActive ? "ring-2 ring-y2k-gunmetal z-30" : "hover:bg-[#eae8e3]"}`}
              onClick={(e) => onCardClick(productIdx, e)}
            >
              {/* Image Container */}
              <div className="relative w-full h-[76%] flex items-center justify-center overflow-hidden bg-[#f4f4f4]">
                {imgUrl ? (
                  <>
                    <Image
                      src={imgUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className={`object-cover mix-blend-multiply transition-transform duration-700 ${
                        product.isSoldOut ? "blur-md scale-105 opacity-80" : ""
                      }`}
                    />
                    {product.isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="bg-[#EAE8E3] text-y2k-gunmetal text-[10px] md:text-xs font-black px-4 py-1.5 uppercase tracking-wider rounded shadow-sm">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-[#f4f4f4]" />
                )}

                {/* "NEW" Label Top Left */}
                {product.isNew && (
                  <div className="absolute top-2.5 left-2.5 z-20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 bg-white/90 px-2 py-0.5 shadow-sm">
                      NEW
                    </span>
                  </div>
                )}

                {/* Small category label Bottom Left */}
                <div className="absolute bottom-2.5 left-2.5 z-20 bg-white px-2 py-0.5 flex items-center shadow-sm rounded-sm">
                  <span className="text-[9px] md:text-[10px] font-semibold text-y2k-gunmetal tracking-wider uppercase">
                    {product.category || "ARCHIVE"}
                  </span>
                </div>

                {/* Wishlist Button Bottom Right */}
                <WishlistButton
                  productId={product.id}
                  className="!top-auto !bottom-2.5 !right-2.5 !p-1.5 bg-white text-y2k-gunmetal hover:text-red-500 z-20 shadow-sm rounded-sm"
                />
              </div>

              {/* Text Container at bottom */}
              <div className="w-full h-[24%] flex flex-col justify-center px-3.5 bg-white border-t border-y2k-gunmetal/10">
                <h3 className="font-sans text-xs md:text-[13px] font-semibold tracking-normal text-y2k-gunmetal truncate mb-0.5 leading-snug">
                  {product.name}
                </h3>
                <p className="font-sans text-xs md:text-[13px] font-bold text-y2k-gunmetal/85 tracking-normal">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Under-Card Navigation Controls ─────────────────────────────────── */}
      <div className="w-full flex items-center justify-between mt-4 px-2 md:px-4">
        {/* Left: Product Counter */}
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-y2k-slate">
          <span className="text-y2k-gunmetal">{String(viewStart + 1).padStart(2, "0")}</span>
          <span className="text-y2k-slate/40">/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>

        {/* Center: Clean Progress Bar Dots */}
        <div className="flex items-center gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === viewStart
                  ? "w-6 bg-y2k-gunmetal"
                  : "w-2 bg-y2k-gunmetal/20 hover:bg-y2k-gunmetal/50"
              }`}
            />
          ))}
        </div>

        {/* Right: Arrow Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous products"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-y2k-gunmetal text-y2k-gunmetal hover:text-white border border-y2k-gunmetal/20 shadow-sm transition-all rounded-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next products"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-y2k-gunmetal text-y2k-gunmetal hover:text-white border border-y2k-gunmetal/20 shadow-sm transition-all rounded-sm cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Details panel ─────────────────────────────────────────────────── */}
      <div
        className="details-panel w-full overflow-hidden opacity-0 h-0 mt-6"
        onClick={(e) => e.stopPropagation()}
      >
        {activeProduct && (
          <div className="w-full pt-6 pb-10 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-y2k-gunmetal/15">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-5">
              <h3 className="font-display font-medium text-4xl md:text-5xl lg:text-[60px] uppercase tracking-[-0.06em] leading-[0.85] m-0 text-y2k-gunmetal flex flex-wrap gap-x-3">
                {activeProduct.name.split(" ").map((word, wIdx) => (
                  <span key={wIdx} className="inline-flex">
                    {word.split("").map((char, cIdx) => (
                      <span key={cIdx} className="reveal-char inline-block">
                        {char}
                      </span>
                    ))}
                    <span className="reveal-char inline-block">&nbsp;</span>
                  </span>
                ))}
              </h3>
              <Link
                href={`/product/${activeProduct.id}`}
                className="reveal-item shrink-0 px-7 py-3.5 border-2 border-y2k-gunmetal
                           text-y2k-gunmetal text-xs md:text-sm font-bold uppercase tracking-wider
                           hover:bg-y2k-gunmetal hover:text-y2k-ice transition-colors flex items-center gap-3"
              >
                {activeProduct.isSoldOut ? "SOLD OUT" : "View product"}{" "}
                <ShoppingBag className="w-4 h-4" />
              </Link>
            </div>

            <hr className="reveal-item border-t border-y2k-gunmetal/20 mb-5" />

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-20">
              <div className="reveal-item text-2xl md:text-3xl font-medium tracking-normal text-y2k-gunmetal shrink-0">
                ₹{activeProduct.price.toLocaleString("en-IN")}
              </div>
              <p className="reveal-item text-xs md:text-sm text-y2k-slate font-medium leading-relaxed max-w-xl">
                {activeProduct.description ||
                  "Archival piece constructed with heavy tailoring and custom distressed hardware."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
