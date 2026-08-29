"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type VintageArchiveItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
};

export default function VintageArchiveSection({ items }: { items: VintageArchiveItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  if (!items.length) return null;

  const scroll = (direction: "left" | "right") => {
    railRef.current?.scrollBy({ left: direction === "left" ? -360 : 360, behavior: "smooth" });
  };

  return (
    <section className="w-full overflow-hidden bg-[#171717] px-5 py-16 text-white sm:px-8 md:px-12 md:py-20" aria-labelledby="vintage-archive-heading">
      <div className="mx-auto w-full max-w-[1800px]">
        <div className="grid gap-8 md:grid-cols-[0.3fr_1fr] md:items-start">
          <div className="flex items-start justify-between gap-4 md:block">
            <div>
              <span className="inline-flex rounded-full border border-white/65 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.18em]">Summer your way</span>
              <p className="mt-12 max-w-[120px] text-[11px] font-medium uppercase leading-[1.1] tracking-[0.05em] text-white/90 md:mt-16">2026 Archive<br />Collection</p>
            </div>
            <div className="flex gap-2 md:mt-10">
              <button type="button" onClick={() => scroll("left")} aria-label="Previous archive pieces" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white hover:text-white"><ChevronLeft className="h-4 w-4" strokeWidth={1.2} /></button>
              <button type="button" onClick={() => scroll("right")} aria-label="Next archive pieces" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white hover:text-white"><ChevronRight className="h-4 w-4" strokeWidth={1.2} /></button>
            </div>
          </div>

          <div>
            <h2 id="vintage-archive-heading" className="max-w-3xl font-display text-4xl leading-[0.92] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-7xl">Find the right piece<br />for your everyday.</h2>
            <div ref={railRef} className="mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-16 md:gap-4" tabIndex={0} aria-label="Vintage archive pieces">
              {items.slice(0, 8).map((item) => (
                <Link key={item.id} href={`/product/${item.id}`} className="group w-[min(72vw,250px)] shrink-0 snap-start sm:w-[220px] md:w-[calc(25%-12px)] md:min-w-[190px]">
                  <div className="relative aspect-[0.83] overflow-hidden bg-[#f1f1ef]"><Image src={item.image || "/placeholder.jpg"} alt={item.name} fill sizes="(max-width: 640px) 72vw, (max-width: 1024px) 25vw, 220px" className="object-cover transition-transform duration-700 group-hover:scale-[1.035]" />{item.isSoldOut && <span className="absolute left-3 top-3 bg-black px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em]">Sold out</span>}</div>
                  <div className="flex items-start justify-between gap-3 pt-3 text-[10px] leading-4"><span className="max-w-[75%] font-medium uppercase tracking-[0.05em] text-white/90">{item.name}</span><span className="shrink-0 text-white/70">₹{item.price.toLocaleString("en-IN")}</span></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
