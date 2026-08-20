import Link from "next/link";
import { Search, Layers, Factory, Recycle, ShieldCheck, ArrowRight } from "lucide-react";

export default function TraceabilityPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">TRACEABILITY &amp; PROVENANCE</span>
        </div>

        {/* Header */}
        <div className="mb-8 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            CIRCULARITY &amp; PROVENANCE
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            TRACEABILITY &amp; SOURCING
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            From Japanese deadstock selvedge mills to hand-curated archival vaults: full transparency on every drop piece.
          </p>
        </div>

        {/* 4 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Search className="w-5 h-5 text-y2k-gunmetal" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                  STAGE 01
                </span>
              </div>
              <h3 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-2">
                ARCHIVAL SOURCING &amp; AUTHENTICATION
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
                Archival items are sourced from verified estate vaults and vintage collectors across Harajuku, London, and Milan. Each piece undergoes physical inspection of stitch density, Talon/YKK hardware, and wash codes.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-y2k-gunmetal/10 text-[10px] font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal" />
              <span>100% Verified Authentic Provenance</span>
            </div>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Layers className="w-5 h-5 text-y2k-gunmetal" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                  STAGE 02
                </span>
              </div>
              <h3 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-2">
                DEADSTOCK &amp; RAW MATERIALS
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
                For capsule drops, we salvage surplus rolls of premium heavyweight cotton (380–450 GSM) and selvedge denim that would otherwise end in landfills. No fast fashion synthetics.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-y2k-gunmetal/10 text-[10px] font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal" />
              <span>Zero Overproduction · Micro-Batches</span>
            </div>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Factory className="w-5 h-5 text-y2k-gunmetal" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                  STAGE 03
                </span>
              </div>
              <h3 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-2">
                ETHICAL ATELIER PRODUCTION
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
                Cut and constructed in certified boutique partner ateliers where artisans receive verified living wages, safety standards, and fair workplace protections.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-y2k-gunmetal/10 text-[10px] font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal" />
              <span>Fair Labor Aligned Manufacturing</span>
            </div>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Recycle className="w-5 h-5 text-y2k-gunmetal" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2 py-0.5 border border-y2k-gunmetal/10">
                  STAGE 04
                </span>
              </div>
              <h3 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-2">
                CIRCULAR CARE &amp; LONGEVITY
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
                Garments are designed to age with wear and maintain value over decades. We build heirloom archive pieces that resist disposable wardrobe cycles.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-y2k-gunmetal/10 text-[10px] font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal" />
              <span>Lifetime Durability Guarantee</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/products"
            className="btn-bagify inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider"
          >
            <span>Explore Sustainable Archive Drops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
