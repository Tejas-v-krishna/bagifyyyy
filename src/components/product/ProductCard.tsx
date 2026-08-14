"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/components/ui/WishlistButton";
import gsap from "gsap";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  category: string;
  brand?: string;
  isNew?: boolean;
  isSoldOut?: boolean;
  isBestSeller?: boolean;
  colors?: string[];
  sizes?: string[];
  description?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const floodRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !badgeRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(badgeRef.current, {
      x,
      y,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !badgeRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Position badge at cursor and scale up
    gsap.set(badgeRef.current, { x, y, scale: 0, opacity: 0 });
    gsap.to(badgeRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: "back.out(1.7)",
      overwrite: "auto",
    });

    // Animate chromatic green ripple expansion from entry point
    if (floodRef.current) {
      gsap.set(floodRef.current, { left: x, top: y, scale: 0, opacity: 0.85 });
      gsap.to(floodRef.current, {
        scale: 65,
        opacity: 0.75,
        duration: 0.65,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (badgeRef.current) {
      gsap.to(badgeRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        overwrite: "auto",
      });
    }
    if (floodRef.current) {
      gsap.to(floodRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto",
      });
    }
  }, []);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col w-full h-full bg-[#EAE8E3] hover:bg-[#E2DFD8] transition-colors duration-500 relative pb-3 overflow-hidden font-sans"
    >
      {/* ── Image Container with Chromatic Green Ripple & Cursor Magnet Badge ── */}
      <div
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-[#EAE8E3] cursor-pointer"
      >
        {/* Base Product Image */}
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className={`object-cover mix-blend-multiply transition-all duration-700 ease-out group-hover:scale-105 ${
                product.isSoldOut ? "blur-md scale-105 opacity-80" : ""
              }`}
            />

            {/* Hover Image (if available) */}
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt={`${product.name} alternate view`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-[5]"
              />
            )}

            {/* Chromatic Green Ripple Expansion Flood */}
            <div
              ref={floodRef}
              className="absolute w-4 h-4 bg-[#00E575] rounded-full pointer-events-none mix-blend-multiply opacity-0 z-10"
              style={{ transform: "translate(-50%, -50%) scale(0)" }}
            />

            {/* Idle Chromatic Green Accent Dot on Right Edge */}
            <div className="absolute right-2.5 bottom-1/4 w-2.5 h-2.5 rounded-full bg-[#00E575] shadow-sm z-20 group-hover:scale-0 transition-transform duration-300 pointer-events-none" />

            {/* Cursor-Following "VIEW MORE" Floating Badge */}
            <div
              ref={badgeRef}
              className="absolute pointer-events-none z-30 opacity-0"
              style={{ transform: "translate(-50%, -50%) scale(0)" }}
            >
              <div className="w-18 h-18 md:w-20 md:h-20 rounded-full bg-[#00E575] text-y2k-gunmetal flex items-center justify-center text-center text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-2xl border border-white/40">
                VIEW MORE
              </div>
            </div>

            {/* Sold Out Overlay */}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="bg-[#EAE8E3] text-y2k-gunmetal text-xs font-black px-4 md:px-5 py-2 uppercase tracking-wider rounded shadow-md border border-y2k-gunmetal/20">
                  SOLD OUT
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#EAE8E3]" />
        )}

        {/* "NEW" Label Top Left */}
        {product.isNew && (
          <div className="absolute top-3 left-3 z-20">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal bg-white/95 px-2.5 py-1 shadow-sm border border-y2k-gunmetal/10">
              NEW
            </span>
          </div>
        )}

        {/* Wishlist Button Top Right */}
        <WishlistButton
          productId={product.id}
          className="!top-3 !bottom-auto !right-3 !p-2 bg-white/90 text-y2k-gunmetal hover:text-[#00E575] z-20 shadow-sm rounded-sm backdrop-blur-sm"
        />
      </div>

      {/* ── Bottom Text Bar in Brand Bluish-Grey & Gunmetal Palette ────────── */}
      <div className="flex flex-col px-3.5 pt-3 mt-auto justify-start">
        {/* Name and Price Row */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-sans text-sm md:text-[15px] font-semibold text-y2k-gunmetal group-hover:text-y2k-deep transition-colors truncate leading-tight tracking-tight">
            {product.name}
          </h3>
          <p className="font-sans text-sm md:text-[15px] font-bold text-y2k-gunmetal shrink-0 tracking-tight">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Category Specimen Row with Chromatic Green Dot */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-[#00E575] shrink-0" />
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-y2k-slate">
            {product.category || "ARCHIVE"}
          </span>
        </div>
      </div>
    </Link>
  );
}
