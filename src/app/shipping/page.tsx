import React from "react";
import Link from "next/link";
import { Truck, ShieldCheck, AlertCircle, Clock, PackageCheck } from "lucide-react";

export const metadata = {
  title: "Shipping & Store Policy | BAGIFYYYY",
  description: "Shipping timelines, order dispatch information, and archival final-sale policies.",
};

export default function ShippingPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      {/* Header */}
      <header className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-20 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-2">
          DELIVERY &amp; ORDER GUIDELINES
        </span>
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-[-0.03em] font-medium text-y2k-gunmetal">
          SHIPPING &amp; STORE POLICY
        </h1>
        <p className="mt-4 text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-y2k-gunmetal/70 max-w-lg mx-auto">
          ALL INDIA SHIPPING • DISPATCHED WITHIN 24-48 HOURS
        </p>
      </header>

      {/* Shipping Timelines Table */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-12 mb-16">
        <div className="bg-white border border-y2k-gunmetal/20 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#232D3B] text-white text-xs font-bold uppercase tracking-[0.16em]">
                <th className="p-4 sm:p-5">Service</th>
                <th className="p-4 sm:p-5">Delivery Time</th>
                <th className="p-4 sm:p-5">Cost</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              <tr className="border-b border-y2k-gunmetal/10 hover:bg-black/[0.02]">
                <td className="p-4 sm:p-5 font-bold">Standard Speed Delivery (India Post)</td>
                <td className="p-4 sm:p-5">3-5 Business Days</td>
                <td className="p-4 sm:p-5 text-emerald-700 font-bold uppercase">COMPLIMENTARY (FREE)</td>
              </tr>
              <tr className="border-b border-y2k-gunmetal/10 hover:bg-black/[0.02] bg-y2k-ice/30">
                <td className="p-4 sm:p-5 font-bold">Express Metro Air Dispatch</td>
                <td className="p-4 sm:p-5">2-3 Business Days</td>
                <td className="p-4 sm:p-5">₹149</td>
              </tr>
              <tr className="hover:bg-black/[0.02]">
                <td className="p-4 sm:p-5 font-bold">International Archive Shipping</td>
                <td className="p-4 sm:p-5">7-14 Business Days</td>
                <td className="p-4 sm:p-5">₹1,499</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Final Sale Policy Banner */}
      <div className="w-full bg-[#232D3B] text-white py-10 px-4 text-center my-12 border-y border-y2k-gunmetal/30">
        <div className="max-w-[800px] mx-auto flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400 block mb-1">
            ✦ ARCHIVE POLICY ✦
          </span>
          <h2 className="font-display text-2xl sm:text-4xl uppercase tracking-tight font-medium mb-3">
            ALL SALES ARE FINAL — NO RETURNS OR EXCHANGES
          </h2>
          <p className="text-xs sm:text-sm text-white/80 font-normal leading-relaxed max-w-xl">
            Because every item in our vault is a rare, authenticated 1-of-1 vintage or archival piece, all purchases are non-returnable, non-exchangeable, and non-cancellable once confirmed.
          </p>
        </div>
      </div>

      {/* 3 Pillars of Dispatch */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-y2k-gunmetal/15 p-6 flex flex-col">
            <div className="w-10 h-10 bg-y2k-ice rounded-full flex items-center justify-center mb-4 text-y2k-gunmetal">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              1. FAST DISPATCH
            </h3>
            <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
              Orders are packaged with archive dust bags and dispatched within 24 to 48 hours from our central inventory hub.
            </p>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-6 flex flex-col">
            <div className="w-10 h-10 bg-y2k-ice rounded-full flex items-center justify-center mb-4 text-y2k-gunmetal">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              2. REAL-TIME TRACKING
            </h3>
            <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
              Tracking numbers are instantly sent via SMS and Email as soon as your manifest is scanned by the courier partner.
            </p>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-6 flex flex-col">
            <div className="w-10 h-10 bg-y2k-ice rounded-full flex items-center justify-center mb-4 text-y2k-gunmetal">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              3. VERIFIED PROVENANCE
            </h3>
            <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
              Every garment undergoes manual authentication, condition grading, and steam sterilization before dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Policy Questions */}
      <section className="max-w-[840px] mx-auto px-4 sm:px-6 lg:px-12 mt-12">
        <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-tight font-medium mb-6 text-center text-y2k-gunmetal">
          STORE POLICIES &amp; CLARIFICATIONS
        </h2>
        <div className="space-y-4">
          <div className="bg-white border border-y2k-gunmetal/15 p-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-y2k-gunmetal mb-2">
              Why are all sales final with no returns or exchanges?
            </h4>
            <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
              BAGIFYYYY specializes in curated, single-quantity (1-of-1) vintage items and deadstock archive pieces. Because we do not carry replacement inventory, all sales are strictly final. Please check sizing, measurements, and item photos thoroughly.
            </p>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-y2k-gunmetal mb-2">
              What payment methods do you accept?
            </h4>
            <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
              We accept all secure digital payments including Google Pay, Paytm, PhonePe, UPI, Credit/Debit Cards, and Net Banking powered by Razorpay India. We do not support Cash on Delivery (COD).
            </p>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-y2k-gunmetal mb-2">
              What if an item arrives damaged in transit?
            </h4>
            <p className="text-xs text-y2k-gunmetal/75 leading-relaxed">
              In the unlikely event of physical transit damage, please provide an unboxing video and photo proof to{" "}
              <a href="mailto:support@bagifyyyy.com" className="font-bold underline text-black">
                support@bagifyyyy.com
              </a>{" "}
              or DM{" "}
              <a href="https://instagram.com/bagifyyyy" target="_blank" rel="noopener noreferrer" className="font-bold underline text-black">
                @bagifyyyy
              </a>{" "}
              within 24 hours of delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
