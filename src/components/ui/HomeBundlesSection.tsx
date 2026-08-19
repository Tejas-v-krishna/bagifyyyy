"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDownRight } from "lucide-react";

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
  const [activeHoverItem, setActiveHoverItem] = useState<string | null>(null);

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

  // Helper to render the collage grid based on number of products
  const renderCollage = (products: HomeBundleItem[]) => {
    const count = products.length;

    return (
      <div className="absolute inset-0 p-4 sm:p-6 w-full h-full flex gap-4">
        {count === 1 && (
          <CollageImage item={products[0]} activeId={activeHoverItem} className="w-full h-full" />
        )}

        {count === 2 && (
          <>
            <CollageImage item={products[0]} activeId={activeHoverItem} className="w-1/2 h-full" />
            <CollageImage item={products[1]} activeId={activeHoverItem} className="w-1/2 h-full" />
          </>
        )}

        {count >= 3 && (
          <>
            <CollageImage item={products[0]} activeId={activeHoverItem} className="w-[55%] h-full" />
            <div className="w-[45%] h-full flex flex-col gap-4">
              <CollageImage item={products[1]} activeId={activeHoverItem} className="w-full h-1/2" />
              <CollageImage item={products[2]} activeId={activeHoverItem} className="w-full h-1/2" />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <section className="w-full bg-y2k-ice py-12 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-12 border-t border-y2k-gunmetal/15">
      <div className="w-full max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16 pb-6 sm:pb-8 border-b border-y2k-gunmetal/15">
          <div className="max-w-2xl">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-gunmetal/50 mb-2 sm:mb-3">
              BAGIFYYYY LOOKBOOK // COMBO SYSTEM
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] uppercase tracking-[-0.04em] leading-[0.9] text-y2k-gunmetal">
              CURATED <br />
              <span className="text-y2k-gunmetal/60 italic">OUTFITS</span>
            </h2>
          </div>

          <Link
            href="/bundles"
            className="inline-flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-y2k-gunmetal hover:text-black transition-colors pb-1 sm:pb-2 border-b border-y2k-gunmetal/30 hover:border-y2k-gunmetal"
          >
            <span>Explore Archive</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Outfit Selection Massive Blocks - Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="flex md:grid md:grid-cols-4 overflow-x-auto snap-x snap-mandatory gap-0 border-y md:border border-y2k-gunmetal/15 mb-8 sm:mb-12 bg-white shadow-sm hide-scrollbar">
          {bundles.map((bundle, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={bundle.id}
                onClick={() => {
                  setSelectedIdx(idx);
                  setActiveHoverItem(null);
                }}
                className={`min-w-[80vw] sm:min-w-[280px] md:min-w-0 flex-shrink-0 snap-start p-5 sm:p-6 lg:p-8 text-left border-r md:border-b-0 border-y2k-gunmetal/15 transition-all cursor-pointer group ${
                  isSelected
                    ? "bg-y2k-gunmetal text-white"
                    : "bg-white text-y2k-gunmetal hover:bg-y2k-ice"
                } last:border-r-0`}
              >
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/50' : 'text-y2k-gunmetal/40'}`}>
                    LOOK 0{idx + 1}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-1 border ${isSelected ? 'border-white/20 text-white' : 'border-y2k-gunmetal/20 text-y2k-gunmetal'}`}>
                    {bundle.discount}% OFF
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl lg:text-3xl uppercase leading-[1.1] pr-2 group-hover:translate-x-1 transition-transform truncate md:whitespace-normal">
                  {bundle.name}
                </h3>
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
            
            {/* LEFT: Multi-Product Collage Frame (7 Cols) */}
            <div className="lg:col-span-7 bg-white relative h-[400px] sm:h-[500px] lg:h-auto lg:min-h-[700px] xl:min-h-[800px] flex">
              {renderCollage(currentBundle.products)}
              
              {/* Badges on Frame */}
              <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal shadow-sm border border-y2k-gunmetal/10 z-20">
                LOOK 0{selectedIdx + 1}
              </div>
              <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 bg-y2k-gunmetal text-white px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-sm z-20">
                -{currentBundle.discount}% OFF
              </div>
            </div>

            {/* RIGHT: Breakdown & Action (5 Cols) */}
            <div className="lg:col-span-5 bg-white flex flex-col h-full lg:border-l border-y2k-gunmetal/15">
              
              <div className="p-5 sm:p-8 lg:p-12 flex-1 flex flex-col justify-center">
                <div className="mb-6 sm:mb-10">
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl uppercase tracking-[-0.03em] text-y2k-gunmetal leading-[0.95] mb-3">
                    {currentBundle.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-y2k-gunmetal/60 leading-relaxed font-sans max-w-sm">
                    {currentBundle.description ||
                      "Curated head-to-toe vintage silhouette crafted to wear together seamlessly."}
                  </p>
                </div>

                {/* Garment Hover Grid */}
                <div className="space-y-0 border-t border-y2k-gunmetal/15 mb-8 sm:mb-10">
                  {currentBundle.products.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setActiveHoverItem(item.id)}
                      onMouseLeave={() => setActiveHoverItem(null)}
                      className="group flex items-center justify-between py-4 sm:py-5 border-b border-y2k-gunmetal/15 cursor-crosshair transition-colors hover:bg-y2k-ice/30"
                    >
                      <div className="flex items-center gap-3 sm:gap-5 px-1 sm:px-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase text-y2k-gunmetal/40 w-4 group-hover:text-y2k-gunmetal transition-colors shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="w-12 h-14 sm:w-16 sm:h-20 bg-y2k-ice relative shrink-0 border border-y2k-gunmetal/10 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[40%] group-hover:grayscale-0"
                          />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-tight text-y2k-gunmetal truncate group-hover:translate-x-1 transition-transform duration-300">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-[10px] sm:text-xs font-mono text-y2k-gunmetal/70 px-1 sm:px-2 group-hover:text-black transition-colors shrink-0">
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Financials & Add to Cart */}
                <div className="mt-auto pt-2">
                  <div className="flex items-end justify-between mb-6 sm:mb-8">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/50 mb-1 sm:mb-2">
                        COMBO SET VALUE
                      </p>
                      <div className="flex items-baseline gap-2 sm:gap-3">
                        <span className="font-display text-3xl sm:text-4xl tracking-tight text-y2k-gunmetal">
                          ₹{currentBundle.bundlePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs sm:text-sm text-y2k-gunmetal/40 line-through font-mono">
                          ₹{currentBundle.originalTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddBundle(currentBundle)}
                    className={`w-full py-4 sm:py-5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 border border-y2k-gunmetal shadow-[3px_3px_0px_#28323F] sm:shadow-[4px_4px_0px_#28323F] hover:shadow-[0px_0px_0px_#28323F] hover:translate-x-[3px] hover:translate-y-[3px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] ${
                      isAdded
                        ? "bg-white text-y2k-gunmetal"
                        : "bg-y2k-gunmetal text-white"
                    }`}
                  >
                    {isAdded ? (
                      "ADDED TO BAG"
                    ) : (
                      <>
                        <span>ACQUIRE FULL LOOK</span>
                        <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </>
                    )}
                  </button>
                  
                  {isAdded && (
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal mt-4 text-center animate-pulse">
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

// Sub-component for individual collage images
function CollageImage({
  item,
  activeId,
  className,
}: {
  item: HomeBundleItem;
  activeId: string | null;
  className: string;
}) {
  const isHovered = activeId === item.id;
  const isAnyHovered = activeId !== null;

  return (
    <div
      className={`relative overflow-hidden bg-y2k-ice border transition-all duration-500 ease-out ${className} ${
        isHovered
          ? "border-y2k-gunmetal shadow-xl scale-[1.02] z-10"
          : isAnyHovered
          ? "border-y2k-gunmetal/10 opacity-60 scale-100 z-0"
          : "border-y2k-gunmetal/20 scale-100 z-0 hover:border-y2k-gunmetal/50"
      }`}
    >
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes="(max-width: 1024px) 100vw, 30vw"
        className={`object-cover object-center transition-all duration-700 ${
          isHovered ? "grayscale-0 scale-105" : "grayscale-[20%] scale-100"
        }`}
      />
      {/* Product Tag Overlay */}
      <div
        className={`absolute bottom-4 right-4 bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal border border-y2k-gunmetal/10 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        {item.name}
      </div>
    </div>
  );
}
