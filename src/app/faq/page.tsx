"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Minus, HelpCircle } from "lucide-react";

const FAQ_DATA = [
  {
    category: "Orders & Shipping",
    items: [
      {
        q: "How do I track my shipment?",
        a: "You can track your order live using our Track Shipment page (/track) by entering your order number (e.g. 1001) or Airway Bill ID. Real-time updates are also dispatched via SMS and Email.",
      },
      {
        q: "What are your delivery timelines?",
        a: "Orders are dispatched within 24–48 hours. Standard delivery across India takes 3–5 business days, while Express Air takes 1–3 business days.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes. International courier transit takes 7–14 business days. Duties and local import charges are calculated based on your jurisdiction.",
      },
    ],
  },
  {
    category: "Archive & Sizing",
    items: [
      {
        q: "Are the pieces authentic vintage?",
        a: "Yes. Every item in the BAGIFYYYY vault is authenticated, condition-graded, steam-sterilized, and inspected for heavyweight fabric integrity.",
      },
      {
        q: "How does sizing work?",
        a: "Our silhouettes feature signature boxy, slightly drop-shouldered fits. Use the Size Guide linked on each product page to review exact chest, shoulder, and length measurements.",
      },
    ],
  },
  {
    category: "Store Policy & Payments",
    items: [
      {
        q: "What is your return policy?",
        a: "Because our garments are 1-of-1 vintage and deadstock archive pieces, all sales are strictly final. Please check sizing and garment photos carefully.",
      },
      {
        q: "What payment methods are supported?",
        a: "We accept UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking via Razorpay. We also support Cash on Delivery (COD) for eligible pin codes.",
      },
    ],
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({ "0-0": true });

  const toggle = (key: string) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = FAQ_DATA.map((cat, catIdx) => ({
    ...cat,
    items: cat.items
      .map((item, itemIdx) => ({ ...item, key: `${catIdx}-${itemIdx}` }))
      .filter(
        (it) =>
          it.q.toLowerCase().includes(search.toLowerCase()) ||
          it.a.toLowerCase().includes(search.toLowerCase())
      ),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">FAQ</span>
        </div>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            KNOWLEDGE BASE
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            Answers regarding drops, fulfillment, sizing matrix, and archive sourcing.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search questions (e.g. tracking, sizing, returns)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-y2k-gunmetal/10 px-3.5 py-2.5 pl-9 text-xs outline-none focus:border-y2k-gunmetal shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-y2k-gunmetal/50 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* FAQ Accordion Groups */}
        <div className="space-y-6">
          {filteredCategories.map((group) => (
            <div key={group.category} className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-y2k-slate block">
                {group.category}
              </span>

              <div className="divide-y divide-y2k-gunmetal/10 border border-y2k-gunmetal/15 bg-white shadow-xs">
                {group.items.map((item) => {
                  const isOpen = !!openMap[item.key];
                  return (
                    <div key={item.key}>
                      <button
                        type="button"
                        onClick={() => toggle(item.key)}
                        className="w-full text-left p-3.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:bg-y2k-ice/30 transition-colors cursor-pointer"
                      >
                        <span>{item.q}</span>
                        {isOpen ? (
                          <Minus className="w-3.5 h-3.5 shrink-0 text-y2k-gunmetal" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 shrink-0 text-y2k-gunmetal/60" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-3.5 pb-3.5 text-xs text-y2k-gunmetal/75 leading-relaxed bg-y2k-ice/15">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="bg-white border border-y2k-gunmetal/15 p-8 text-center text-xs text-y2k-gunmetal/60">
              No answers matching "{search}". Contact our concierge team directly.
            </div>
          )}
        </div>

        {/* Support Help Card */}
        <div className="mt-8 p-4 bg-white border border-y2k-gunmetal/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-y2k-gunmetal/80">Still have questions regarding an archive piece?</span>
          <Link
            href="/contact"
            className="btn-bagify px-4 py-2 text-[10px] font-bold uppercase tracking-wider shrink-0"
          >
            Contact Support →
          </Link>
        </div>

      </div>
    </div>
  );
}
