"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  ArrowRight,
  Check,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export type HomeBundleItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  category?: string;
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

  // Primary hero photo is the first product in bundle or current hovered item
  const heroImage =
    currentBundle.products.find((p) => p.id === activeHoverItem)?.image ||
    currentBundle.products[0]?.image ||
    "/placeholder.jpg";

  return (
    <section className="w-full bg-[#121820] text-[#F8F5E9] py-20 sm:py-28 px-4 sm:px-6 lg:px-12 border-y border-y2k-gunmetal/30 relative overflow-hidden">
      
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-[1800px] mx-auto relative z-10">
        
        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="bg-white text-black text-[9px] font-black uppercase px-2.5 py-0.5 tracking-wider">
                EDITORIAL COMBO SYSTEM
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> EXCLUSIVE BUNDLE PRICING
              </span>
            </div>
            <h2 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[-0.03em] leading-none text-white">
              CURATED ARCHIVE BUNDLES
            </h2>
          </div>

          <Link
            href="/bundles"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/70 hover:text-white transition-colors group"
          >
            <span>Explore All {bundles.length} Outfits</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white/50 group-hover:text-white" />
          </Link>
        </div>

        {/* ── Interactive Outfit Switcher Pills ── */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 select-none no-scrollbar">
          {bundles.map((bundle, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={bundle.id}
                onClick={() => {
                  setSelectedIdx(idx);
                  setActiveHoverItem(null);
                }}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-white text-black border-white shadow-md translate-y-[-1px]"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="font-mono text-[10px] opacity-60">0{idx + 1}</span>
                <span>{bundle.name}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 font-mono font-bold ${
                    isSelected
                      ? "bg-black text-white"
                      : "bg-emerald-950/60 text-emerald-400 border border-emerald-700/40"
                  }`}
                >
                  {bundle.discount}% OFF
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Asymmetric Editorial Runway Stage ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBundle.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch"
          >
            
            {/* LEFT: Massive Runway Lookbook Hero (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0E131A] border border-white/15 relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 min-h-[560px] lg:min-h-[640px] group">
              
              {/* Background Photo of Selected Look */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={heroImage}
                  alt={currentBundle.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                {/* Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E131A] via-black/30 to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0E131A]/70 via-transparent to-[#0E131A]/40" />
              </div>

              {/* Floating Top Bar */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="backdrop-blur-md bg-black/60 border border-white/20 px-3.5 py-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LOOK 0{selectedIdx + 1} / FULL COMBO
                </div>

                <div className="backdrop-blur-md bg-white text-black font-black text-[10px] uppercase px-3 py-1.5 shadow-lg tracking-wider">
                  SAVE {currentBundle.discount}%
                </div>
              </div>

              {/* Center Interactive Hotspots Tag Strip */}
              <div className="relative z-10 my-auto py-12 flex flex-col items-start gap-2.5">
                <span className="text-[9px] uppercase tracking-[0.25em] text-white/60 font-bold mb-1">
                  INCLUDED ARCHIVE PIECES:
                </span>
                {currentBundle.products.map((item, pIdx) => {
                  const isHovered = activeHoverItem === item.id;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActiveHoverItem(item.id)}
                      onMouseLeave={() => setActiveHoverItem(null)}
                      className={`backdrop-blur-md px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all border ${
                        isHovered
                          ? "bg-white text-black border-white scale-105 shadow-xl"
                          : "bg-black/60 text-white/90 border-white/20 hover:bg-black/80 hover:border-white/50"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/20 text-[9px] flex items-center justify-center font-mono">
                        {pIdx + 1}
                      </span>
                      <span>{item.name}</span>
                      <span className="text-[10px] opacity-60 font-mono">
                        ₹{item.price.toLocaleString("en-IN")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Floating Bottom Bar */}
              <div className="relative z-10 pt-6 border-t border-white/15 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">
                    TOTAL CURATED PIECES
                  </p>
                  <p className="text-xl font-bold uppercase tracking-tight text-white">
                    {currentBundle.products.length} Archive Garments
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                    INSTANT COMBO SAVINGS
                  </span>
                  <p className="font-display text-2xl font-black text-white">
                    -₹{currentBundle.savings.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT: Garment Breakdown & Checkout Cockpit (5 Cols) */}
            <div className="lg:col-span-5 bg-[#171F2A] border border-white/15 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              
              <div>
                {/* Look Title */}
                <div className="pb-5 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>SPECIAL OUTFIT DISCOUNT</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white leading-tight">
                    {currentBundle.name}
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mt-2">
                    {currentBundle.description ||
                      "Curated head-to-toe vintage silhouette crafted to wear together seamlessly."}
                  </p>
                </div>

                {/* Deconstructed Garment Micro-Cards */}
                <div className="space-y-2.5 mb-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                    OUTFIT BREAKDOWN
                  </p>
                  
                  {currentBundle.products.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setActiveHoverItem(item.id)}
                      onMouseLeave={() => setActiveHoverItem(null)}
                      className="p-3 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/20 transition-all flex items-center justify-between gap-3 group/row cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-14 bg-black/40 relative shrink-0 border border-white/10 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover group-hover/row:scale-110 transition-transform"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-mono">
                            PIECE 0{idx + 1}
                          </span>
                          <p className="text-xs font-bold text-white truncate group-hover/row:text-emerald-300 transition-colors">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-bold text-white/90">
                          ₹{item.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Box & Action Button */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                
                {/* Price Breakdown */}
                <div className="p-4 bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/50 block font-mono">
                      COMPLETE COMBO PRICE
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display text-2xl sm:text-3xl font-black text-white">
                        ₹{currentBundle.bundlePrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-white/40 line-through font-mono">
                        ₹{currentBundle.originalTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 inline-block">
                      SAVE ₹{currentBundle.savings.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Main Action Button */}
                <button
                  type="button"
                  onClick={() => handleAddBundle(currentBundle)}
                  className={`w-full py-4 text-xs font-black uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      Full Outfit Added to Bag!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Acquire Full Outfit ({currentBundle.products.length} Pieces)
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] text-white/50 uppercase tracking-widest pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authentic Sourcing
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> 1-Click Bundle
                  </span>
                </div>
              </div>

            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
