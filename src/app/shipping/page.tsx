import React from "react";

export default function ShippingPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24">
      {/* Header */}
      <header className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-24 text-center">
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter font-black">
          SHIPPING & RETURNS
        </h1>
        <p className="mt-6 text-xl font-bold tracking-widest uppercase">
          HONEST. CLEAR. SIMPLE.
        </p>
      </header>

      {/* Shipping Table */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 mb-24">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-y2k-gunmetal/30">
            <thead>
              <tr className="bg-y2k-gunmetal text-[#F8F5E9] font-bold uppercase tracking-widest">
                <th className="p-4 border border-y2k-gunmetal/30">Region</th>
                <th className="p-4 border border-y2k-gunmetal/30">Delivery Time</th>
                <th className="p-4 border border-y2k-gunmetal/30">Cost</th>
              </tr>
            </thead>
            <tbody className="text-lg">
              <tr className="border-b border-y2k-gunmetal/30 hover:bg-black/5">
                <td className="p-4 border-r border-y2k-gunmetal/30 font-bold">India Standard</td>
                <td className="p-4 border-r border-y2k-gunmetal/30">5-7 days</td>
                <td className="p-4">Free over ₹2000 / ₹99</td>
              </tr>
              <tr className="bg-black/5 border-b border-y2k-gunmetal/30 hover:bg-black/10">
                <td className="p-4 border-r border-y2k-gunmetal/30 font-bold">India Express</td>
                <td className="p-4 border-r border-y2k-gunmetal/30">2-3 days</td>
                <td className="p-4">₹199</td>
              </tr>
              <tr className="border-b border-y2k-gunmetal/30 hover:bg-black/5">
                <td className="p-4 border-r border-y2k-gunmetal/30 font-bold">International</td>
                <td className="p-4 border-r border-y2k-gunmetal/30">10-21 days</td>
                <td className="p-4">₹799</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Free Returns Banner */}
      <div className="w-full bg-y2k-gunmetal text-[#F8F5E9] py-8 px-4 text-center">
        <h2 className="font-display text-2xl md:text-4xl uppercase tracking-tighter font-black">
          FREE RETURNS WITHIN 30 DAYS — NO QUESTIONS ASKED
        </h2>
      </div>

      {/* Return Process */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { num: "1", title: "INITIATE RETURN", desc: "Log into your account or use the guest portal to start." },
            { num: "2", title: "PACK YOUR ITEM", desc: "Securely pack the item in its original packaging with all tags." },
            { num: "3", title: "SHIP IT BACK", desc: "Drop off the package at any authorized shipping location." },
            { num: "4", title: "REFUND ISSUED", desc: "Get refunded within 3-5 days after we receive your package." },
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col text-center md:text-left">
              <span className="font-display text-6xl md:text-8xl font-black text-y2k-gunmetal/20 mb-2">
                {step.num}
              </span>
              <h3 className="font-display text-2xl uppercase tracking-tighter font-black mb-2">
                {step.title}
              </h3>
              <p className="text-lg">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Notes */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-12">
        <h2 className="font-display text-4xl uppercase tracking-tighter font-black mb-8 text-center">
          RETURN POLICIES
        </h2>
        <div className="space-y-4">
          <details className="group border border-y2k-gunmetal/30 bg-white/50 p-4 open:bg-white transition-colors cursor-pointer">
            <summary className="font-bold text-lg uppercase tracking-wider flex justify-between items-center outline-none">
              What items are non-returnable?
              <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-4 text-lg">
              Items marked as Final Sale, personalized items, and intimates cannot be returned. All other items must be unworn and in original condition.
            </p>
          </details>
          <details className="group border border-y2k-gunmetal/30 bg-white/50 p-4 open:bg-white transition-colors cursor-pointer">
            <summary className="font-bold text-lg uppercase tracking-wider flex justify-between items-center outline-none">
              How long do refunds take?
              <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-4 text-lg">
              Once we receive your return, please allow 3-5 business days for our team to process it. The refund will reflect on your original payment method within another 3-5 business days depending on your bank.
            </p>
          </details>
          <details className="group border border-y2k-gunmetal/30 bg-white/50 p-4 open:bg-white transition-colors cursor-pointer">
            <summary className="font-bold text-lg uppercase tracking-wider flex justify-between items-center outline-none">
              Can I exchange instead?
              <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-4 text-lg">
              Yes! You can choose to exchange for a different size or color during the return process. If the new item is out of stock, you will be issued a full refund instead.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
