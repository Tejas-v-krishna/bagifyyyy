"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import AddToBagButton from "@/components/ui/AddToBagButton";
import { useSvgPageTransition } from "@/components/ui/SvgPathTransition";

export type ZigzagItem = {
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

const GAP = 24;
const ZIG = 64;
const AUTOPLAY_MS = 3500;

/**
 * Infinite zigzag showcase: cards alternate high/low around a large center
 * piece, slide with spring physics, wrap forever and autoplay. Cards keep
 * the site's 15px wells, badges and quick-add; the center meta shows
 * name / price / counter / view link.
 */
export default function ZigzagShowcase({ items }: { items: ZigzagItem[] }) {
  const transitionTo = useSvgPageTransition();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [cardW, setCardW] = useState(320);
  const [paused, setPaused] = useState(false);
  const [intro, setIntro] = useState(true);

  const n = items.length;

  useEffect(() => {
    const measure = () => {
      const card = trackRef.current?.querySelector<HTMLElement>("[data-zz-card]");
      if (card) setCardW(card.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), n * 70 + 700);
    return () => window.clearTimeout(t);
  }, [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % n), AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [paused, n]);

  const go = useCallback((id: string) => transitionTo(`/product/${id}`), [transitionTo]);

  if (n === 0) return null;

  const step = cardW + GAP;
  const center = items[Math.min(active, n - 1)];

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="relative h-[500px] w-full overflow-hidden sm:h-[580px] lg:h-[600px]"
      >
        {items.map((product, i) => {
          let rel = (i - active) % n;
          if (rel > n / 2) rel -= n;
          if (rel < -n / 2) rel += n;
          const parity = ((rel % 2) + 2) % 2;
          const y = parity === 0 ? ZIG : 8;
          const isCenter = rel === 0;
          const visible = Math.abs(rel) <= 3;

          return (
            <motion.article
              key={product.id}
              data-zz-card
              initial={false}
              animate={{
                x: rel * step - cardW / 2,
                y,
                scale: isCenter ? 1 : 0.88,
                opacity: visible ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 30,
                mass: 0.9,
                delay: intro ? i * 0.07 : 0,
              }}
              onClick={() => {
                if (isCenter) go(product.id);
                else setActive(i);
              }}
              className="group absolute left-1/2 top-0 w-[230px] sm:w-[300px] lg:w-[320px]"
              style={{ pointerEvents: visible ? "auto" : "none", zIndex: isCenter ? 20 : 10 - Math.abs(rel) }}
              aria-label={product.name}
            >
              <div
                role="link"
                tabIndex={isCenter ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && isCenter) {
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
                    sizes="(max-width: 639px) 230px, 320px"
                    className={`object-contain p-5 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] ${
                      product.isSoldOut ? "opacity-50 saturate-0" : "opacity-100"
                    }`}
                  />
                ) : null}

                {product.isNew && !product.isSoldOut && (
                  <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white">
                    New
                  </span>
                )}
                {product.isSoldOut ? (
                  <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white">
                    Sold Out
                  </span>
                ) : product.reserved ? (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-black">
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
            </motion.article>
          );
        })}
      </div>

      {/* Center meta: name / price / counter / view link + arrows */}
      {center && (
        <div className="-mt-2 flex flex-col items-center gap-1.5 pb-1 text-center">
          <p className="text-[15px] font-semibold tracking-tight text-black sm:text-base">
            {center.name}
          </p>
          <p className="text-[13px] font-semibold tracking-tight text-black">
            ₹{center.price.toLocaleString("en-IN")}
          </p>
          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActive((a) => (a - 1 + n) % n)}
              aria-label="Previous product"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/15 text-black transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-black/45" aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={() => setActive((a) => (a + 1) % n)}
              aria-label="Next product"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/15 text-black transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => go(center.id)}
            className="mt-1 inline-flex cursor-pointer items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-black/70 underline underline-offset-4 transition-all duration-150 hover:gap-3 hover:text-black hover:opacity-100"
          >
            <span>View {center.name}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
