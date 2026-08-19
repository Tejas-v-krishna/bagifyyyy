"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, ShoppingBag, ArrowDownRight } from "lucide-react";

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
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  if (!bundles || bundles.length === 0) return null;

  const currentBundle = bundles[selectedIdx] || bundles[0];
  const isAdded = addedBundleId === currentBundle.id;

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

  const heroImage = currentBundle.products[0]?.image || "/placeholder.jpg";

  return (
    <section className="w-full bg-y2k-ice py-20 sm:py-32 px-4 sm:px-6 lg:px-12 border-t border-y2k-gunmetal/15">
      <div className="w-full max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-y2k-gunmetal/15">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-gunmetal/50 mb-3">
              BAGIFYYYY LOOKBOOK // COMBO SYSTEM
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] uppercase tracking-[-0.04em] leading-[0.9] text-y2k-gunmetal">
              CURATED <br />
              <span className="text-y2k-gunmetal/60 italic">OUTFITS</span>
            </h2>
          </div>

          <Link
            href="/bundles"
            className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-y2k-gunmetal hover:text-black transition-colors pb-2 border-b border-y2k-gunmetal/30 hover:border-y2k-gunmetal"
          >
            <span>Explore Archive</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Outfit Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-12">
          {bundles.map((bundle, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={bundle.id}
                onClick={() => setSelectedIdx(idx)}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-3 border cursor-pointer ${
                  isSelected
                    ? "bg-y2k-gunmetal text-white border-y2k-gunmetal"
                    : "bg-transparent text-y2k-gunmetal border-y2k-gunmetal/20 hover:border-y2k-gunmetal/50"
                }`}
              >
                <span className="opacity-50">0{idx + 1}</span>
                {bundle.name}
              </button>
            );
          })}
        </div>

        {/* Editorial Layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBundle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-y2k-gunmetal/15 border border-y2k-gunmetal/15"
          >
            
            {/* Hero Image (7 Cols) */}
            <div className="lg:col-span-7 bg-y2k-ice relative min-h-[60vh] lg:min-h-[800px] flex group">
              <Image
                src={heroImage}
                alt={currentBundle.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-center grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
              />
              
              {/* Badges on Image */}
              <div className="absolute top-6 left-6 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal shadow-sm border border-y2k-gunmetal/10">
                LOOK 0{selectedIdx + 1}
              </div>
              <div className="absolute bottom-6 right-6 bg-y2k-gunmetal text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                -{currentBundle.discount}% OFF
              </div>
            </div>

            {/* Breakdown & Action (5 Cols) */}
            <div className="lg:col-span-5 bg-white flex flex-col h-full">
              
              <div className="p-8 sm:p-12 lg:p-16 flex-1 flex flex-col justify-center">
                <div className="mb-12">
                  <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-[-0.03em] text-y2k-gunmetal leading-[0.95] mb-4">
                    {currentBundle.name}
                  </h3>
                  <p className="text-sm text-y2k-gunmetal/60 leading-relaxed font-sans max-w-sm">
                    {currentBundle.description ||
                      "Curated head-to-toe vintage silhouette crafted to wear together seamlessly."}
                  </p>
                </div>

                {/* Garment Grid */}
                <div className="space-y-0 border-t border-y2k-gunmetal/15 mb-12">
                  {currentBundle.products.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between py-6 border-b border-y2k-gunmetal/15"
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold uppercase text-y2k-gunmetal/40 w-4">
                          0{idx + 1}
                        </span>
                        <div className="w-16 h-20 bg-y2k-ice relative shrink-0 border border-y2k-gunmetal/10 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-y2k-gunmetal max-w-[180px] leading-tight">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-xs font-mono text-y2k-gunmetal/70">
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Financials & Add to Cart */}
                <div className="mt-auto pt-8">
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/50 mb-2">
                        COMBO SET VALUE
                      </p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-4xl sm:text-5xl tracking-tight text-y2k-gunmetal">
                          ₹{currentBundle.bundlePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-sm text-y2k-gunmetal/40 line-through font-mono">
                          ₹{currentBundle.originalTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddBundle(currentBundle)}
                    className={`w-full py-5 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 border border-y2k-gunmetal ${
                      isAdded
                        ? "bg-white text-y2k-gunmetal"
                        : "bg-y2k-gunmetal text-white hover:bg-white hover:text-y2k-gunmetal"
                    }`}
                  >
                    {isAdded ? (
                      "ADDED TO BAG"
                    ) : (
                      <>
                        <span>ACQUIRE FULL LOOK</span>
                        <ArrowDownRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  
                  {isAdded && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal mt-3 text-center animate-pulse">
                      Redirect to bag to checkout
                    </p>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
