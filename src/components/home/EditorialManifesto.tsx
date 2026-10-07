import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type GarmentPin = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  specs: { label: string; value: string }[];
  href: string;
  shopLabel: string;
};

const GARMENTS_DATA: GarmentPin[] = [
  {
    id: "shirting",
    num: "01",
    title: "Boxy Button-Down",
    subtitle: "Dropped shoulders · raw poplin · 240 GSM",
    specs: [
      { label: "WEIGHT", value: "240 GSM" },
      { label: "WEAVE", value: "RAW POPLIN" },
      { label: "FIT", value: "RELAXED" },
    ],
    href: "/topwears",
    shopLabel: "Shop shirting",
  },
  {
    id: "chrome",
    num: "02",
    title: "Chrome Chain",
    subtitle: "Solid milled steel · mirror finish",
    specs: [
      { label: "ALLOY", value: "MILLED STEEL" },
      { label: "FINISH", value: "MIRROR CHROME" },
      { label: "GAUGE", value: "HEAVY 8MM" },
    ],
    href: "/accessories",
    shopLabel: "Shop hardware",
  },
  {
    id: "wash",
    num: "03",
    title: "Faded Wash",
    subtitle: "Finished one pair at a time",
    specs: [
      { label: "PROCESS", value: "MULTI-ENZYME" },
      { label: "SHADE", value: "FADED INDIGO" },
      { label: "TINT", value: "MUD PATINA" },
    ],
    href: "/bottomwears",
    shopLabel: "Shop denim",
  },
  {
    id: "oversized",
    num: "04",
    title: "Wide-Leg Denim",
    subtitle: "460 GSM heavyweight denim",
    specs: [
      { label: "WEIGHT", value: "460 GSM" },
      { label: "COTTON", value: "100% RING-SPUN" },
      { label: "LEG", value: "STACKED PUDDLE" },
    ],
    href: "/bottomwears",
    shopLabel: "Shop denim",
  },
];

export type ManifestoProps = {
  imageSrc?: string;
  imageAlt?: string;
  headingLine1?: string;
  headingLine2?: string;
  intro?: string;
  statementA?: string;
  statementB?: string;
  closingA?: string;
  closingB?: string;
};

export default function EditorialManifesto({
  imageSrc = "/editorial-manifesto.webp",
  imageAlt = "BAGIFYYYY editorial manifesto FW26",
  headingLine1 = "Clothes For",
  headingLine2 = "The Offbeat",
  intro = "BAGIFYYYY pulls from early-2000s streetwear, club nights, and the clothes that looked better after a hundred wears.",
  statementA = "Wear It, Don't Chase It",
  statementB = "Weight Over Hype",
  closingA = "Wear History",
  closingB = "Make It Yours",
}: ManifestoProps) {
  return (
    <div className="relative w-full bg-black" data-nav-theme="dark">
      <section
        className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-16 sm:py-24 grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16"
        aria-labelledby="manifesto-heading"
      >
        {/* ── Left: model image ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0c0c0c] aspect-[3/4] md:sticky md:top-24 md:self-start">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-top select-none"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <p className="absolute bottom-4 left-4 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
            FW26 // Small run
          </p>
        </div>

        {/* ── Right: headline, statements, garment index ── */}
        <div className="flex flex-col text-white">
          <h2
            id="manifesto-heading"
            className="uppercase font-bold leading-[0.95] tracking-[-0.03em] text-[clamp(2rem,4.5vw,4rem)]"
          >
            {headingLine1}
            <br />
            {headingLine2}
          </h2>
          <p className="mt-4 max-w-[46ch] text-[13px] sm:text-sm leading-relaxed text-white/60">
            {intro}
          </p>

          <div className="mt-8 border-t border-white/10">
            <p className="py-4 border-b border-white/10 uppercase font-bold tracking-[-0.02em] leading-tight text-[clamp(1.05rem,2.2vw,1.6rem)]">
              {statementA}
            </p>
            <p className="py-4 border-b border-white/10 uppercase font-bold tracking-[-0.02em] leading-tight text-[clamp(1.05rem,2.2vw,1.6rem)] text-white/85">
              {statementB}
            </p>
          </div>

          {/* Garment index */}
          <ol className="mt-8" aria-label="Garments in this look">
            {GARMENTS_DATA.map((item) => (
              <li key={item.id} className="border-t border-white/10 last:border-b">
                <Link
                  href={item.href}
                  className="group flex items-center gap-4 py-4 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-2px]"
                >
                  <span className="font-mono text-[10px] tracking-[0.14em] text-white/40 w-6 shrink-0">
                    {item.num}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block uppercase font-bold text-[13px] sm:text-sm tracking-wide group-hover:underline underline-offset-4">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-white/50 truncate">
                      {item.subtitle}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/40 truncate">
                      {item.specs.map((s) => s.value).join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 group-hover:text-white">
                    <span className="hidden sm:inline">{item.shopLabel}</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          {/* Closing + CTA */}
          <p className="mt-10 uppercase font-bold leading-[0.95] tracking-[-0.03em] text-[clamp(1.5rem,3.4vw,2.75rem)]">
            {closingA}
            <br />
            <span className="text-white/70">{closingB}</span>
          </p>
          <div className="mt-6">
            <Link href="/new-arrivals" className="editorial-cta group">
              Shop new in
              <ArrowRight className="editorial-cta-arrow" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Full-bleed dissolve into the New Arrivals canvas */}
      <div className="manifesto-showcase-dissolve" aria-hidden="true" />
    </div>
  );
}
