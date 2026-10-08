"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToBagButton from "@/components/ui/AddToBagButton";
import type { NewInRailItem } from "@/components/ui/NewInRail";

/**
 * Continuous NEW IN belt: full-bleed image cards (the image IS the card —
 * cover, edge to edge, 15px radius, no wells or padding) drifting right to
 * left forever. Name + price under every card, badges and quick-add overlaid.
 * Pauses on hover / touch so pieces stay tappable.
 */
export default function NewInMarquee({ items }: { items: NewInRailItem[] }) {
  const [held, setHeld] = useState(false);

  if (!items.length) return null;

  // Four copies = two identical halves; a -50% loop is then seamless as long
  // as one half covers the viewport.
  const loop = [0, 1, 2, 3];

  return (
    <div
      className="w-full overflow-hidden"
      onTouchStart={() => setHeld(true)}
      onTouchEnd={() => setHeld(false)}
      onTouchCancel={() => setHeld(false)}
    >
      <div className={`newin-marquee-track flex w-max gap-5 pr-5 ${held ? "[animation-play-state:paused]" : ""}`}>
        {loop.map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-5"
            aria-hidden={copy > 0}
          >
            {items.map((product) => (
              <article key={`${product.id}-${copy}`} className="group w-[240px] shrink-0 sm:w-[280px] lg:w-[300px]">
                <Link
                  href={`/product/${product.id}`}
                  className="relative block aspect-[3/4] w-full overflow-hidden rounded-[15px] bg-[#e9e9ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
                  aria-label={product.name}
                  tabIndex={copy > 0 ? -1 : 0}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      draggable={false}
                      sizes="(max-width: 639px) 240px, 300px"
                      className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] ${
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
                    <div className="absolute bottom-3 right-3 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
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
                </Link>

                <div className="flex items-baseline gap-3 px-1 pt-4">
                  <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight tracking-tight text-black" title={product.name}>
                    {product.name}
                  </h3>
                  <span className="shrink-0 text-[13px] font-semibold tracking-tight text-black">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
