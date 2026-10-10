"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToBagButton from "@/components/ui/AddToBagButton";
import ProductMetaRow from "@/components/product/ProductMetaRow";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  hoverImage?: string;
  category: string;
  subcategory?: string | null;
  brand?: string;
  isNew?: boolean;
  isSoldOut?: boolean;
  isBestSeller?: boolean;
  /** Another shopper currently holds this piece in their bag. */
  reserved?: boolean;
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
      {/* ── Image is the card, full-bleed aspect-[4/5] matching New In ShowcaseCard ── */}
      <div
        ref={imageContainerRef}
        className="relative w-full aspect-[4/5] overflow-hidden rounded-[10px] bg-[#e9e9ec] transition-colors duration-500 cursor-pointer"
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
              className={`object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[1] select-none pointer-events-none ${
                product.hoverImage ? "group-hover:opacity-0" : ""
              } ${product.isSoldOut ? "blur-[3px] opacity-50 grayscale" : "opacity-100"}`}
            />

            {/* Hover Image (if available) */}
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt={`${product.name} alternate view`}
                fill
                draggable={false}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                className={`object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2] select-none pointer-events-none ${
                  product.isSoldOut ? "blur-[3px] grayscale" : ""
                }`}
              />
            )}

            {/* Sold Out / Somebody Bought This Overlay */}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/45 backdrop-blur-[5px] z-30 pointer-events-none">
                <span className="bg-white/95 text-black text-[9px] px-3 py-1.5 tracking-[0.14em] uppercase rounded-full font-mono font-bold shadow-lg">
                  Somebody bought this
                </span>
                <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/80 font-semibold mt-1">
                  Out of stock · 1 of 1
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#EFEFEF]" />
        )}

        {/* NEW Badge */}
        {product.isNew && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="text-[8px] font-medium tracking-[0.12em] uppercase bg-black/45 text-white/85 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full shadow-xs">
              New
            </span>
          </div>
        )}

        {/* On-hold signal: first-to-bag holds the piece */}
        {product.reserved && !product.isSoldOut && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className="text-[8px] font-medium tracking-[0.12em] uppercase bg-amber-500/20 text-amber-900 backdrop-blur-md border border-amber-500/30 px-2 py-0.5 rounded-full shadow-xs">
              On Hold
            </span>
          </div>
        )}

        {/* Quick Add to Bag Button */}
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
            className="absolute right-3 top-3 z-20 h-8 w-8 p-0"
          />
        </div>
      </div>

      <ProductMetaRow name={product.name} price={product.price} className="pb-1" />
    </Link>
  );
}
