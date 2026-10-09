"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AddToBagButton from "@/components/ui/AddToBagButton";
import { useSvgPageTransition } from "@/components/ui/SvgPathTransition";

export type NewInRailItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isNew?: boolean;
  isSoldOut?: boolean;
  reserved?: boolean;
  sizes?: string[];
  colors?: string[];
};

/**
 * Clean aligned rail for the NEW IN showcase: uniform cards on one baseline
 * (15px wells like the rest of the site), native snap scrolling with arrows,
 * counter and progress hairline. No stagger, no WebGL — meta lives under
 * every card so nothing hides behind the center piece.
 */
export default function NewInRail({ items }: { items: NewInRailItem[] }) {
  const transitionTo = useSvgPageTransition();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  const step = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 320;
    const card = track.querySelector<HTMLElement>("[data-rail-card]");
    const gap = 20;
    return (card?.offsetWidth ?? 300) + gap;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = track.scrollWidth - track.clientWidth;
        setProgress(max > 0 ? track.scrollLeft / max : 0);
        setActive(max > 0 ? Math.round((track.scrollLeft / max) * (items.length - 1)) : 0);
      });
    };
    onScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items.length]);

  const nudge = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
  };

  if (!items.length) return null;

  const go = (id: string) => transitionTo(`/product/${id}`);

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((product) => (
          <article
            key={product.id}
            data-rail-card
            className="group w-[68vw] max-w-[340px] shrink-0 snap-center sm:w-[320px] lg:w-[340px]"
          >
            <div
              role="link"
              tabIndex={0}
              aria-label={product.name}
              onClick={() => go(product.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(product.id);
                }
              }}
              className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[15px] bg-[#e9e9ec] transition-shadow duration-500 group-hover:shadow-[0_28px_60px_-28px_rgba(0,0,0,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  draggable={false}
                  sizes="(max-width: 639px) 68vw, 340px"
                  className={`object-contain p-5 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] ${
                    product.isSoldOut ? "opacity-50 saturate-0" : "opacity-100"
                  }`}
                />
              ) : null}

              {product.isNew && !product.isSoldOut && (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/85 backdrop-blur-md border border-white/10 shadow-xs">
                  New
                </span>
              )}
              {product.isSoldOut ? (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/85 backdrop-blur-md border border-white/10 shadow-xs">
                  Sold Out
                </span>
              ) : product.reserved ? (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-amber-900 backdrop-blur-md border border-amber-500/30 shadow-xs">
                  On Hold
                </span>
              ) : null}

              {!product.isSoldOut && !product.reserved && (
                <div
                  className="absolute bottom-3 right-3 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
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
                    className="h-10 w-10 rounded-full border border-black/10 bg-white/95 p-0 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur"
                  />
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3 px-1 pt-4">
              <button
                type="button"
                onClick={() => go(product.id)}
                className="block min-w-0 flex-1 cursor-pointer text-left"
                aria-label={`View ${product.name}`}
              >
                <h3
                  className="truncate text-[13px] font-semibold leading-tight tracking-tight text-black transition-opacity hover:opacity-60"
                  title={product.name}
                >
                  {product.name}
                </h3>
              </button>
              <span className="shrink-0 text-[13px] font-semibold tracking-tight text-black">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Controls: arrows + counter + progress hairline */}
      <div className="mt-6 flex items-center gap-5 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Previous products"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/15 text-black transition-colors hover:border-black hover:bg-black hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Next products"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/15 text-black transition-colors hover:border-black hover:bg-black hover:text-white"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-black/45" aria-live="polite">
          {String(Math.min(active + 1, items.length)).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
        <div className="h-px flex-1 bg-black/10" aria-hidden="true">
          <div
            className="h-full bg-black transition-[transform] duration-150 ease-out"
            style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }}
          />
        </div>
      </div>
    </div>
  );
}
