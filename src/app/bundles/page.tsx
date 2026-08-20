"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag, Tag, Zap } from "lucide-react";

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
    setAddedId(bundle.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="w-full min-h-screen flex flex-col pt-12 bg-y2k-ice text-y2k-gunmetal">
      {/* Standardized Header matching CategoryPageClient */}
      <div className="mb-8 shrink-0 px-4 sm:px-6 lg:px-12 w-full max-w-[1800px] mx-auto">
        <div className="flex flex-row items-end justify-between gap-4 border-b border-y2k-gunmetal/10 pb-6">
          {/* Left: Category Title */}
          <div className="flex flex-col">
            <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl uppercase tracking-[-0.03em] leading-none py-1 text-y2k-gunmetal">
              BUNDLES
            </h1>
            <p className="text-xs text-y2k-gunmetal/70 mt-2 font-sans max-w-xl">
              Curated archive combinations at an exclusive discount. Save more when you shop the full look.
            </p>
          </div>

          {/* Right: Count */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-slate mb-1">
              ARCHIVE SETS
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-y2k-gunmetal">
              [{bundles.length} SETS]
            </span>
          </div>
        </div>
      </div>

      {/* Bundles grid */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/60 animate-pulse h-96 border border-y2k-gunmetal/10" />
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-24 border border-y2k-gunmetal/15 bg-white">
            <Zap className="w-10 h-10 mx-auto opacity-20 mb-4" />
            <p className="font-bold uppercase tracking-wider text-sm text-y2k-gunmetal/40">
              No bundles available yet — check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white border border-y2k-gunmetal/12 flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                {/* Discount badge + name */}
                <div className="px-7 pt-7 pb-5 border-b border-y2k-gunmetal/8">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight leading-tight">
                      {bundle.name}
                    </h2>
                    <span className="shrink-0 bg-y2k-gunmetal text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {bundle.discount}% OFF
                    </span>
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-y2k-gunmetal/65 leading-relaxed">{bundle.description}</p>
                  )}
                </div>

                {/* Product image strip */}
                <div className="flex gap-0 p-4 flex-wrap">
                  {bundle.products.map((p) => (
                    <div key={p.id} className="relative w-1/3 aspect-[3/4] border border-white overflow-hidden bg-gray-50 group">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    </div>
                  ))}
                </div>

                {/* Product names */}
                <div className="px-7 pb-4 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/40 mb-2">Includes</p>
                  <ul className="space-y-1">
                    {bundle.products.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-y2k-gunmetal/80 truncate">{p.name}</span>
                        <span className="font-bold text-y2k-gunmetal/50 ml-3 shrink-0">₹{p.price.toLocaleString("en-IN")}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing + CTA */}
                <div className="px-7 pb-7">
                  <div className="flex items-end justify-between mb-4 pt-4 border-t border-y2k-gunmetal/8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/40 mb-0.5">Bundle Price</p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl tracking-tight">
                          ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{bundle.originalTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-[10px] text-y2k-slate font-bold uppercase tracking-wider mt-0.5">
                        You save ₹{(bundle.originalTotal - bundle.bundlePrice).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddBundle(bundle)}
                    disabled={bundle.products.every((p) => p.isSoldOut)}
                    className="w-full btn-bagify text-white text-[11px] font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {addedId === bundle.id ? "Added to Bag ✓" : "Add Bundle to Bag"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
