import Link from "next/link";
import { Truck, ShieldCheck, Clock, ArrowRight, Package, Sparkles } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export const metadata = {
  title: "Shipping & Store Policy | BAGIFYYYY",
  description: "Shipping timelines, order dispatch information, and archival store policies.",
};

export default function ShippingPage() {
  return (
    <EditorialPageShell
      title="Shipping & Store Policy"
      description="Orders are packed and dispatched across India within 24 to 48 hours. Every piece in the archive is an authentic single-piece original."
      backHref="/"
      backLabel="Back to store"
    >
      <div className="w-full space-y-8 sm:space-y-10">

        {/* ── 1. Dispatch & Delivery Service Rates ── */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-black/60">
              01 / Delivery Timelines
            </span>
            <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-black/40">
              India Wide
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs">
            <div className="divide-y divide-black/8">
              {/* Row 1: Standard Speed Post */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4 hover:bg-black/[0.015] transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-black/[0.04] border border-black/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-black">
                      Standard India Post Speed Delivery
                    </h3>
                    <p className="text-xs text-black/55 mt-0.5">
                      Fully tracked door-to-door delivery across all pin codes in India.
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 shrink-0">
                  <span className="text-xs font-mono font-bold text-black">
                    4–6 Business Days
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-black/60 mt-0.5">
                    ₹80 Flat Rate
                  </span>
                </div>
              </div>

              {/* Row 2: Free Shipping on Qualifying Orders */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4 bg-[#fafaf8]">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-black">
                        Complimentary Shipping Offer
                      </h3>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-full">
                        FREESHIP
                      </span>
                    </div>
                    <p className="text-xs text-black/55 mt-0.5">
                      Use code <strong className="text-black font-mono">FREESHIP</strong> at checkout or on bundled qualifying drops.
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 shrink-0">
                  <span className="text-xs font-mono font-bold text-black">
                    4–6 Business Days
                  </span>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black mt-0.5">
                    Free / ₹0.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Editorial Store Policy Card ── */}
        <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-6 sm:p-8 text-black">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/8">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-black">
              02 / Store Policy &amp; Conditions
            </span>
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-[0.14em] text-black/50">
              1-of-1 Archive
            </span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mb-2.5">
            Authentic 1-of-1 Pieces · All Sales Final
          </h2>
          <p className="text-xs sm:text-[13px] text-black/70 leading-relaxed max-w-3xl">
            Every piece curated by BAGIFY is an authentic, one-of-a-kind vintage or small-run archival original. 
            Because each garment is unique with only 1 piece in stock, we cannot offer returns, exchanges, or restocks once an order has been placed. Please carefully review all provided garment measurements, fit notes, and detailed high-resolution photos prior to purchase.
          </p>
        </div>

        {/* ── 3. The 3 Core Pillars ── */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-black/60">
              03 / Our Fulfillment Process
            </span>
            <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-black/40">
              Guaranteed Care
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="rounded-2xl bg-white border border-black/10 p-6 shadow-2xs flex flex-col justify-between transition-all hover:border-black/25">
              <div>
                <div className="w-10 h-10 rounded-full bg-black/[0.04] border border-black/8 flex items-center justify-center mb-4 text-black">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  1. Quick Dispatch
                </h3>
                <p className="text-xs text-black/60 leading-relaxed font-sans">
                  Orders are individually packaged and handed over to India Post Speed Delivery within 24 to 48 hours of order confirmation.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl bg-white border border-black/10 p-6 shadow-2xs flex flex-col justify-between transition-all hover:border-black/25">
              <div>
                <div className="w-10 h-10 rounded-full bg-black/[0.04] border border-black/8 flex items-center justify-center mb-4 text-black">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  2. Live Tracking
                </h3>
                <p className="text-xs text-black/60 leading-relaxed font-sans">
                  As soon as your shipment is scanned by the carrier, tracking details and SMS updates are sent directly to your registered contact.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl bg-white border border-black/10 p-6 shadow-2xs flex flex-col justify-between transition-all hover:border-black/25">
              <div>
                <div className="w-10 h-10 rounded-full bg-black/[0.04] border border-black/8 flex items-center justify-center mb-4 text-black">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  3. Quality Checked
                </h3>
                <p className="text-xs text-black/60 leading-relaxed font-sans">
                  All archival items are sanitized, steam-treated, and inspected by hand before dispatch to match the exact listed condition rating.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. CTA: Track Order Button ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-black/10">
          <Link
            href="/track"
            className="btn-bagify btn-bagify-dark px-8 py-3.5 text-xs uppercase tracking-[0.16em]"
          >
            <span>Track your order</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/faq"
            className="text-xs font-mono uppercase tracking-wider text-black/50 hover:text-black transition-colors underline underline-offset-4 py-2"
          >
            Have more questions? Read our FAQ
          </Link>
        </div>

      </div>
    </EditorialPageShell>
  );
}
