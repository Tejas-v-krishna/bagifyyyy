"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getRecaptchaToken } from "@/lib/recaptcha";

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
      <div className="curated-grails-transition curated-grails-transition-in" aria-hidden="true" />
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-0 pt-9 sm:px-7 sm:pt-14 lg:px-[3.1vw] lg:pt-[3.4vw]">
         <div className="flex items-start justify-between gap-6">
           <h2 className="max-w-none text-[clamp(1.8rem,4.4vw,5.5rem)] font-display font-bold uppercase leading-[0.88] tracking-[-0.03em] text-white">
             <span className="block lg:whitespace-nowrap">Hear About The Next One</span>
             <span className="block pl-[clamp(2rem,16vw,14rem)] lg:whitespace-nowrap">Before It Goes Live</span>
           </h2>
           <span className="hidden shrink-0 pt-1 text-[9px] tracking-[0.04em] text-white/25 sm:block">
             No daily noise
          </span>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-6 sm:mt-16 sm:gap-8 lg:mt-[3.2vw] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.68fr)_minmax(0,1.28fr)] lg:items-start lg:gap-x-[4.9vw]">
          <div className="relative order-2 col-span-1 aspect-[0.65] overflow-hidden rounded-[4px] bg-[#e8e9eb] lg:order-1 lg:col-span-1 lg:aspect-[0.65]">
            <Image
              src="/assets/ai/prod_model_1_hoodie_1786659181183.jpg"
              alt="BAGIFYYYY black archive hoodie"
              fill
              sizes="(max-width: 1023px) 50vw, 24vw"
              className="object-cover object-[50%_24%] grayscale"
            />
          </div>

          <div className="order-1 col-span-2 flex min-h-full flex-col lg:order-2 lg:col-span-1 lg:px-0">
            <p className="max-w-[26rem] text-[clamp(0.75rem,1vw,1rem)] font-medium leading-[1.15] tracking-[-0.02em] text-white">
               No daily noise. Just a note when something new lands.
            </p>

            <form onSubmit={handleSubscribe} className="mt-8 flex flex-col sm:mt-10 lg:min-h-[clamp(15rem,27.5vw,29rem)]">
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

               <label className="block border-b border-white/50 pb-2.5">
                 <span className="block text-[9px] tracking-[0.02em] text-white/55 sm:text-[10px]">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className="mt-1 w-full bg-transparent text-xs text-white outline-none"
                />
              </label>

               <label className="mt-8 block border-b border-white/50 pb-2.5 sm:mt-10">
                 <span className="block text-[9px] tracking-[0.02em] text-white/55 sm:text-[10px]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="mt-1 w-full bg-transparent text-xs text-white outline-none"
                />
              </label>

               <label className="mt-8 block border-b border-white/50 pb-2.5 sm:mt-10">
                 <span className="block text-[9px] tracking-[0.02em] text-white/55 sm:text-[10px]">Phone (optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  className="mt-1 w-full bg-transparent text-xs text-white outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={status === "loading"}
                className="editorial-cta group mt-12 h-[1.875rem] w-full max-w-[8.5rem] !min-h-[1.875rem] !py-0 disabled:opacity-50 sm:mt-auto"
              >
                 {status === "loading" ? "Joining" : "Join the list"}
                <ArrowRight className="editorial-cta-arrow" strokeWidth={1.8} aria-hidden="true" />
              </button>

              <p
                aria-live="polite"
                className={`mt-3 min-h-4 text-[8px] uppercase tracking-[0.04em] ${
                  status === "error" ? "text-red-300" : "text-white/55"
                }`}
              >
                {message}
              </p>
            </form>
          </div>

          <div className="relative order-3 col-span-1 aspect-square overflow-hidden rounded-[4px] bg-[#e8e9eb] lg:col-span-1 lg:ml-auto lg:mt-[5.4vw] lg:aspect-square lg:w-full">
            <Image
              src="/assets/ai/prod_model_6_denimjacket_1786660137724.jpg"
              alt="BAGIFYYYY black tee editorial"
              fill
              sizes="(max-width: 1023px) 50vw, 31vw"
              className="object-cover object-[50%_18%] grayscale"
            />
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-x-6 gap-y-14 text-white/90 sm:mt-28 sm:grid-cols-4 lg:mt-[6vw] lg:grid-cols-12">
          <div className="col-span-1 flex flex-col lg:col-span-3">
            <Link href="/products" className="mt-12 inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-55 sm:mt-16 sm:text-[13px]">
               Shop all pieces
              <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>

          <nav className="col-span-1 flex flex-col lg:col-span-3" aria-label="Footer shop navigation">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-white sm:text-[12px]">Shop</p>
            {shopLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className={footerLinkClass}>{link.label}</Link>
            ))}
          </nav>

          <nav className="col-span-1 flex flex-col lg:col-span-4" aria-label="Footer details navigation">
             <p className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-white sm:text-[12px]">Info</p>
            {detailLinks.map((link) => (
              <Link key={link.href} href={link.href} className={footerLinkClass}>{link.label}</Link>
            ))}
          </nav>

          <nav className="col-span-1 flex flex-col lg:col-span-2" aria-label="Social links">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-white sm:text-[12px]">Follow</p>
            <a href="https://instagram.com/bagifyyyy" target="_blank" rel="noreferrer" className={footerLinkClass}>Instagram</a>
             <a href="https://x.com/bagifyyyy" target="_blank" rel="noreferrer" className={footerLinkClass}>X</a>
          </nav>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-8 text-[11px] tracking-tight text-white/80 sm:mt-32 sm:grid-cols-4 sm:text-[12px] lg:mt-[6vw] lg:grid-cols-12">
          <p className="col-span-2 sm:col-span-2 lg:col-span-6">© 2026 BAGIFYYYY. All rights reserved.</p>
          <Link href="/privacy-policy" className="w-fit transition-opacity hover:opacity-50 lg:col-span-4">Privacy</Link>
          <Link href="/terms" className="w-fit transition-opacity hover:opacity-50 lg:col-span-2">Terms</Link>
        </div>

        <video
          autoPlay
          loop
          muted
          playsInline
          aria-label="BAGIFYYYY"
          className="-mb-[0.055em] mt-12 block h-auto w-full object-contain sm:mt-16 lg:mt-[4vw]"
        >
          <source src="/footer-logo.mp4" type="video/mp4" />
        </video>
      </div>
    </footer>
  );
}
