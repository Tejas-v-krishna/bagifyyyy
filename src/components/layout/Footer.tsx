"use client";

import { useState } from "react";
import Link from "next/link";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, honeypot }),
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
    <footer className="w-full bg-y2k-ice text-y2k-gunmetal border-t border-y2k-gunmetal/[0.07] font-sans">
      {/* ── Middle Row (Links & Newsletter) ─────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col lg:flex-row px-8 lg:px-16 py-16 lg:py-24 gap-16 lg:gap-12 max-w-[1800px] mx-auto">
        {/* Left Side: Link Columns */}
        <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Column 1: Help */}
          <div className="flex flex-col">
            <h4 className="section-label text-y2k-gunmetal mb-5">
              HELP
            </h4>
            <nav className="flex flex-col gap-4">
              <Link
                href="/track"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                TRACK SHIPMENT
              </Link>
              <Link
                href="/shipping"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                SHIPPING &amp; DELIVERIES
              </Link>
              <Link
                href="/customer-service"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                CUSTOMER SERVICE
              </Link>
              <Link
                href="/faq"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                FAQ
              </Link>
              <Link
                href="/traceability"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                TRACEABILITY
              </Link>
            </nav>
          </div>

          {/* Column 2: Collections & Drops */}
          <div className="flex flex-col">
            <h4 className="section-label text-y2k-gunmetal mb-5">
              COLLECTIONS
            </h4>
            <nav className="flex flex-col gap-4">
              <Link
                href="/new-arrivals"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                NEW ARRIVALS
              </Link>
              <Link
                href="/curated-grails"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                CURATED GRAILS
              </Link>
              <Link
                href="/products"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                ALL DROPS
              </Link>
              <Link
                href="/topwears"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                SHIRTS &amp; TEES
              </Link>
              <Link
                href="/bottomwears"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                PANTS &amp; CARGOS
              </Link>
              <Link
                href="/about"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                ABOUT
              </Link>
            </nav>
          </div>

          {/* Column 3: Legal & Account */}
          <div className="flex flex-col">
            <h4 className="section-label text-y2k-gunmetal mb-5">
              LEGAL &amp; ACCOUNT
            </h4>
            <nav className="flex flex-col gap-4">
              <Link
                href="/terms"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                TERMS &amp; CONDITIONS
              </Link>
              <Link
                href="/privacy-policy"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                PRIVACY POLICY
              </Link>
              <Link
                href="/account"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                MY ACCOUNT
              </Link>
              <Link
                href="/wishlist"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                WISHLIST
              </Link>
            </nav>
          </div>

          {/* Column 4: Follow */}
          <div className="flex flex-col">
            <h4 className="section-label text-y2k-gunmetal mb-5">
              FOLLOW US
            </h4>
            <nav className="flex flex-col gap-4">
              <a
                href="https://instagram.com/bagifyyyy"
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] text-y2k-gunmetal/55 hover:text-y2k-gunmetal transition-colors uppercase tracking-[0.14em]"
              >
                INSTAGRAM
              </a>
            </nav>
          </div>
        </div>

        {/* Right Side: Newsletter */}
        <div className="w-full lg:w-1/3 flex flex-col lg:pl-16 lg:border-l lg:border-y2k-gunmetal/[0.07]">
          <h4 className="section-label text-y2k-gunmetal mb-3">
            NEWSLETTER + 10% OFF
          </h4>
          <p className="text-xs text-y2k-gunmetal/60 leading-loose mb-8 max-w-sm">
            Subscribe for 10% off your first drop. No spam, only rare archive releases.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-5">
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <input
              type="email"
              placeholder="YOUR EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-line text-sm text-y2k-gunmetal w-full"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-bagify text-white text-[10.5px] uppercase tracking-[0.18em] px-8 py-4 w-full disabled:opacity-50"
            >
              {status === "loading" ? "SUBMITTING…" : "GET 10% OFF"}
            </button>
            {message && (
              <p
                className={`text-[10px] uppercase tracking-wider mt-1 ${
                  status === "success" ? "text-y2k-gunmetal" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── Bottom Row (Copyright) ─────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-between items-center px-8 lg:px-16 py-7 border-t border-y2k-gunmetal/[0.07] max-w-[1800px] mx-auto">
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/45">
          © 2026 BAGIFYYYY ARCHIVE. ALL RIGHTS RESERVED.
        </span>
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/45">
          EST. 2024
        </span>
      </div>
    </footer>
  );
}
