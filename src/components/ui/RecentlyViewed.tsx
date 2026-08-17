"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RecentlyViewedProps {
  productId: string;
}

export default function RecentlyViewed({ productId }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    setScrollProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
  }, []);

  useEffect(() => {
    const fetchAndSaveRecents = async () => {
      try {
        const stored = localStorage.getItem("recentlyViewed");
        let recentIds: string[] = stored ? JSON.parse(stored) : [];

        // Remove current if exists, then add to front
        recentIds = recentIds.filter((id) => id !== productId);
        recentIds.unshift(productId);

        // Keep max 8
        recentIds = recentIds.slice(0, 8);
        localStorage.setItem("recentlyViewed", JSON.stringify(recentIds));

        // Filter out current product for display
        const idsToFetch = recentIds.filter((id) => id !== productId);

        if (idsToFetch.length === 0) return;

        const promises = idsToFetch.map((id) =>
          fetch(`/api/products/${id}`).then((res) => res.json())
        );

        const results = await Promise.all(promises);
        setRecentProducts(results.filter((r) => !r.error));
      } catch (error) {
        console.error("Error managing recently viewed:", error);
      }
    };

    if (productId) {
      fetchAndSaveRecents();
    }
  }, [productId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, recentProducts]);

  if (recentProducts.length === 0) return null;

  const indicatorWidthPercent = Math.max(20, Math.min(40, 100 / Math.max(1, recentProducts.length)));
  const indicatorLeftPercent = scrollProgress * (100 - indicatorWidthPercent);

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          RECENTLY VIEWED ARCHIVE
        </h3>
      </div>

      {/* Scrollable Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x snap-mandatory touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group shrink-0 w-[140px] sm:w-[170px] md:w-[200px] snap-start flex flex-col cursor-pointer"
          >
            <div className="relative w-full aspect-[4/5] bg-[#F7F7F7] overflow-hidden flex items-center justify-center group-hover:bg-[#EFEFEF] transition-colors">
              <Image
                src={product.image || product.images?.[0] || "/placeholder.jpg"}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 140px, 170px"
                className="object-contain mix-blend-multiply group-hover:scale-[1.04] transition-transform duration-500 p-3"
              />
            </div>

            <div className="pt-2.5 flex flex-col">
              <div className="text-xs font-semibold text-black line-clamp-1 leading-snug group-hover:opacity-70 transition-opacity">
                {product.name}
              </div>
              <div className="text-xs font-bold text-black mt-0.5">
                ₹{product.price?.toLocaleString("en-IN")}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Continuous Bottom Progress Line */}
      {recentProducts.length > 2 && (
        <div className="w-full mt-2">
          <div className="relative w-full h-[1.5px] bg-gray-200 overflow-hidden">
            <div
              className="absolute top-0 h-full bg-black transition-all duration-100 ease-out"
              style={{
                width: `${indicatorWidthPercent}%`,
                transform: `translateX(${indicatorLeftPercent * (100 / indicatorWidthPercent)}%)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
