"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToBagButton from "@/components/ui/AddToBagButton";

export type ShowcaseCardProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
  isNew?: boolean;
  isSoldOut?: boolean;
  reserved?: boolean;
  sizes?: string[];
  colors?: string[];
};

const ROTATE_MS = 1200;

/**
 * Editorial grid card: the image IS the card (full-bleed cover, 15px,
 * no wells). Hovering rotates through the product's photos on an interval;
 * quick-add stays visible so the bag never needs a page view.
 */
export default function ShowcaseCard({
  product,
  tone = "light",
}: {
  product: ShowcaseCardProduct;
  tone?: "light" | "dark";
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const dark = tone === "dark";
  const textColor = dark ? "text-white" : "text-black";

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => stop, []);

  const start = () => {
    if (product.images.length < 2 || timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % product.images.length);
    }, ROTATE_MS);
  };

  const reset = () => {
    stop();
    setActiveIdx(0);
  };

  return (
    <article className="group">
      <Link
        href={`/product/${product.id}`}
        aria-label={product.name}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-[#e9e9ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
        onMouseEnter={start}
        onMouseLeave={reset}
        onFocus={start}
        onBlur={reset}
      >
        {product.images.map((src, i) => (
          <Image
            key={`${product.id}-${i}`}
            src={src || "/placeholder.jpg"}
            alt={i === 0 ? product.name : `${product.name} view ${i + 1}`}
            fill
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              i === activeIdx ? "opacity-100" : "opacity-0"
            } ${product.isSoldOut ? "saturate-0" : ""}`}
          />
        ))}

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
            className="absolute bottom-3 right-3"
            onClick={(e) => e.preventDefault()}
          >
            <AddToBagButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0] || "/placeholder.jpg",
                isSoldOut: product.isSoldOut,
                sizes: product.sizes,
                colors: product.colors,
              }}
              className="h-10 w-10 rounded-full border border-black/10 bg-white/95 p-0 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 hover:scale-105 active:scale-95"
            />
          </div>
        )}
      </Link>

      <div className="flex items-baseline gap-2 px-0.5 pt-3">
        <h3
          className={`min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight tracking-tight sm:text-[13px] ${textColor}`}
          title={product.name}
        >
          {product.name}
        </h3>
        <span className={`shrink-0 text-[12px] font-semibold tracking-tight sm:text-[13px] ${textColor}`}>
          ₹{product.price.toLocaleString("en-IN")}
        </span>
      </div>
    </article>
  );
}
