"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/components/ui/WishlistButton";

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

  return (
    <Link
      href={`/product/${product.id}`}
      className="group product-card flex flex-col w-full h-full bg-transparent relative overflow-hidden font-sans border-0 cursor-pointer select-none"
    >
      {/* ── Borderless Image Container with Subtle Depth ── */}
      <div
        ref={imageContainerRef}
        className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-black/[0.02] group-hover:bg-black/[0.05] transition-colors duration-500 cursor-pointer"
      >
        {/* Base Product Image */}
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              draggable={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[1] select-none pointer-events-none ${
                product.hoverImage ? "group-hover:opacity-0" : ""
              } ${product.isSoldOut ? "blur-sm opacity-70" : "opacity-100"}`}
            />

            {/* Hover Image (if available) */}
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt={`${product.name} alternate view`}
                fill
                draggable={false}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2] select-none pointer-events-none"
              />
            )}

            {/* Sold Out Overlay */}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="bg-[#232D3B] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest">
                  SOLD OUT
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}

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
      </div>

      {/* ── Borderless Product Info Below Image ── */}
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
}
