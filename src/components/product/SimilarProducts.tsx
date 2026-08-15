"use client";

import Image from "next/image";
import Link from "next/link";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function SimilarProducts({
  products,
}: {
  products: RelatedProduct[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-24 pt-12 border-t border-gray-100">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-2">
            YOU MAY ALSO LIKE
          </p>
          <h2 className="font-sans font-medium text-3xl lg:text-4xl tracking-tight text-black">
            Similar Pieces
          </h2>
        </div>
        <Link
          href="/products"
          className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors hidden sm:block"
        >
          View All →
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group relative flex flex-col aspect-[3/4] bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
          >
            {/* Product Image */}
            <div className="flex-1 relative overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-4"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[8px] uppercase tracking-widest">
                  No Image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 bg-white border-t border-gray-100 flex flex-col justify-between">
              <p className="text-[10px] md:text-xs uppercase font-medium tracking-wider text-gray-700 line-clamp-1 leading-snug mb-1">
                {product.name}
              </p>
              <p className="text-xs md:text-sm font-extrabold tracking-tight text-black">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 border border-transparent group-hover:border-black transition-all duration-300 pointer-events-none" />
          </Link>
        ))}
      </div>
    </section>
  );
}
