"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Minus } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

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
        q: "Are the vintage pieces authentic?",
        a: "Yes. Vintage pieces are checked for age, labels, construction, hardware, and condition before they are listed.",
      },
      {
        q: "How does sizing work?",
        a: "Most tops have a relaxed, slightly dropped shoulder. Use the Size Guide on the product page and compare the measurements with a piece you already own.",
      },
    ],
  },
  {
    category: "Store Policy & Payments",
    items: [
      {
        q: "What is your return policy?",
        a: "All sales are final because many pieces are one-off vintage or small-run items. Check the measurements and photos before ordering.",
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
    <EditorialPageShell
      eyebrow="Help / FAQ"
      title="Questions, answered"
      description="Shipping, sizing, payments, and returns in one place."
    >
      <div className="w-full">
        {/* Search */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search questions (e.g. tracking, sizing, returns)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3.5 pl-11 text-xs text-black outline-none focus:border-black shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-colors"
          />
          <Search className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* FAQ Accordion Groups */}
        <div className="space-y-8">
          {filteredCategories.map((group) => (
            <div key={group.category} className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 block">
                {group.category}
              </span>

              <div className="divide-y divide-black/5 rounded-2xl border border-black/10 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.02)] overflow-hidden">
                {group.items.map((item) => {
                  const isOpen = !!openMap[item.key];
                  return (
                    <div key={item.key}>
                      <button
                        type="button"
                        onClick={() => toggle(item.key)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-black hover:bg-black/[0.02] transition-colors cursor-pointer"
                      >
                        <span className="pr-4">{item.q}</span>
                        <div className="w-6 h-6 rounded-full bg-[#f2f2f2] flex items-center justify-center shrink-0">
                          {isOpen ? (
                            <Minus className="w-3.5 h-3.5 text-black" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-black/60" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-black/70 leading-relaxed bg-[#fbfbfb] border-t border-black/5">
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
            <div className="bg-white rounded-2xl border border-black/10 p-12 text-center text-xs text-black/55">
              No answers for &quot;{search}&quot;. Send us a message if you still need help.
            </div>
          )}
        </div>

        {/* Support Help Card */}
        <div className="mt-10 p-5 sm:p-6 bg-white rounded-2xl border border-black/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black">
              Still unsure about a piece?
            </p>
            <p className="text-xs text-black/55 mt-0.5">
              We are available Monday through Saturday.
            </p>
          </div>
          <Link
            href="/contact"
            className="btn-bagify btn-bagify-dark px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] shrink-0"
          >
            Contact us
          </Link>
        </div>
      </div>
    </EditorialPageShell>
  );
}
