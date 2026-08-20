"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToBagButton from "@/components/ui/AddToBagButton";

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
      {/* ── Image Container ── */}
      <div
        ref={imageContainerRef}
        className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden bg-y2k-pale/20 group-hover:bg-y2k-pale/35 transition-colors duration-500 cursor-pointer"
      >
        {/* Base Product Image */}
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              draggable={false}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[1] select-none pointer-events-none ${
                product.hoverImage ? "group-hover:opacity-0" : ""
              } ${product.isSoldOut ? "blur-sm opacity-60" : "opacity-100"}`}
            />

            {/* Hover Image (if available) */}
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt={`${product.name} alternate view`}
                fill
                draggable={false}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2] select-none pointer-events-none"
              />
            )}

            {/* Sold Out Overlay */}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="bg-y2k-gunmetal text-white text-[8.5px] px-3 py-1 uppercase tracking-[0.2em]">
                  SOLD OUT
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-y2k-pale/30" />
        )}

        {/* NEW Badge */}
        {product.isNew && (
          <div className="absolute top-3 left-3 z-20">
            <span className="text-[8px] uppercase tracking-[0.18em] bg-y2k-gunmetal text-white px-2 py-1">
              NEW
            </span>
          </div>
        )}

        {/* Add to Bag Button */}
        <div onClick={(e) => e.stopPropagation()}>
          <AddToBagButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              isSoldOut: product.isSoldOut,
              sizes: product.sizes,
              colors: product.colors,
            }}
            className="absolute top-3 right-3 p-2 bg-white/85 hover:bg-white text-y2k-gunmetal hover:text-black z-20 shadow-sm rounded-none border-0 transition-all duration-300"
          />
        </div>
      </div>

      {/* ── Product Info Below Image ── */}
      <div className="flex flex-col pt-4 pb-1.5">
        <p className="text-[9px] uppercase tracking-[0.22em] text-y2k-gunmetal/45 truncate mb-1">
          {product.brand || "BAGIFYYYY ARCHIVE"}
        </p>
        <h3 className="font-sans text-[12px] md:text-[13px] text-y2k-gunmetal group-hover:text-black transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="font-sans font-bold text-[13px] md:text-sm text-y2k-gunmetal mt-1.5 tracking-tight">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  );
}
