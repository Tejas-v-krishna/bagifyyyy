"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductMetaRow from "@/components/product/ProductMetaRow";

type RecentProduct = {
  id: string;
  name: string;
  price?: number;
  image?: string;
  images?: string[];
};

interface RecentlyViewedProps {
  productId?: string;
}

export default function RecentlyViewed({ productId }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setScrollProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < maxScroll - 5);
  }, []);

  useEffect(() => {
    const fetchAndSaveRecents = async () => {
      try {
        const stored = localStorage.getItem("recentlyViewed");
        let recentIds: string[] = [];
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              recentIds = parsed.filter(
                (id): id is string => typeof id === "string" && Boolean(id.trim())
              );
            }
          } catch {
            recentIds = [];
          }
        }

        // If on a product page, add current product ID to the front of history
        if (productId) {
          recentIds = recentIds.filter((id) => id !== productId);
          recentIds.unshift(productId);
          // Keep maximum 6 in storage to maintain clean storage state
          recentIds = recentIds.slice(0, 6);
          localStorage.setItem("recentlyViewed", JSON.stringify(recentIds));
        }

        // Filter out current product for display, and keep at most 5 cards
        const idsToFetch = (productId ? recentIds.filter((id) => id !== productId) : recentIds).slice(0, 5);

        if (idsToFetch.length === 0) {
          setRecentProducts([]);
          setIsReady(true);
          return;
        }

        const promises = idsToFetch.map((id) =>
          fetch(`/api/products/${id}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        );

        const results = await Promise.all(promises);
        const validProducts = results.filter(
          (result): result is RecentProduct =>
            Boolean(result && !result.error && result.id)
        );

        // Prune any deleted/invalid products from localStorage
        const validIds = new Set(validProducts.map((p) => p.id));
        if (productId) validIds.add(productId);
        const pruned = recentIds.filter((id) => validIds.has(id));
        if (pruned.length !== recentIds.length) {
          localStorage.setItem("recentlyViewed", JSON.stringify(pruned));
        }

        setRecentProducts(validProducts.slice(0, 5));
      } catch (error) {
        console.error("Error managing recently viewed:", error);
      } finally {
        setIsReady(true);
      }
    };

    fetchAndSaveRecents();
  }, [productId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, recentProducts]);

  const scrollByAmount = (offset: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!isReady) {
    return null;
  }

  // Do not render anything if the user hasn't viewed any other products
  if (recentProducts.length === 0) {
    return null;
  }

  const indicatorWidthPercent = Math.max(25, Math.min(50, 100 / Math.max(1, recentProducts.length)));
  const indicatorLeftPercent = scrollProgress * (100 - indicatorWidthPercent);

  return (
    <section
      className="w-full select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      aria-label="Recently viewed products"
    >
      {/* Header with Title and Scroll Arrows */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-black/50">
            RECENTLY VIEWED
          </h2>
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/35 mt-1 font-mono">
            {recentProducts.length} {recentProducts.length === 1 ? "PIECE" : "PIECES"}
          </p>
        </div>

        {/* Prev / Next Scroll Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount(-340)}
            disabled={!canScrollLeft}
            aria-label="Scroll recently viewed left"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-black/10 flex items-center justify-center text-black/70 hover:bg-black hover:text-white transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black/70 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(340)}
            disabled={!canScrollRight}
            aria-label="Scroll recently viewed right"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-black/10 flex items-center justify-center text-black/70 hover:bg-black hover:text-white transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black/70 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Draggable Scrollable Track */}
      <div
        ref={scrollRef}
        onMouseDown={(e) => {
          if (!scrollRef.current) return;
          isDownRef.current = true;
          dragDistanceRef.current = 0;
          startXRef.current = e.pageX - scrollRef.current.offsetLeft;
          scrollLeftRef.current = scrollRef.current.scrollLeft;
        }}
        onMouseMove={(e) => {
          if (!isDownRef.current || !scrollRef.current) return;
          const x = e.pageX - scrollRef.current.offsetLeft;
          const walk = (x - startXRef.current) * 1.25;
          dragDistanceRef.current = Math.abs(x - startXRef.current);

          if (dragDistanceRef.current > 4) {
            if (!isDraggingRef.current) {
              isDraggingRef.current = true;
              setIsDragging(true);
            }
            e.preventDefault();
            scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
          }
        }}
        onMouseUp={() => {
          if (!isDownRef.current) return;
          isDownRef.current = false;
          if (isDraggingRef.current) {
            setTimeout(() => {
              isDraggingRef.current = false;
              setIsDragging(false);
            }, 80);
          }
        }}
        onMouseLeave={() => {
          if (isDownRef.current) {
            isDownRef.current = false;
            if (isDraggingRef.current) {
              setTimeout(() => {
                isDraggingRef.current = false;
                setIsDragging(false);
              }, 80);
            }
          }
        }}
        className={`flex gap-5 sm:gap-6 md:gap-7 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x snap-proximity touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0 ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => {
              if (isDraggingRef.current || isDragging) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="group shrink-0 w-[240px] sm:w-[270px] md:w-[300px] lg:w-[330px] snap-start flex flex-col cursor-pointer select-none"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {/* Bigger Card Surface with Hover Zoom and Drag Protection */}
            <div
              className="media-card relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-[#f2f2f2] group-hover:bg-[#ebebeb] flex items-center justify-center transition-colors duration-300 select-none shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center p-5 pointer-events-none select-none">
                <Image
                  src={product.image || product.images?.[0] || "/placeholder.jpg"}
                  alt={product.name}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 340px"
                  className="object-contain mix-blend-multiply group-hover:scale-[1.05] transition-transform duration-500 pointer-events-none select-none p-4"
                  style={{
                    WebkitUserDrag: "none",
                    userSelect: "none",
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <ProductMetaRow name={product.name} price={product.price} className="pointer-events-none select-none px-0.5 mt-1" />
          </Link>
        ))}
      </div>

      {/* Continuous Bottom Progress Line */}
      {recentProducts.length > 2 && (
        <div className="w-full mt-3">
          <div className="relative w-full h-[1.5px] bg-black/10 overflow-hidden rounded-full">
            <div
              className="absolute top-0 h-full bg-black transition-all duration-150 ease-out rounded-full"
              style={{
                width: `${indicatorWidthPercent}%`,
                transform: `translateX(${indicatorLeftPercent * (100 / indicatorWidthPercent)}%)`,
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
