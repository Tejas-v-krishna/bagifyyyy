"use client";

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
  return (
    <Link 
      href={`/product/${product.id}`} 
      className="group flex flex-col w-full h-full bg-[#f4f4f4] hover:bg-[#eae8e3] transition-colors relative pb-4"
    >
      {/* "NEW" Label Top Left */}
      {product.isNew && (
        <div className="absolute top-3 left-3 z-20">
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 bg-white/90 px-2.5 py-1 shadow-sm">
            NEW
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden">
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className={`object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105 ${product.isSoldOut ? 'blur-md scale-105 opacity-80' : ''}`}
            />
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <span className="bg-[#EAE8E3] text-y2k-gunmetal text-xs font-black px-4 md:px-5 py-2 uppercase tracking-wider rounded shadow-sm">
                  SOLD OUT
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full" />
        )}

        {/* Small label Bottom Left inside image area */}
        <div className="absolute bottom-3 left-3 z-20 bg-white px-2.5 py-1 flex items-center shadow-sm rounded-sm">
           <span className="text-[10px] md:text-[11px] font-semibold text-y2k-gunmetal tracking-wider uppercase">
             {product.category || "ARCHIVE"}
           </span>
        </div>

        {/* Wishlist Button Bottom Right inside image area */}
        <WishlistButton 
          productId={product.id} 
          className="!top-auto !bottom-3 !right-3 !p-2 bg-white text-y2k-gunmetal hover:text-red-500 z-20 shadow-sm rounded-sm" 
        />
      </div>

      {/* Text Container */}
      <div className="flex flex-col px-4 pt-3.5 mt-auto flex-grow justify-start">
        <h3 className="font-sans text-xs md:text-sm font-semibold tracking-normal text-y2k-gunmetal truncate mb-1 leading-snug">
          {product.name}
        </h3>
        <p className="font-sans text-xs md:text-sm font-bold text-y2k-gunmetal/80 tracking-normal">
          ₹{product.price.toLocaleString('en-IN')}
        </p>
      </div>
    </Link>
  );
}
