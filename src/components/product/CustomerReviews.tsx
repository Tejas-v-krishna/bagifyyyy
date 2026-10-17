"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CUSTOMER_REVIEWS, type CustomerReview } from "@/data/customerReviews";

/**
 * Community reviews showcase — curated Instagram DM screenshots only.
 * One big image at a time with arrows + segments, like the product gallery.
 * No rating form, no user-written reviews.
 */
export default function CustomerReviews() {
  const [reviews, setReviews] = useState<CustomerReview[]>(CUSTOMER_REVIEWS);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.images) && data.images.length > 0) {
          setReviews(data.images);
          setIndex(0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (reviews.length === 0) return null;

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + reviews.length) % reviews.length);
  const current = reviews[index];

  return (
    <section aria-label="Community reviews" className="w-full select-none">
      <h2 className="mb-6 sm:mb-8 text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-y2k-gunmetal uppercase leading-none">
        Community reviews
      </h2>

      <div className="relative w-full overflow-hidden rounded-2xl bg-[#e9e9ec]">
        <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full">
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt || `Customer review ${index + 1}`}
            fill
            sizes="100vw"
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover object-top"
          />
          {/* Soft blur melt at the card base */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black,transparent)]"
          />
        </div>

        {reviews.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous review"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next review"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {reviews.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
          {reviews.map((_, i) => (
            <span
              key={i}
              className={`h-[3px] rounded-full transition-all ${
                i === index ? "w-6 bg-black" : "w-3 bg-black/15"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
