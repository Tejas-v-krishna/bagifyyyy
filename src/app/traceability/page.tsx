import Link from "next/link";
import { Search, Layers, Factory, Recycle, ShieldCheck } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export default function TraceabilityPage() {
  return (
    <EditorialPageShell
       eyebrow="Materials / Sourcing"
       title="Where it comes from"
       description="How we find, make, and look after the pieces we sell."
      wide
    >
      <div className="w-full">
        {/* 4 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-full bg-[#f2f2f2] flex items-center justify-center">
                  <Search className="w-4 h-4 text-black" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white bg-black px-2.5 py-1 rounded-[var(--radius-cta)]">
                  STAGE 01
                </span>
              </div>
              <h3 className="font-sans font-bold text-lg uppercase tracking-tight text-black mb-2">
                 FINDING VINTAGE
              </h3>
              <p className="text-xs text-black/65 leading-relaxed">
                 Vintage pieces come from collectors and resale markets. We check labels, stitching, hardware, wash, and condition before listing them.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-black/5 text-[10px] font-bold text-black uppercase tracking-[0.14em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
               <span>Checked before listing</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-full bg-[#f2f2f2] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-black" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white bg-black px-2.5 py-1 rounded-[var(--radius-cta)]">
                  STAGE 02
                </span>
              </div>
              <h3 className="font-sans font-bold text-lg uppercase tracking-tight text-black mb-2">
                 FABRIC &amp; DEADSTOCK
              </h3>
              <p className="text-xs text-black/65 leading-relaxed">
                 When we make a small run, we look for surplus cotton and denim first. The aim is simple: use good fabric and make only what we can stand behind.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-black/5 text-[10px] font-bold text-black uppercase tracking-[0.14em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
               <span>Small runs, less waste</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-full bg-[#f2f2f2] flex items-center justify-center">
                  <Factory className="w-4 h-4 text-black" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white bg-black px-2.5 py-1 rounded-[var(--radius-cta)]">
                  STAGE 03
                </span>
              </div>
              <h3 className="font-sans font-bold text-lg uppercase tracking-tight text-black mb-2">
                 MADE WITH PARTNERS
              </h3>
              <p className="text-xs text-black/65 leading-relaxed">
                 New pieces are cut and sewn with small production partners. We choose teams we can work with directly and return to.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-black/5 text-[10px] font-bold text-black uppercase tracking-[0.14em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
               <span>Small production partners</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-full bg-[#f2f2f2] flex items-center justify-center">
                  <Recycle className="w-4 h-4 text-black" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white bg-black px-2.5 py-1 rounded-[var(--radius-cta)]">
                  STAGE 04
                </span>
              </div>
              <h3 className="font-sans font-bold text-lg uppercase tracking-tight text-black mb-2">
                 CARE &amp; WEAR
              </h3>
              <p className="text-xs text-black/65 leading-relaxed">
                 Wear changes clothes. Follow the care notes on each piece, wash less when you can, and keep the fabric out of the bin for as long as possible.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-black/5 text-[10px] font-bold text-black uppercase tracking-[0.14em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
               <span>Made to be worn again</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            href="/products"
            className="btn-bagify btn-bagify-dark px-10 py-4 text-[10.5px] uppercase tracking-[0.2em]"
          >
             Shop the current pieces
          </Link>
        </div>
      </div>
    </EditorialPageShell>
  );
}
