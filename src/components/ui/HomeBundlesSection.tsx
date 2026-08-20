"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { ArrowRight, ShoppingBag, Tag } from "lucide-react";

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
    <section className="w-full bg-y2k-ice py-12 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-12 border-t border-y2k-gunmetal/15">
      <div className="w-full max-w-[1400px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[46px] uppercase tracking-[-0.03em] leading-none text-y2k-gunmetal">
            CURATED OUTFITS
          </h2>

          <Link
            href="/bundles"
            className="inline-flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:text-black transition-colors pb-1 sm:pb-2 border-b border-y2k-gunmetal/15 hover:border-y2k-gunmetal"
          >
            <span>Explore Archive</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Bundle Cards Grid (Matches the /bundles page layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {bundles.slice(0, 3).map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white border border-y2k-gunmetal/15 flex flex-col hover:shadow-xl transition-all duration-300 group"
            >
              {/* Discount badge + name */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-y2k-gunmetal/10">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight leading-none text-y2k-gunmetal">
                    {bundle.name}
                  </h3>
                  <span className="shrink-0 bg-y2k-gunmetal text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                    <Tag className="w-3 h-3" />
                    {bundle.discount}% OFF
                  </span>
                </div>
                {bundle.description && (
                  <p className="text-xs sm:text-sm text-y2k-gunmetal/60 leading-relaxed font-sans">{bundle.description}</p>
                )}
              </div>

              {/* Product image strip */}
              <div className="flex gap-px bg-y2k-gunmetal/10 border-b border-y2k-gunmetal/10 p-px">
                {bundle.products.map((p) => (
                  <div key={p.id} className="relative flex-1 aspect-[3/4] bg-y2k-ice overflow-hidden group/img">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover group-hover/img:scale-105 transition-transform duration-500 grayscale-[10%] group-hover/img:grayscale-0"
                      sizes="(max-width: 768px) 33vw, 16vw"
                    />
                  </div>
                ))}
              </div>

              {/* Product names */}
              <div className="px-6 sm:px-8 py-5 flex-1 bg-y2k-ice/30">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/40 mb-3">Includes</p>
                <ul className="space-y-2">
                  {bundle.products.map((p) => (
                    <li key={p.id} className="flex items-start sm:items-center justify-between text-[10px] sm:text-xs">
                      <span className="font-bold text-y2k-gunmetal/80 pr-4 leading-tight">{p.name}</span>
                      <span className="font-mono font-bold text-y2k-gunmetal/50 shrink-0">₹{p.price.toLocaleString("en-IN")}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing + CTA */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 bg-y2k-ice/30 border-t border-y2k-gunmetal/10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/40 mb-1">Bundle Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl sm:text-4xl tracking-tight text-y2k-gunmetal">
                        ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs sm:text-sm text-y2k-gunmetal/40 line-through font-mono">
                        ₹{bundle.originalTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-y2k-gunmetal/15 px-3 py-1.5 self-start sm:self-auto">
                    <p className="text-[9px] sm:text-[10px] text-y2k-gunmetal font-bold uppercase tracking-wider">
                      Save ₹{bundle.savings.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddBundle(bundle)}
                  disabled={bundle.products.every((p) => p.isSoldOut)}
                  className={`w-full py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 sm:gap-3 btn-bagify disabled:opacity-40 disabled:pointer-events-none ${
                    addedBundleId === bundle.id ? "!bg-white !text-y2k-gunmetal border border-y2k-gunmetal shadow-none" : ""
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {addedBundleId === bundle.id ? "ADDED TO BAG ✓" : "ACQUIRE FULL LOOK"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
