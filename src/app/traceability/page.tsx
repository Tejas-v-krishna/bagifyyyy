import Link from "next/link";
import { Globe, Layers, ShieldCheck, Recycle, CheckCircle2, Factory, Search, ArrowRight } from "lucide-react";

export default function TraceabilityPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      {/* ── Hero Banner ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-12 border-b border-y2k-gunmetal/15">
        <p className="text-xs font-bold uppercase tracking-widest text-y2k-slate mb-2">
          CIRCULARITY &amp; PROVENANCE
        </p>
        <h1 className="font-display text-4xl sm:text-6xl lg:text-[72px] uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-4">
          TRACEABILITY &amp; PROVENANCE
        </h1>
        <p className="text-sm md:text-base text-y2k-gunmetal/80 font-medium max-w-2xl leading-relaxed">
          From Japanese deadstock selvedge mills to hand-curated Tokyo flea market vaults: every BAGIFYYYY garment carries a transparent lifecycle and authentic heritage.
        </p>
      </section>

      {/* ── The 4 Pillars of Traceability ────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center">
                  <Search className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2.5 py-1">
                  STAGE 01
                </span>
              </div>
              <h3 className="font-display font-medium text-2xl uppercase tracking-tight text-y2k-gunmetal mb-3">
                ARCHIVAL SOURCING &amp; AUTHENTICATION
              </h3>
              <p className="text-xs sm:text-sm text-y2k-gunmetal/80 leading-relaxed">
                Our archival collection items are physically sourced across verified vintage dealers, estate archives, and private collectors in Harajuku, London, Los Angeles, and Milan. Each piece undergoes an 8-point physical authenticity audit examining stitch density, Talon/YKK hardware codes, wash tags, and fabric weight.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-y2k-gunmetal/10 text-xs font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> 100% Verified Authentic Archival Provenance
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center">
                  <Layers className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2.5 py-1">
                  STAGE 02
                </span>
              </div>
              <h3 className="font-display font-medium text-2xl uppercase tracking-tight text-y2k-gunmetal mb-3">
                CIRCULAR DEADSTOCK &amp; RAW MATERIALS
              </h3>
              <p className="text-xs sm:text-sm text-y2k-gunmetal/80 leading-relaxed">
                For our signature cut-and-sew capsule drops, we salvage unused rolls of premium deadstock heavyweight cotton (380–450 GSM), surplus military canvas, and selvedge denim that would otherwise end in landfills. No fast fashion synthetics, no disposable blends.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-y2k-gunmetal/10 text-xs font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Zero Overproduction / Micro-Batch Drops Only
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center">
                  <Factory className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2.5 py-1">
                  STAGE 03
                </span>
              </div>
              <h3 className="font-display font-medium text-2xl uppercase tracking-tight text-y2k-gunmetal mb-3">
                ETHICAL ATELIER MANUFACTURING
              </h3>
              <p className="text-xs sm:text-sm text-y2k-gunmetal/80 leading-relaxed">
                Crafted in certified boutique ateliers where master artisans receive dignified living wages, strict safety protections, and healthcare benefits. We publish our tier-1 and tier-2 production partners annually to maintain complete supply chain transparency.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-y2k-gunmetal/10 text-xs font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Fair Labor Association Aligned
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate bg-y2k-ice px-2.5 py-1">
                  STAGE 04
                </span>
              </div>
              <h3 className="font-display font-medium text-2xl uppercase tracking-tight text-y2k-gunmetal mb-3">
                PLASTIC-FREE PACKAGING &amp; LOGISTICS
              </h3>
              <p className="text-xs sm:text-sm text-y2k-gunmetal/80 leading-relaxed">
                Orders are dispatched in 100% recycled unbleached kraft boxes with water-activated reinforced paper tape and plant-based biodegradable protective dust bags. Carbon offsets are calculated on every domestic and international parcel.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-y2k-gunmetal/10 text-xs font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> 100% Recyclable &amp; Plastic-Free Mailers
            </div>
          </div>
        </div>
      </section>

      {/* ── Anti-Fast Fashion Manifesto Callout ─────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="bg-y2k-gunmetal text-[#F8F5E9] p-8 md:p-12 border border-y2k-gunmetal shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-display font-medium text-2xl md:text-3xl uppercase tracking-tight mb-2">
              OUR LIFELONG BUY-BACK GUARANTEE
            </h2>
            <p className="text-xs md:text-sm text-[#F8F5E9]/80 leading-relaxed">
              When you are ready to pass on a BAGIFYYYY piece, return it through our Archive Circularity Program to receive 30% store credit. We clean, restore, and re-archive it for the next generation.
            </p>
          </div>
          <Link
            href="/return-request"
            className="bg-[#F8F5E9] text-y2k-gunmetal text-xs font-bold uppercase tracking-widest px-8 py-3.5 hover:bg-white transition-colors shrink-0 shadow"
          >
            JOIN CIRCULARITY →
          </Link>
        </div>
      </section>
    </div>
  );
}
