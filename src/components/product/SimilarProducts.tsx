"use client";

import ShowcaseCard from "@/components/product/ShowcaseCard";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  isNew?: boolean;
  isSoldOut?: boolean;
  reserved?: boolean;
  sizes?: string[];
  colors?: string[];
}

export default function SimilarProducts({
  products,
}: {
  products: RelatedProduct[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
      {products.map((product) => (
        <ShowcaseCard
          key={product.id}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images && product.images.length > 0 ? product.images : [product.image],
            isNew: product.isNew,
            isSoldOut: product.isSoldOut,
            reserved: product.reserved,
            sizes: product.sizes,
            colors: product.colors,
          }}
        />
      ))}
    </div>
  );
}

