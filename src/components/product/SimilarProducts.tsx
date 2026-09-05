"use client";

import Image from "next/image";
import Link from "next/link";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  brand?: string | null;
  colors?: string[];
}

export default function SimilarProducts({
  products,
}: {
  products: RelatedProduct[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/product/${product.id}`}
          className="group flex flex-col cursor-pointer"
        >
          {/* Image */}
          <div className="relative w-full aspect-[3/4] bg-[#F2F2F2] overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain object-center group-hover:scale-[1.03] transition-transform duration-500 p-2 sm:p-3"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-wider text-y2k-gunmetal/30">
                No Image
              </div>
            )}
          </div>

          {/* Name + Price row — matches reference: "WIDE CARGO PANTS   $78" */}
          <div className="flex items-baseline justify-between gap-2 pt-2.5">
            <h3 className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.08em] text-y2k-gunmetal font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity flex-1 min-w-0">
              {product.name}
            </h3>
            <p className="text-[10px] sm:text-[10.5px] font-bold text-y2k-gunmetal shrink-0 tracking-tight">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
