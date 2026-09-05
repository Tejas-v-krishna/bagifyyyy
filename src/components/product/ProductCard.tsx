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
      {/* ── Light-gray rounded card container matching reference ── */}
      <div
        ref={imageContainerRef}
        className="media-card relative w-full aspect-[4/5] flex items-center justify-center transition-colors duration-500 group-hover:bg-[var(--surface-panel-hover)] cursor-pointer"
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
              className={`object-contain object-center p-4 sm:p-5 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[1] select-none pointer-events-none ${
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
                className="object-contain object-center p-4 sm:p-5 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] z-[2] select-none pointer-events-none"
              />
            )}

            {/* Sold Out Overlay */}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="bg-black text-white text-[8.5px] px-3 py-1 tracking-[0.14em] rounded-[var(--radius-cta)] font-semibold">
                  Sold Out
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#EFEFEF]" />
        )}

        {/* NEW Badge */}
        {product.isNew && (
          <div className="absolute top-3 left-3 z-20">
            <span className="text-[8px] font-semibold tracking-[0.12em] bg-black text-white px-2 py-0.5 rounded-[var(--radius-cta)]">
              New
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
