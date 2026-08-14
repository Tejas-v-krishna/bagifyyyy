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
      xPercent: -50,
      yPercent: -50,
      duration: 0.12,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !badgeRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Position badge exactly centered at cursor and scale up
    gsap.set(badgeRef.current, {
      x,
      y,
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 0,
    });
    gsap.to(badgeRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.25,
      ease: "back.out(1.7)",
      overwrite: "auto",
    });

    // Animate Pale Chrome / Soft Steel (#C7D2DE) background ripple expansion
    if (floodRef.current) {
      gsap.set(floodRef.current, { left: x, top: y, scale: 0, opacity: 0.9 });
      gsap.to(floodRef.current, {
        scale: 65,
        opacity: 0.8,
        duration: 0.55,
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
        duration: 0.25,
        ease: "power2.in",
        overwrite: "auto",
      });
    }
  }, []);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col w-full h-full bg-[#E8EDF2] hover:bg-[#E8EDF2] transition-colors duration-500 relative pb-3 overflow-hidden font-sans border border-[#A8B8CB]/50"
    >
      {/* ── Image Container with Background Ripple & Precise Cursor Magnet Badge ── */}
      <div
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-[#E8EDF2] group-hover:bg-[#C7D2DE] transition-colors duration-500 cursor-pointer"
      >
        {/* Pale Chrome (#C7D2DE) Background Ripple Flood (Behind Image) */}
        <div
          ref={floodRef}
          className="absolute w-4 h-4 bg-[#C7D2DE] rounded-full pointer-events-none opacity-0 z-0"
          style={{ transform: "translate(-50%, -50%) scale(0)" }}
        />

        {/* Base Product Image */}
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className={`object-cover mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-105 z-[1] ${
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
                className="object-cover mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-[2]"
              />
            )}

            {/* Idle Soft Steel (#A8B8CB) Accent Dot on Right Edge */}
            <div className="absolute right-2.5 bottom-1/4 w-2.5 h-2.5 rounded-full bg-[#A8B8CB] border border-[#8598B0]/50 shadow-sm z-10 group-hover:scale-0 transition-transform duration-300 pointer-events-none" />

            {/* Cursor-Locked "VIEW MORE" Floating Badge */}
            <div
              ref={badgeRef}
              className="absolute top-0 left-0 pointer-events-none z-30 opacity-0 will-change-transform"
            >
              <div className="w-18 h-18 md:w-20 md:h-20 rounded-full bg-[#28323F] text-[#E8EDF2] flex items-center justify-center text-center text-[9px] md:text-[10px] font-bold uppercase tracking-wider shadow-2xl border border-[#A8B8CB]">
                VIEW MORE
              </div>
            </div>

            {/* Sold Out Overlay */}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="bg-[#E8EDF2] text-[#28323F] text-xs font-black px-4 md:px-5 py-2 uppercase tracking-wider rounded shadow-md border border-[#A8B8CB]">
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
          <div className="absolute top-3 left-3 z-20">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[#28323F] bg-[#E8EDF2] px-2.5 py-1 shadow-sm border border-[#A8B8CB]">
              NEW
            </span>
          </div>
        )}

        {/* Wishlist Button Top Right */}
        <WishlistButton
          productId={product.id}
          className="!top-3 !bottom-auto !right-3 !p-2 bg-[#E8EDF2]/90 text-[#28323F] hover:text-[#5F7591] z-20 shadow-sm rounded-sm backdrop-blur-sm border border-[#A8B8CB]/50"
        />
      </div>

      {/* ── Bottom Text Bar in Exact Palette Colors ────────────────────────── */}
      <div className="flex flex-col px-3.5 pt-3 mt-auto justify-start bg-[#E8EDF2]">
        {/* Name and Price Row */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-sans text-sm md:text-[15px] font-semibold text-[#28323F] group-hover:text-[#3E4E64] transition-colors truncate leading-tight tracking-tight">
            {product.name}
          </h3>
          <p className="font-sans text-sm md:text-[15px] font-bold text-[#28323F] shrink-0 tracking-tight">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Category Specimen Row with Soft Steel (#A8B8CB) Bullet */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-[#A8B8CB] shrink-0 border border-[#8598B0]/40" />
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[#5F7591]">
            {product.category || "ARCHIVE"}
          </span>
        </div>
      </div>
    </Link>
  );
}
