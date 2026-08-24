"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

type BundleProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
};

type Bundle = {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  products: BundleProduct[];
  originalTotal: number;
  bundlePrice: number;
};

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bundles")
      .then((r) => r.json())
      .then((d) => setBundles(d.bundles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddBundle = (bundle: Bundle) => {
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
    setAddedId(bundle.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-y2k-ice text-y2k-gunmetal">

      {/* Page header — matching CategoryPageClient style */}
      <div className="px-6 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto pt-16 md:pt-20 mb-10">
        <div className="flex flex-row items-end justify-between gap-4 border-b border-y2k-gunmetal/[0.07] pb-8">
          <div className="flex flex-col">
            <span className="section-label text-y2k-gunmetal/45 mb-3">CURATED SETS</span>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] uppercase tracking-[-0.04em] leading-none text-y2k-gunmetal animate-fade-up">
              BUNDLES
            </h1>
          </div>
          <div className="flex items-baseline gap-1.5 shrink-0 pb-1">
            <span className="font-display text-4xl sm:text-5xl text-y2k-gunmetal leading-none tracking-tight">
              {loading ? "--" : String(bundles.length).padStart(2, "0")}
            </span>
            <span className="section-label text-y2k-gunmetal/45">SETS</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 pb-32 w-full">
        {loading ? (
          /* Static skeleton — no pulse flashing (WCAG 2.3.1) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-y2k-pale/30 aspect-[3/4] w-full" />
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-px h-16 bg-y2k-gunmetal/15 mb-12" />
            <h3 className="font-display text-3xl uppercase tracking-[-0.03em] mb-3">
              No Bundles Yet
            </h3>
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/45">
              Check back soon — new sets being curated.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle, i) => {
              const coverImage = bundle.products[0]?.image || "/placeholder.jpg";
              const isAdded = addedId === bundle.id;
              // The set price only applies to a complete set, so one sold-out
              // piece makes the whole set unbuyable.
              const soldOutCount = bundle.products.filter((p) => p.isSoldOut).length;
              const isUnavailable = soldOutCount > 0 || bundle.products.length === 0;
              const savings = bundle.originalTotal - bundle.bundlePrice;

              return (
                <article
                  key={bundle.id}
                  className={`relative overflow-hidden group animate-fade-up delay-${Math.min((i + 1) * 100, 400)}`}
                  aria-label={`${bundle.name} bundle — ${bundle.discount}% off`}
                >
                  {/* Full-bleed dynamic image container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-y2k-pale/20">
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
                          <div className="absolute inset-0 flex flex-col gap-0.5 bg-black/10">
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
                          <div className="absolute inset-0 flex flex-col gap-0.5 bg-black/10">
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
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 bg-black/10">
                          {bundle.products.slice(0, 4).map((p) => (
                            <div key={p.id} className="relative w-full h-full overflow-hidden">
                               <Image src={p.image} alt={p.name} fill sizes="16vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Gradient for text legibility — bottom only */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" aria-hidden="true" />

                    {/* Discount badge */}
                    <div className="absolute top-4 left-4 glass-pill px-3 py-1.5" aria-label={`${bundle.discount}% discount`}>
                      <span className="text-white text-[9px] uppercase tracking-[0.2em]">
                        −{bundle.discount}%
                      </span>
                    </div>

                    {/* Bottom glass info panel */}
                    <div className="absolute bottom-0 left-0 right-0 glass-dark p-6">
                      <h2 className="font-display text-2xl md:text-3xl uppercase tracking-[-0.04em] leading-none text-white mb-3">
                        {bundle.name}
                      </h2>

                      {/* Minimal product count */}
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-4">
                        {bundle.products.length} {bundle.products.length === 1 ? "piece" : "pieces"} included
                        {soldOutCount > 0 && ` · ${soldOutCount} sold out`}
                      </p>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2.5 mb-5">
                        <span className="font-bold text-white text-xl tracking-tight">
                          ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="font-bold text-white/30 text-xs line-through">
                          ₹{bundle.originalTotal.toLocaleString("en-IN")}
                        </span>
                        {savings > 0 && (
                          <span className="font-bold text-white/50 text-[9px] uppercase tracking-[0.16em] ml-auto">
                            −₹{savings.toLocaleString("en-IN")}
                          </span>
                        )}
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
                        className="w-full py-3.5 text-[9.5px] uppercase tracking-[0.22em] border border-white/25 text-white hover:bg-white hover:text-y2k-gunmetal transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                      >
                        {isUnavailable ? "Set Unavailable" : isAdded ? "✓ Added to Bag" : "Acquire Look"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
