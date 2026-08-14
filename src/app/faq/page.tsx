"use client";

import React, { useState } from "react";

const faqData = [
  {
    category: "Orders",
    items: [
      { q: "How do I track my order?", a: "Once your order ships, you'll receive a confirmation email with a tracking link. You can also view tracking information in your account dashboard." },
      { q: "Can I cancel or change my order?", a: "We process orders quickly, but if you contact us within 1 hour of placing your order, we will do our best to accommodate changes or cancellations." },
      { q: "I received the wrong item.", a: "We apologize for the mix-up! Please reach out to our support team with your order number and a photo of the item, and we'll send a replacement immediately." }
    ]
  },
  {
    category: "Shipping",
    items: [
      { q: "How long does shipping take?", a: "Standard shipping within India takes 5-7 business days. Express shipping takes 2-3 business days. International shipping takes 10-21 days." },
      { q: "Do you ship internationally?", a: "Yes, we ship globally! International shipping rates and times apply at checkout based on your location." },
      { q: "What if my package is lost?", a: "If your tracking shows delivered but you haven't received it, please check with neighbors. If it's still missing after 3 days, contact us and we'll open an investigation with the carrier." }
    ]
  },
  {
    category: "Sizing",
    items: [
      { q: "How do I know my size?", a: "Every product page features a detailed size chart and fit notes. We recommend measuring a similar bag you own to compare dimensions." },
      { q: "Do items run true to size?", a: "Yes, our bags are designed precisely to the dimensions listed. For apparel drops, items generally have an oversized, relaxed fit." },
      { q: "Where can I find the size guide?", a: "The size guide is linked just below the size selector on every product page." }
    ]
  },
  {
    category: "Returns",
    items: [
      { q: "How do I initiate a return?", a: "Visit our Returns Portal and enter your order number and email. You'll receive a prepaid shipping label to print." },
      { q: "How long do refunds take?", a: "Refunds are processed within 3-5 days of receiving your return at our warehouse, and may take an additional 3-5 days to appear on your bank statement." },
      { q: "Can I exchange for a different size?", a: "Absolutely. Select 'Exchange' in our Returns Portal to secure your new size before sending back the original item." }
    ]
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods do you accept?", a: "We accept all major credit cards, UPI, Net Banking, and select digital wallets including Apple Pay and Google Pay." },
      { q: "Is my payment information secure?", a: "Yes. Our checkout process is fully encrypted and securely handled by Razorpay and Stripe. We do not store your card details." },
      { q: "Do you offer EMI?", a: "Yes, EMI options are available on orders above ₹3000 through select credit cards and partners at checkout." }
    ]
  }
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (catIdx: number, itemIdx: number) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter logic
  const filteredData = faqData.map(category => {
    const filteredItems = category.items.filter(item => 
      item.q.toLowerCase().includes(search.toLowerCase()) || 
      item.a.toLowerCase().includes(search.toLowerCase())
    );
    return { ...category, items: filteredItems };
  }).filter(category => category.items.length > 0);

  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen">
      {/* Header */}
      <header className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-12 py-24 text-center">
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter font-black mb-8">
          FAQ
        </h1>
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            placeholder="SEARCH QUESTIONS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/80 border-2 border-y2k-gunmetal p-4 pl-12 font-bold uppercase tracking-widest focus:outline-none placeholder:text-y2k-gunmetal/50"
          />
          <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-y2k-gunmetal/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      {/* Accordion FAQ */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 space-y-16">
        {filteredData.length > 0 ? (
          filteredData.map((category, catIdx) => (
            <div key={catIdx}>
              <h2 className="font-display text-3xl uppercase tracking-tighter font-black mb-6 border-b-4 border-y2k-gunmetal pb-2">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openItems[key];
                  return (
                    <div key={itemIdx} className="border border-y2k-gunmetal/30 bg-white/50">
                      <button
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className="w-full text-left p-4 font-bold text-lg flex justify-between items-center outline-none hover:bg-black/5 transition-colors"
                      >
                        <span className="pr-4">{item.q}</span>
                        <span className="text-2xl font-normal leading-none w-6 text-center">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="p-4 pt-0 text-lg border-t border-y2k-gunmetal/10 mt-2">
                          <p className="pt-2">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-xl font-bold uppercase tracking-widest opacity-50 py-12">
            No results found for "{search}"
          </div>
        )}
      </section>
    </div>
  );
}
