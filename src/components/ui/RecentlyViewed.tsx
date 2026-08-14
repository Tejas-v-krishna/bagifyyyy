"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface RecentlyViewedProps {
  productId: string;
}

export default function RecentlyViewed({ productId }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAndSaveRecents = async () => {
      try {
        const stored = localStorage.getItem("recentlyViewed");
        let recentIds: string[] = stored ? JSON.parse(stored) : [];

        // Remove current if exists, then add to front
        recentIds = recentIds.filter(id => id !== productId);
        recentIds.unshift(productId);
        
        // Keep max 6
        recentIds = recentIds.slice(0, 6);
        localStorage.setItem("recentlyViewed", JSON.stringify(recentIds));

        // Filter out current product for display
        const idsToFetch = recentIds.filter(id => id !== productId);
        
        if (idsToFetch.length === 0) return;

        const promises = idsToFetch.map(id => 
          fetch(`/api/products/${id}`).then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        setRecentProducts(results.filter(r => !r.error));
      } catch (error) {
        console.error("Error managing recently viewed:", error);
      }
    };

    if (productId) {
      fetchAndSaveRecents();
    }
  }, [productId]);

  if (recentProducts.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-6">
        RECENTLY VIEWED
      </h3>
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 snap-x">
        {recentProducts.map(product => (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`}
            className="flex-shrink-0 w-24 flex flex-col group snap-start"
          >
            <div className="w-full aspect-[3/4] relative bg-gray-50 mb-2">
              <Image
                src={product.image || product.images?.[0] || "/placeholder.jpg"}
                alt={product.name}
                fill
                sizes="96px"
                className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-black line-clamp-2 mb-1">
              {product.name}
            </div>
            <div className="text-[10px] font-medium tracking-widest text-gray-500">
              ₹{product.price?.toLocaleString('en-IN')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
