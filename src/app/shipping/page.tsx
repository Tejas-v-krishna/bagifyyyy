import Link from "next/link";
import { Truck, ShieldCheck, Clock } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export const metadata = {
  title: "Shipping & Store Policy | BAGIFYYYY",
  description: "Shipping timelines, order dispatch information, and archival store policies.",
};

export default function ShippingPage() {
  return (
    <EditorialPageShell
      eyebrow="Delivery timelines / Dispatch"
      title="Shipping & store policy"
       description="We ship across India. Orders leave us within 24 to 48 hours."
    >
      <div className="w-full">
        {/* Shipping Timelines Table */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white text-[9.5px] font-bold uppercase tracking-[0.18em]">
                <th className="p-4 sm:p-4.5">SERVICE</th>
                <th className="p-4 sm:p-4.5">ESTIMATED TRANSIT</th>
                <th className="p-4 sm:p-4.5 text-right">RATES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-mono text-xs">
              <tr className="hover:bg-black/[0.02] transition-colors">
                <td className="p-4 sm:p-4.5 font-bold font-sans text-black">Standard Speed (India Post &amp; Bluedart)</td>
                <td className="p-4 sm:p-4.5 text-black/70">4–6 Business Days</td>
                <td className="p-4 sm:p-4.5 text-right font-bold uppercase text-black">FREE OVER ₹2,000 · ₹49 BELOW</td>
              </tr>
              <tr className="hover:bg-black/[0.02] bg-[#fbfbfb] transition-colors">
                <td className="p-4 sm:p-4.5 font-bold font-sans text-black">Express Metro Air Dispatch</td>
                <td className="p-4 sm:p-4.5 text-black/70">2–3 Business Days</td>
                <td className="p-4 sm:p-4.5 text-right font-bold text-black">₹99</td>
              </tr>
            </tbody>
          </table>
        </div>

         {/* Final sale notice */}
        <div className="rounded-2xl bg-black text-white p-6 sm:p-8 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 block mb-2">
             STORE POLICY
          </span>
          <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-tight mb-2">
             ONE-OFF VINTAGE · SMALL-RUN PIECES
          </h2>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
             Many pieces are one-off vintage or made in small runs. Check the measurements and photos before ordering.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="rounded-2xl bg-white border border-black/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center mb-4">
              <Clock className="w-4 h-4 text-black" />
            </div>
             <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-1">1. QUICK DISPATCH</h3>
            <p className="text-xs text-black/60 leading-relaxed">
               Orders are packed and sent within 24–48 hours.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-black/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center mb-4">
              <Truck className="w-4 h-4 text-black" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-1">2. LIVE TRACKING</h3>
            <p className="text-xs text-black/60 leading-relaxed">
               We send tracking details by SMS and email when your order ships.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-black/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center mb-4">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
             <h3 className="font-bold text-xs uppercase tracking-wider text-black mb-1">3. CHECKED BEFORE SHIPPING</h3>
            <p className="text-xs text-black/60 leading-relaxed">
               Vintage pieces are cleaned, steam-treated, and checked before they leave us.
            </p>
          </div>
        </div>

        {/* Track link */}
        <div className="text-center pt-2">
          <Link
            href="/track"
            className="btn-bagify btn-bagify-dark px-8 py-3.5 text-[10.5px] uppercase tracking-[0.18em]"
          >
             Track your order
          </Link>
        </div>
      </div>
    </EditorialPageShell>
  );
}
