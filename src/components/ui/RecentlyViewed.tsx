"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";

type RecentProduct = {
  id: string;
  name: string;
  price?: number;
  image?: string;
  images?: string[];
};

interface RecentlyViewedProps {
  productId: string;
}

export default function RecentlyViewed({ productId }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [isReady, setIsReady] = useState(false);
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
          fetch(`/api/products/${id}`).then((res) =>
            res.ok ? res.json() : null
          )
        );

        const results = await Promise.all(promises);
        setRecentProducts(
          results.filter(
            (result): result is RecentProduct =>
              Boolean(result && !result.error && result.id)
          )
        );
      } catch (error) {
        console.error("Error managing recently viewed:", error);
      } finally {
        setIsReady(true);
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

  if (!isReady) {
    return (
      <div className="w-full" aria-label="Loading recently viewed products">
        <div className="mb-6 h-3 w-40 animate-pulse bg-y2k-gunmetal/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className={item === 2 ? "hidden sm:block" : "block"}>
              <div className="aspect-[4/5] animate-pulse bg-y2k-gunmetal/[0.05]" />
              <div className="mt-3 h-2.5 w-3/4 animate-pulse bg-y2k-gunmetal/[0.07]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentProducts.length === 0) {
    return (
      <div className="w-full border-y border-y2k-gunmetal/[0.08] py-8 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <History className="mt-0.5 h-5 w-5 shrink-0 text-y2k-gunmetal/35" strokeWidth={1.4} aria-hidden="true" />
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-gunmetal/55">
                Recently viewed archive
              </h3>
              <p className="mt-2 max-w-md text-xs leading-5 text-y2k-gunmetal/55">
                Your recent discoveries will appear here as you explore the archive.
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center gap-2 self-start text-[10px] font-semibold uppercase tracking-[0.18em] text-y2k-gunmetal focus-visible:outline focus-visible:outline-2 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-4 sm:self-auto"
          >
            Explore archive
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

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
