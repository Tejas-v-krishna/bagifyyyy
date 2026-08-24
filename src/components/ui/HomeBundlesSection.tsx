"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

export type HomeBundleItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
};

export type HomeBundle = {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  products: HomeBundleItem[];
  originalTotal: number;
  bundlePrice: number;
  savings: number;
};

export default function HomeBundlesSection({ bundles }: { bundles: HomeBundle[] }) {
  const { addItem } = useCartStore();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  if (!bundles || bundles.length === 0) return null;

  const handleAddBundle = (bundle: HomeBundle) => {
    // A set is priced as a whole, so it is added as a whole. Dropping the
    // sold-out pieces and adding the rest used to charge full price for a
    // partial set while the card still advertised the set discount.
    if (bundle.products.some((p) => p.isSoldOut) || bundle.products.length === 0) return;

    const bundleSize = new Set(bundle.products.map((p) => p.id)).size;
    bundle.products.forEach((p) => {
      addItem({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        quantity: 1,
        size: "One Size",
        color: "Default",
        bundleId: bundle.id,
        bundleName: bundle.name,
        bundleDiscount: bundle.discount,
        bundleSize,
      });
    });
    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2500);
  };

  return (
    <section
      className="w-full bg-y2k-ice py-32 md:py-44 border-t border-y2k-gunmetal/[0.07]"
      aria-labelledby="bundles-heading"
    >
      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-16 md:mb-20">
          <div>
            <p className="section-label text-y2k-gunmetal/45 mb-3">CURATED SETS</p>
            <h2
              id="bundles-heading"
              className="font-display text-4xl sm:text-5xl md:text-[56px] uppercase tracking-[-0.05em] leading-none text-y2k-gunmetal animate-fade-up"
            >
              Complete Looks
            </h2>
          </div>
          <Link
            href="/bundles"
            className="text-[9.5px] uppercase tracking-[0.22em] text-y2k-gunmetal/45 hover:text-y2k-gunmetal transition-colors duration-300 pb-0.5 border-b border-y2k-gunmetal/15 hover:border-y2k-gunmetal/50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-4"
          >
            View All
          </Link>
        </div>

        {/* Bundle Cards — Full-bleed photo cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {bundles.slice(0, 3).map((bundle, i) => {
            const coverImage = bundle.products[0]?.image || "/placeholder.jpg";
            const isAdded = addedBundleId === bundle.id;
            // The set price only applies to a complete set, so one sold-out
            // piece makes the whole set unbuyable.
            const isUnavailable =
              bundle.products.some((p) => p.isSoldOut) || bundle.products.length === 0;

            return (
              <article
                key={bundle.id}
                className={`relative overflow-hidden group animate-fade-up delay-${(i + 1) * 100}`}
                aria-label={`${bundle.name} bundle — ${bundle.discount}% off`}
              >
                {/* Dynamic Product Images Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-y2k-gunmetal">
                  {/* Image Grid Logic */}
                  {(() => {
                    const count = bundle.products.length;
                    
                    if (count === 1 || count === 0) {
                      return (
                        <div className="absolute inset-0">
                          <Image src={coverImage} alt={bundle.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                        </div>
                      );
                    }
                    if (count === 2) {
                      return (
                        <div className="absolute inset-0 flex flex-col gap-0.5 bg-black/20">
                          <div className="relative w-full h-1/2 overflow-hidden">
                            <Image src={bundle.products[0].image} alt={bundle.products[0].name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          </div>
                          <div className="relative w-full h-1/2 overflow-hidden">
                            <Image src={bundle.products[1].image} alt={bundle.products[1].name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          </div>
                        </div>
                      );
                    }
                    if (count === 3) {
                      return (
                        <div className="absolute inset-0 flex flex-col gap-0.5 bg-black/20">
                          <div className="relative w-full h-1/3 overflow-hidden">
                            <Image src={bundle.products[0].image} alt={bundle.products[0].name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          </div>
                          <div className="relative w-full h-1/3 overflow-hidden">
                            <Image src={bundle.products[1].image} alt={bundle.products[1].name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          </div>
                          <div className="relative w-full h-1/3 overflow-hidden">
                            <Image src={bundle.products[2].image} alt={bundle.products[2].name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 bg-black/20">
                        {bundle.products.slice(0, 4).map((p) => (
                          <div key={p.id} className="relative w-full h-full overflow-hidden">
                            <Image src={p.image} alt={p.name} fill sizes="16vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Permanent subtle gradient at bottom for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />

                  {/* Discount badge — top right */}
                  <div className="absolute top-4 right-4 glass-pill px-3 py-1.5" aria-label={`${bundle.discount}% discount`}>
                    <span className="text-white text-[9px] uppercase tracking-[0.2em]">
                      −{bundle.discount}%
                    </span>
                  </div>

                  {/* Bottom glass panel — name, price, CTA */}
                  <div className="absolute bottom-0 left-0 right-0 glass-dark p-6 md:p-7 translate-y-0">
                    {/* Bundle name */}
                    <h3 className="font-display text-2xl md:text-3xl uppercase tracking-[-0.04em] leading-none text-white mb-1">
                      {bundle.name}
                    </h3>

                    {/* Price row */}
                    <div className="flex items-baseline gap-2.5 mt-3 mb-5">
                      <span className="font-bold text-white text-lg tracking-tight">
                        ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                      </span>
                      <span className="font-bold text-white/35 text-xs line-through">
                        ₹{bundle.originalTotal.toLocaleString("en-IN")}
                      </span>
                      <span className="font-bold text-white/55 text-[9.5px] uppercase tracking-[0.16em] ml-auto">
                        Save ₹{bundle.savings.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleAddBundle(bundle)}
                      disabled={isUnavailable}
                      aria-label={
                        isUnavailable
                          ? `${bundle.name} set is unavailable`
                          : isAdded
                            ? "Added to bag"
                            : `Add ${bundle.name} set to bag for ₹${bundle.bundlePrice.toLocaleString("en-IN")}`
                      }
                      className="w-full py-3.5 text-[9.5px] uppercase tracking-[0.22em] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-35 disabled:pointer-events-none cursor-pointer
                        border border-white/25 text-white hover:bg-white hover:text-y2k-gunmetal"
                    >
                      {isUnavailable ? "Set Unavailable" : isAdded ? "✓ Added to Bag" : "Acquire Look"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
