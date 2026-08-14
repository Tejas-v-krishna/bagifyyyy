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

  // ── Cursor Follower Handlers (Locked to Cursor Position) ──────────────────
  const handleCardMouseMove = useCallback((productIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(`.showcase-badge-${productIdx}`, {
      x,
      y,
      xPercent: -50,
      yPercent: -50,
      duration: 0.12,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, []);

  const handleCardMouseEnter = useCallback((productIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(`.showcase-badge-${productIdx}`, {
      x,
      y,
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 0,
    });
    gsap.to(`.showcase-badge-${productIdx}`, {
      scale: 1,
      opacity: 1,
      duration: 0.25,
      ease: "back.out(1.7)",
      overwrite: "auto",
    });

    gsap.set(`.showcase-flood-${productIdx}`, { left: x, top: y, scale: 0, opacity: 0.9 });
    gsap.to(`.showcase-flood-${productIdx}`, {
      scale: 65,
      opacity: 0.8,
      duration: 0.55,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, []);

  const handleCardMouseLeave = useCallback((productIdx: number) => {
    gsap.to(`.showcase-badge-${productIdx}`, {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      overwrite: "auto",
    });
    gsap.to(`.showcase-flood-${productIdx}`, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      overwrite: "auto",
    });
  }, []);

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
      const normalizedOffset = ((productIdx - viewStart) % total + total) % total;

      let slotIndex = normalizedOffset;
      const rightCapacity = Math.ceil((total - visibleSlots) / 2);
      if (slotIndex >= visibleSlots + rightCapacity) {
        slotIndex -= total;
      }

      const isVisible = slotIndex >= 0 && slotIndex < visibleSlots;
      const xSlot = slotIndex - halfSlots;
      const isSelected = activeProductIdx === productIdx;

      const prevX = prevOffsets.current[productIdx];

      if (prevX !== undefined && Math.abs(xSlot - prevX) > visibleSlots) {
        gsap.set(`.showcase-card-${productIdx}`, {
          xPercent: xSlot * 100,
          opacity: 0,
        });
      }

      gsap.to(`.showcase-card-${productIdx}`, {
        xPercent: xSlot * 100,
        scale: isSelected ? 1.07 : 1, // Uniform proportional scale - no stretching
        transformOrigin: "center center",
        opacity: isVisible ? 1 : 0,
        zIndex: isSelected ? 35 : isVisible ? 10 : 0,
        boxShadow: isSelected
          ? "0 25px 50px -12px rgba(40, 50, 63, 0.3)"
          : "0 0 0 0 transparent",
        duration: 0.5,
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
                         group
                         absolute top-0
                         w-[48%] md:w-[32%] lg:w-[19.6%] aspect-[2/3]
                         bg-[#E8EDF2] flex flex-col will-change-transform
                         cursor-pointer
                         border-r border-b border-t border-[#A8B8CB]/50 overflow-hidden transition-colors duration-500
                         ${isThisActive ? "ring-2 ring-[#28323F] z-30" : "hover:bg-[#E8EDF2]"}`}
              onClick={(e) => onCardClick(productIdx, e)}
            >
              {/* Image Container with Pale Chrome (#C7D2DE) Background on Hover & Cursor Magnet Badge */}
              <div
                onMouseMove={(e) => handleCardMouseMove(productIdx, e)}
                onMouseEnter={(e) => handleCardMouseEnter(productIdx, e)}
                onMouseLeave={() => handleCardMouseLeave(productIdx)}
                className="relative w-full h-[75%] flex items-center justify-center overflow-hidden bg-[#E8EDF2] group-hover:bg-[#C7D2DE] transition-colors duration-500 cursor-pointer"
              >
                {/* Pale Chrome (#C7D2DE) Background Ripple Flood (Behind Image) */}
                <div
                  className={`showcase-flood-${productIdx} absolute w-4 h-4 bg-[#C7D2DE] rounded-full pointer-events-none opacity-0 z-0`}
                  style={{ transform: "translate(-50%, -50%) scale(0)" }}
                />

                {imgUrl ? (
                  <>
                    <Image
                      src={imgUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className={`object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105 z-[1] ${
                        product.isSoldOut ? "blur-md scale-105 opacity-80" : ""
                      }`}
                    />

                    {/* Idle Soft Steel (#A8B8CB) Accent Dot on Right Edge */}
                    <div className="absolute right-2 bottom-1/4 w-2.5 h-2.5 rounded-full bg-[#A8B8CB] border border-[#8598B0]/50 shadow-sm z-10 group-hover:scale-0 transition-transform duration-300 pointer-events-none" />

                    {/* Cursor-Locked "VIEW MORE" Magnet Badge in Gunmetal (#28323F) */}
                    <div
                      className={`showcase-badge-${productIdx} absolute top-0 left-0 pointer-events-none z-30 opacity-0 will-change-transform`}
                    >
                      <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-[#28323F] text-[#E8EDF2] flex items-center justify-center text-center text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-wider shadow-2xl border border-[#A8B8CB]">
                        VIEW MORE
                      </div>
                    </div>

                    {/* Sold Out Badge */}
                    {product.isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <span className="bg-[#E8EDF2] text-[#28323F] text-[10px] md:text-xs font-black px-4 py-1.5 uppercase tracking-wider rounded shadow-sm border border-[#A8B8CB]">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-[#E8EDF2]" />
                )}

                {/* "NEW" Label Top Left */}
                {product.isNew && (
                  <div className="absolute top-2.5 left-2.5 z-20">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#28323F] bg-[#E8EDF2] px-2 py-0.5 shadow-sm border border-[#A8B8CB]">
                      NEW
                    </span>
                  </div>
                )}

                {/* Wishlist Button Top Right */}
                <WishlistButton
                  productId={product.id}
                  className="!top-2.5 !bottom-auto !right-2.5 !p-1.5 bg-[#E8EDF2]/90 text-[#28323F] hover:text-[#5F7591] z-20 shadow-sm rounded-sm backdrop-blur-sm border border-[#A8B8CB]/50"
                />
              </div>

              {/* Text Container at bottom (Brand Bluish-Grey & Gunmetal Palette) */}
              <div className="w-full h-[25%] flex flex-col justify-center px-3 bg-[#E8EDF2] border-t border-[#A8B8CB]/40">
                <div className="flex items-baseline justify-between gap-1.5">
                  <h3 className="font-sans text-xs md:text-[13px] font-semibold text-[#28323F] group-hover:text-[#3E4E64] transition-colors truncate leading-tight tracking-tight">
                    {product.name}
                  </h3>
                  <p className="font-sans text-xs md:text-[13px] font-bold text-[#28323F] shrink-0 tracking-tight">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8CB] shrink-0 border border-[#8598B0]/40" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#5F7591]">
                    {product.category || "ARCHIVE"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Under-Card Navigation Controls ─────────────────────────────────── */}
      <div className="w-full flex items-center justify-between mt-4 px-2 md:px-4">
        {/* Left: Product Counter */}
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5F7591]">
          <span className="text-[#28323F]">{String(viewStart + 1).padStart(2, "0")}</span>
          <span className="text-[#8598B0]/60">/</span>
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
                  ? "w-6 bg-[#28323F]"
                  : "w-2 bg-[#A8B8CB]/50 hover:bg-[#5F7591]"
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
            className="w-10 h-10 flex items-center justify-center bg-[#E8EDF2] hover:bg-[#28323F] text-[#28323F] hover:text-[#E8EDF2] border border-[#A8B8CB] shadow-sm transition-all rounded-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next products"
            className="w-10 h-10 flex items-center justify-center bg-[#E8EDF2] hover:bg-[#28323F] text-[#28323F] hover:text-[#E8EDF2] border border-[#A8B8CB] shadow-sm transition-all rounded-sm cursor-pointer"
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
          <div className="w-full pt-6 pb-10 px-4 md:px-8 max-w-[1400px] mx-auto border-t border-[#A8B8CB]/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-5">
              <h3 className="font-display font-medium text-4xl md:text-5xl lg:text-[60px] uppercase tracking-[-0.06em] leading-[0.85] m-0 text-[#28323F] flex flex-wrap gap-x-3">
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
                className="reveal-item shrink-0 px-7 py-3.5 border-2 border-[#28323F]
                           text-[#28323F] text-xs md:text-sm font-bold uppercase tracking-wider
                           hover:bg-[#28323F] hover:text-[#E8EDF2] transition-colors flex items-center gap-3"
              >
                {activeProduct.isSoldOut ? "SOLD OUT" : "View product"}{" "}
                <ShoppingBag className="w-4 h-4" />
              </Link>
            </div>

            <hr className="reveal-item border-t border-[#A8B8CB]/40 mb-5" />

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-20">
              <div className="reveal-item text-2xl md:text-3xl font-medium tracking-normal text-[#28323F] shrink-0">
                ₹{activeProduct.price.toLocaleString("en-IN")}
              </div>
              <p className="reveal-item text-xs md:text-sm text-[#5F7591] font-medium leading-relaxed max-w-xl">
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
