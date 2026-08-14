"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Truck, Clock, CornerUpLeft } from "lucide-react";

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
    <footer className="w-full bg-y2k-ice text-black border-t border-black/20 font-sans">
      {/* ── Top Row (Features) ────────────────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 border-b border-black/20">
        {/* Feature 1 */}
        <div className="flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-black/20 hover:bg-black/5 transition-colors">
          <Package strokeWidth={1.5} className="w-7 h-7 mb-3 opacity-90" />
          <span className="text-xs font-semibold uppercase tracking-wider text-black/90">
            EASY EXCHANGES
          </span>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-black/20 hover:bg-black/5 transition-colors">
          <Truck strokeWidth={1.5} className="w-7 h-7 mb-3 opacity-90" />
          <span className="text-xs font-semibold uppercase tracking-wider text-black/90">
            FAST SHIPPING
          </span>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-black/20 hover:bg-black/5 transition-colors">
          <Clock strokeWidth={1.5} className="w-7 h-7 mb-3 opacity-90" />
          <span className="text-xs font-semibold uppercase tracking-wider text-black/90">
            24/7 CUSTOMER CARE
          </span>
        </div>

        {/* Feature 4 */}
        <div className="flex flex-col items-center justify-center p-8 hover:bg-black/5 transition-colors">
          <CornerUpLeft strokeWidth={1.5} className="w-7 h-7 mb-3 opacity-90" />
          <span className="text-xs font-semibold uppercase tracking-wider text-black/90">
            EASY RETURNS
          </span>
        </div>
      </div>

      {/* ── Middle Row (Links & Newsletter) ─────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col lg:flex-row p-8 lg:p-12 gap-12 lg:gap-8">
        {/* Left Side: Link Columns */}
        <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1 */}
          <div className="flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-5">
              COMPANY
            </h4>
            <nav className="flex flex-col gap-3.5">
              <Link
                href="/products"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                ALL DROPS
              </Link>
              <Link
                href="/topwears"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                TOPWEARS
              </Link>
              <Link
                href="/bottomwears"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                BOTTOMWEARS
              </Link>
              <Link
                href="/about"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                ABOUT
              </Link>
            </nav>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-5">
              SUPPORT
            </h4>
            <nav className="flex flex-col gap-3.5">
              <Link
                href="/contact"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                CONTACT
              </Link>
              <Link
                href="/faq"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                FAQ
              </Link>
              <Link
                href="/shipping"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                SHIPPING & RETURNS
              </Link>
              <Link
                href="/size-guide"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                SIZE GUIDE
              </Link>
            </nav>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-5">
              ACCOUNT
            </h4>
            <nav className="flex flex-col gap-3.5">
              <Link
                href="/account"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                MY ACCOUNT
              </Link>
              <Link
                href="/wishlist"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                WISHLIST
              </Link>
              <Link
                href="/accessories"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                ACCESSORIES
              </Link>
              <Link
                href="/studio"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                STUDIO / ADMIN
              </Link>
            </nav>
          </div>

          {/* Column 4 */}
          <div className="flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-5">
              FOLLOW US
            </h4>
            <nav className="flex flex-col gap-3.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                INSTAGRAM
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-black/70 hover:text-black transition-colors uppercase tracking-wider"
              >
                TIKTOK
              </a>
            </nav>
          </div>
        </div>

        {/* Right Side: Newsletter */}
        <div className="w-full lg:w-1/3 flex flex-col lg:pl-12">
          <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
            NEWSLETTER + 10% OFF
          </h4>
          <p className="text-xs font-medium text-black/70 leading-relaxed mb-4 max-w-sm">
            Get 10% off on your first order. We&apos;ll only send you updates on new
            releases and exclusive archive drops.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="ENTER YOUR EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-black/20 text-black placeholder:text-black/40 px-4 py-3 text-xs outline-none focus:border-black font-medium transition-colors rounded-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-black text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 w-full hover:bg-black/85 transition-colors disabled:opacity-50"
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
      <div className="w-full flex justify-between items-center p-8 pt-12 border-t border-black/10">
        <span className="text-xs font-medium uppercase tracking-wider text-black/60">
          © 2026 BAGIFYYYY ARCHIVE. ALL RIGHTS RESERVED.
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-black/60">
          EST. 2024
        </span>
      </div>
    </footer>
  );
}
