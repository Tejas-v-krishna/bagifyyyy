"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { Tag, ArrowUpRight, Check, ShoppingBag, ArrowRight } from "lucide-react";

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
    const availableProducts = bundle.products.filter((p) => !p.isSoldOut);
    availableProducts.forEach((p) => {
      addItem({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        quantity: 1,
        size: "One Size",
        color: "Default",
      });
    });

    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2500);
  };

  return (
    <section className="w-full bg-y2k-ice py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-y2k-gunmetal/10">
      <div className="w-full max-w-[1800px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b border-y2k-gunmetal/15">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-gunmetal/50 mb-2">
              CURATED OUTFIT COMBOS
            </p>
            <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[46px] uppercase tracking-[-0.03em] leading-none text-y2k-gunmetal">
              CURATED BUNDLES
            </h2>
          </div>

          <Link
            href="/bundles"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-y2k-gunmetal hover:text-black transition-colors"
          >
            <span>Explore All Outfits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bundles.slice(0, 3).map((bundle) => {
            const isAdded = addedBundleId === bundle.id;

            return (
              <div
                key={bundle.id}
                className="bg-white border border-y2k-gunmetal/15 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
              >
                <div>
                  {/* Top info */}
                  <div className="p-6 pb-4 border-b border-y2k-gunmetal/10">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-y2k-gunmetal group-hover:text-black transition-colors">
                        {bundle.name}
                      </h3>
                      <span className="shrink-0 bg-y2k-gunmetal text-white text-[9px] font-black uppercase px-2.5 py-1 flex items-center gap-1 shadow-xs">
                        <Tag className="w-2.5 h-2.5" />
                        {bundle.discount}% OFF
                      </span>
                    </div>

                    {bundle.description && (
                      <p className="text-xs text-y2k-gunmetal/70 line-clamp-2 leading-relaxed">
                        {bundle.description}
                      </p>
                    )}
                  </div>

                  {/* Multi-product image preview strip */}
                  <div className="grid grid-cols-3 gap-1.5 p-4 bg-y2k-ice/40 border-b border-y2k-gunmetal/10">
                    {bundle.products.map((item) => (
                      <div
                        key={item.id}
                        className="aspect-[3/4] bg-white relative overflow-hidden border border-y2k-gunmetal/10 group/item"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 33vw, 12vw"
                          className="object-cover group-hover/item:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & Add to Cart Action */}
                <div className="p-6 pt-5 bg-white flex flex-col gap-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-y2k-gunmetal/50 block font-bold">
                        BUNDLE PRICE ({bundle.products.length} PIECES)
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-display text-xl font-black text-y2k-gunmetal">
                          ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-y2k-gunmetal/45 line-through font-mono">
                          ₹{bundle.originalTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 inline-block">
                        SAVE ₹{bundle.savings.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddBundle(bundle)}
                    className={`w-full py-3 text-xs font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isAdded
                        ? "bg-emerald-700 text-white"
                        : "btn-bagify text-white hover:opacity-90"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added to Bag!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add Full Outfit to Bag
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
