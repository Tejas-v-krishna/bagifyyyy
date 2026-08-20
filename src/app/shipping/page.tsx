import Link from "next/link";
import { Truck, ShieldCheck, Clock, PackageCheck, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Shipping & Store Policy | BAGIFYYYY",
  description: "Shipping timelines, order dispatch information, and archival store policies.",
};

export default function ShippingPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">SHIPPING &amp; STORE POLICY</span>
        </div>

        {/* Header */}
        <div className="mb-8 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            DELIVERY TIMELINES &amp; DISPATCH
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            SHIPPING &amp; STORE POLICY
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            All India priority delivery · Dispatched within 24 to 48 hours from our central archive.
          </p>
        </div>

        {/* Shipping Timelines Table */}
        <div className="bg-white border border-y2k-gunmetal/15 overflow-hidden mb-8 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-y2k-gunmetal text-white text-[9px] font-bold uppercase tracking-wider">
                <th className="p-3 sm:p-3.5">SERVICE</th>
                <th className="p-3 sm:p-3.5">ESTIMATED TRANSIT</th>
                <th className="p-3 sm:p-3.5 text-right">RATES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-y2k-gunmetal/10 font-medium">
              <tr className="hover:bg-y2k-ice/30">
                <td className="p-3 sm:p-3.5 font-bold">Standard Speed (India Post &amp; Bluedart)</td>
                <td className="p-3 sm:p-3.5 text-y2k-gunmetal/70">3–5 Business Days</td>
                <td className="p-3 sm:p-3.5 text-right font-bold uppercase">FREE OVER ₹2000</td>
              </tr>
              <tr className="hover:bg-y2k-ice/30 bg-y2k-ice/20">
                <td className="p-3 sm:p-3.5 font-bold">Express Metro Air Dispatch</td>
                <td className="p-3 sm:p-3.5 text-y2k-gunmetal/70">1–3 Business Days</td>
                <td className="p-3 sm:p-3.5 text-right font-bold">₹149</td>
              </tr>
              <tr className="hover:bg-y2k-ice/30">
                <td className="p-3 sm:p-3.5 font-bold">International Vault Courier</td>
                <td className="p-3 sm:p-3.5 text-y2k-gunmetal/70">7–14 Business Days</td>
                <td className="p-3 sm:p-3.5 text-right font-bold">₹1,499</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Archive Final Sale Banner */}
        <div className="bg-y2k-gunmetal text-white p-5 sm:p-6 mb-8 border border-y2k-gunmetal">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 block mb-1">
            ARCHIVE POLICY
          </span>
          <h2 className="font-display font-medium text-lg sm:text-xl uppercase tracking-tight mb-2">
            1-OF-1 CURATED PIECES · AUTHENTIC VINTAGE
          </h2>
          <p className="text-xs text-white/80 leading-relaxed">
            Every garment in our vault is a rare, authenticated vintage piece. Please inspect dimensions and size charts prior to order placement.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs">
            <Clock className="w-4 h-4 text-y2k-gunmetal mb-2" />
            <h3 className="font-bold text-xs uppercase tracking-wider mb-1">1. FAST DISPATCH</h3>
            <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed">
              Packaged in custom archive dust wrappers and dispatched within 24-48h.
            </p>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs">
            <Truck className="w-4 h-4 text-y2k-gunmetal mb-2" />
            <h3 className="font-bold text-xs uppercase tracking-wider mb-1">2. LIVE TRACKING</h3>
            <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed">
              Real-time airway bill tracking SMS/Email dispatched immediately.
            </p>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-y2k-gunmetal mb-2" />
            <h3 className="font-bold text-xs uppercase tracking-wider mb-1">3. STERILIZED</h3>
            <p className="text-[11px] text-y2k-gunmetal/70 leading-relaxed">
              Every drop piece is sanitized, steam-treated, and hardware-checked.
            </p>
          </div>
        </div>

        {/* Track link */}
        <div className="text-center pt-2">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:underline"
          >
            <span>Have an existing order? Track your shipment here</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
