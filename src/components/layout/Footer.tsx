"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { openBugReport } from "@/components/ui/BugReportModal";

const shopLinks = [
  { href: "/topwears", label: "Topwears" },
  { href: "/bottomwears", label: "Bottomwears" },
  { href: "/accessories", label: "Accessories" },
  { href: "/bundles", label: "Bundles" },
];

const detailLinks = [
  { href: "/about", label: "About" },
  { href: "/traceability", label: "Craft" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping", label: "Delivery" },
];

const footerLinkClass =
  "w-fit text-[12px] uppercase leading-[1.65] tracking-[-0.02em] text-white/55 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white focus-visible:outline-offset-2 sm:text-[13px]";

export default function Footer() {
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // The wordmark video is the heaviest asset on the page; keep it off the
  // critical path and only start loading once the footer nears the viewport.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.play().catch(() => {});
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // Force the fetch, then play: play() alone does not always kick off
          // loading when preload="none" is set.
          try {
            el.load();
          } catch {
            // Ignore: some browsers throw on load() while already loading.
          }
          el.play().catch(() => {});
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const recaptchaToken = await getRecaptchaToken("subscribe");
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, honeypot, recaptchaToken }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("You are in. Use code BAGIFY10 for 10% off.");
        setName("");
        setEmail("");
        setPhone("");
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
    <footer className="archive-footer relative w-full overflow-hidden bg-[#070707] font-sans text-white" data-nav-theme="dark">
      <div className="curated-grails-transition curated-grails-transition-in !h-[clamp(5rem,10vw,9rem)]" aria-hidden="true" />
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-0 pt-9 sm:px-7 sm:pt-14 lg:px-[3.1vw] lg:pt-[3.4vw]">
         <div className="flex items-start justify-between gap-6">
           <h2 className="max-w-none text-[clamp(1.8rem,4.4vw,5.5rem)] font-display font-bold uppercase leading-[0.88] tracking-[-0.03em] text-white">
             <span className="block lg:whitespace-nowrap">First To Know</span>
             <span className="block pl-[clamp(2rem,16vw,14rem)] lg:whitespace-nowrap">Wins</span>
           </h2>
        </div>

        <div className="mt-8 w-full max-w-[540px] sm:mt-10 lg:mt-[2.5vw]">
          <div className="flex min-h-full flex-col">
            <p className="text-[12px] font-mono uppercase tracking-[0.12em] text-white/50">
              Early access & secret drops only.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="flex items-center rounded-full border border-white/20 bg-white/[0.04] p-1.5 pl-5 backdrop-blur-sm transition-colors focus-within:border-white/60 focus-within:bg-white/[0.08]">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-xs font-mono tracking-wider text-white placeholder:text-white/30 outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-bagify btn-bagify-light shrink-0 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] cursor-pointer disabled:opacity-50"
                  aria-label="Join early access"
                >
                  {status === "loading" ? "Joining…" : "Join"}
                </button>
              </div>

              {message && (
                <p
                  aria-live="polite"
                  className={`min-h-4 text-[10px] font-mono uppercase tracking-[0.1em] pt-1 ${
                    status === "error" ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 text-white/90 sm:mt-24 sm:grid-cols-4 lg:mt-[5vw] lg:grid-cols-12 lg:gap-x-8">
          <nav className="col-span-1 flex flex-col lg:col-span-3" aria-label="Footer shop navigation">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-[12px]">Shop</p>
            <div className="flex flex-col gap-1.5">
              {shopLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className={footerLinkClass}>{link.label}</Link>
              ))}
              <Link href="/products" className="mt-2 inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-75 sm:text-[13px]">
                <span>All pieces</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </nav>

          <nav className="col-span-1 flex flex-col lg:col-span-3" aria-label="Footer details navigation">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-[12px]">Info</p>
            <div className="flex flex-col gap-1.5">
              {detailLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClass}>{link.label}</Link>
              ))}
            </div>
          </nav>

          <nav className="col-span-1 flex flex-col lg:col-span-3" aria-label="Social links">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-[12px]">Follow</p>
            <div className="flex flex-col gap-1.5">
              <a href="https://instagram.com/bagifyyyy" target="_blank" rel="noreferrer" className={footerLinkClass}>Instagram</a>
              <a href="https://x.com/bagifyyyy" target="_blank" rel="noreferrer" className={footerLinkClass}>X</a>
            </div>
          </nav>

          <div className="col-span-1 flex flex-col lg:col-span-3">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-[12px]">Legal</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/privacy-policy" className={footerLinkClass}>Privacy Policy</Link>
              <Link href="/terms" className={footerLinkClass}>Terms of Service</Link>
              <button type="button" onClick={openBugReport} className={`${footerLinkClass} cursor-pointer text-left`}>Report a bug</button>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-[11px] tracking-tight text-white/50 sm:mt-20 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BAGIFYYYY. All rights reserved.</p>
          <p className="text-[10px] uppercase tracking-wider text-white/35">Y2K Archive · India</p>
        </div>

        <video
          ref={videoRef}
          preload="metadata"
          loop
          muted
          playsInline
          aria-label="BAGIFYYYY"
          className="-mb-[0.055em] mt-12 block h-auto w-full object-contain sm:mt-16 lg:mt-[4vw]"
        >
          <source src="/footer-logo-v2.mp4" type="video/mp4" />
        </video>
      </div>
    </footer>
  );
}
