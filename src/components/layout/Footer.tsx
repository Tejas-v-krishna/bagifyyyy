"use client";

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Subscribed! Use code BAGIFY10 for 10% off.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Subscription failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <footer className="w-full bg-y2k-ice text-y2k-gunmetal border-t border-y2k-gunmetal/10 font-sans">
      {/* ── Middle Row (Links & Newsletter) ─────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col lg:flex-row p-8 lg:p-12 gap-12 lg:gap-8 max-w-[1800px] mx-auto">
        {/* Left Side: Link Columns */}
        <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Help */}
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal mb-4">
              HELP
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/track"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                TRACK SHIPMENT
              </Link>
              <Link
                href="/shipping"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                SHIPPING &amp; DELIVERIES
              </Link>
              <Link
                href="/customer-service"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                CUSTOMER SERVICE
              </Link>
              <Link
                href="/faq"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                FAQ
              </Link>
              <Link
                href="/traceability"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                TRACEABILITY
              </Link>
            </nav>
          </div>

          {/* Column 2: Collections & Drops */}
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal mb-4">
              COLLECTIONS
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/new-arrivals"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                NEW ARRIVALS
              </Link>
              <Link
                href="/curated-grails"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                CURATED GRAILS
              </Link>
              <Link
                href="/products"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                ALL DROPS
              </Link>
              <Link
                href="/topwears"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                SHIRTS &amp; TEES
              </Link>
              <Link
                href="/bottomwears"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                PANTS &amp; CARGOS
              </Link>
              <Link
                href="/about"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                ABOUT
              </Link>
            </nav>
          </div>

          {/* Column 3: Legal & Account */}
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal mb-4">
              LEGAL &amp; ACCOUNT
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/terms"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                TERMS &amp; CONDITIONS
              </Link>
              <Link
                href="/privacy-policy"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                PRIVACY POLICY
              </Link>
              <Link
                href="/account"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                MY ACCOUNT
              </Link>
              <Link
                href="/wishlist"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                WISHLIST
              </Link>
            </nav>
          </div>

          {/* Column 4: Follow */}
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal mb-4">
              FOLLOW US
            </h4>
            <nav className="flex flex-col gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium text-y2k-gunmetal/65 hover:text-black transition-colors uppercase tracking-[0.12em]"
              >
                INSTAGRAM
              </a>
            </nav>
          </div>
        </div>

        {/* Right Side: Newsletter */}
        <div className="w-full lg:w-1/3 flex flex-col lg:pl-12">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal mb-2">
            NEWSLETTER + 10% OFF
          </h4>
          <p className="text-xs font-normal text-y2k-gunmetal/70 leading-relaxed mb-4 max-w-sm">
            Subscribe for 10% off your first drop. No spam, only rare archive releases.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2.5">
            <input
              type="email"
              placeholder="ENTER YOUR EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-y2k-gunmetal/20 text-black placeholder:text-y2k-gunmetal/40 px-4 py-3 text-xs outline-none focus:border-y2k-gunmetal font-medium transition-colors rounded-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-bagify text-white text-[11px] font-bold uppercase tracking-[0.16em] px-8 py-3.5 w-full hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {status === "loading" ? "SUBMITTING..." : "GET 10% OFF"}
            </button>
            {message && (
              <p
                className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                  status === "success" ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── Bottom Row (Copyright) ─────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-between items-center p-6 lg:p-8 pt-8 border-t border-y2k-gunmetal/10 max-w-[1800px] mx-auto">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-y2k-gunmetal/60">
          © 2026 BAGIFYYYY ARCHIVE. ALL RIGHTS RESERVED.
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-y2k-gunmetal/60">
          EST. 2024
        </span>
      </div>
    </footer>
  );
}
