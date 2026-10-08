"use client";

import { useState } from "react";
import Image from "next/image";

type GarmentPin = {
  id: string;
  num: string;
  tag: string;
  title: string;
  subtitle: string;
  specs: { label: string; value: string }[];
  desc: string;
  provenance: string;
  top: string;
  left: string;
  side: "left" | "right";
  vertical: "top" | "bottom";
};

const PINS_DATA: GarmentPin[] = [
  {
    id: "shirting",
    num: "01",
    tag: "TEXTILE SPEC // 01",
     title: "BOXY BUTTON-DOWN",
     subtitle: "Dropped shoulders",
    specs: [
      { label: "WEIGHT", value: "240 GSM" },
      { label: "WEAVE", value: "RAW POPLIN" },
      { label: "FIT", value: "RELAXED" },
    ],
    desc: "Boxy, dropped shoulders, raw hem. Bar tacks where it usually rips first.",
    provenance: "FW26 // SMALL RUN",
    top: "22%",
    left: "48%",
    side: "right",
    vertical: "bottom",
  },
  {
    id: "chrome",
    num: "02",
    tag: "HARDWARE SPEC // 02",
     title: "CHROME CHAIN",
     subtitle: "Solid milled steel",
    specs: [
      { label: "ALLOY", value: "MILLED STEEL" },
      { label: "FINISH", value: "MIRROR CHROME" },
      { label: "GAUGE", value: "HEAVY 8MM" },
    ],
    desc: "Heavy links, industrial clasp. You'll feel it when you walk.",
    provenance: "BAGIFYYYY HARDWARE",
    top: "42%",
    left: "52%",
    side: "right",
    vertical: "top",
  },
  {
    id: "wash",
    num: "03",
    tag: "TREATMENT SPEC // 03",
     title: "FADED WASH",
     subtitle: "Finished one pair at a time",
    specs: [
      { label: "PROCESS", value: "MULTI-ENZYME" },
      { label: "SHADE", value: "FADED INDIGO" },
      { label: "TINT", value: "MUD PATINA" },
    ],
    desc: "Whiskers at the knee and thigh. Stone-washed one pair at a time, so no two fades match.",
    provenance: "HAND-FINISHED",
    top: "54%",
    left: "60%",
    side: "right",
    vertical: "top",
  },
  {
    id: "oversized",
    num: "04",
    tag: "SILHOUETTE SPEC // 04",
     title: "WIDE-LEG DENIM",
     subtitle: "460 GSM heavyweight denim",
    specs: [
      { label: "WEIGHT", value: "460 GSM" },
      { label: "COTTON", value: "100% RING-SPUN" },
      { label: "LEG", value: "STACKED PUDDLE" },
    ],
    desc: "Extra-wide with enough backbone to stack over boots.",
    provenance: "TOKYO PATTERN STUDY",
    top: "65%",
    left: "38%",
    side: "left",
    vertical: "top",
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
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  return (
    <div className="relative w-full bg-[#151518] select-none" data-nav-theme="dark">
      <section
        className="relative w-full max-w-[1440px] mx-auto min-h-[660px] sm:min-h-[760px] md:aspect-[1/1.06] overflow-hidden bg-[#151518]"
        aria-labelledby="manifesto-heading"
      >
        {/* ── Central Model Cutout Image ── */}
        <div className="manifesto-image-blend absolute inset-0 overflow-hidden flex items-center justify-center z-10">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-contain object-center select-none"
          />
        </div>

        {/* Subtle Radial Backlight for depth */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,_rgba(255,255,255,0.08)_0%,_transparent_65%)] z-10"
          aria-hidden="true"
        />

        {/* ── TOP MANIFESTO & HEADLINE ── */}
        <div className="absolute top-[8%] left-[4%] max-w-[50%] sm:max-w-[48%] z-25 pointer-events-none">
          <h2
            id="manifesto-heading"
            className="uppercase font-bold leading-[0.96] tracking-[-0.03em] text-[clamp(1.1rem,3vw,3rem)] text-white"
          >
            {headingLine1}
            <br />
            {headingLine2}
          </h2>
        </div>

        <div className="absolute top-[8%] right-[4%] max-w-[260px] sm:max-w-[300px] text-right z-25 pointer-events-none">
          <p className="font-mono text-[8px] sm:text-[9px] tracking-[0.05em] leading-[1.65] text-white/60">
            {intro}
          </p>
        </div>

        {/* ── HERO STATEMENT: ARCHIVE OVER TREND // ENDURANCE OVER HYPE ── */}
        <div className="absolute top-[29%] left-[3.2%] right-[3.2%] flex flex-col gap-1 sm:gap-2 z-25 pointer-events-none">
          <p className="uppercase font-bold leading-none tracking-[-0.03em] text-[clamp(1.1rem,3.2vw,3.2rem)] text-white">
            {statementA}
          </p>
          <p className="uppercase font-bold leading-none tracking-[-0.03em] text-[clamp(1.1rem,3.2vw,3.2rem)] text-white text-right">
            {statementB}
          </p>
        </div>

        {/* ── PRECISION RETICLE PINS & SPEC HUD CARDS ── */}
        <div className="absolute inset-0 z-35 pointer-events-auto">
          {PINS_DATA.map((pin) => {
            const isOpen = hoveredPin === pin.id;

            return (
              <div
                key={pin.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: pin.top, left: pin.left }}
                onMouseEnter={() => setHoveredPin(pin.id)}
                onMouseLeave={() => setHoveredPin(null)}
              >
                {/* Numbered tag button (hover on desktop, tap on touch) */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={pin.title}
                  onClick={() => setHoveredPin(isOpen ? null : pin.id)}
                  className="relative flex items-center gap-2 cursor-pointer focus:outline-none p-2 group"
                >
                  {/* Optical Reticle Container */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    {/* Continuous Expanding Radar Ring */}
                    <span
                      className={`absolute inset-0 rounded-full border border-white/40 transition-all duration-700 ${
                        isOpen ? "scale-150 opacity-0" : "animate-ping opacity-60"
                      }`}
                    />

                    {/* Number dot with soft pulse */}
                    <div
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                        isOpen
                          ? "bg-black text-white border border-white scale-110"
                          : "bg-white text-black group-hover:scale-110"
                      }`}
                    >
                      {pin.num}
                    </div>
                  </div>

                  {/* Micro Coordinate Pill Tag (Avant Garde font) */}
                  <div
                    className={`flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${
                      isOpen
                        ? "bg-black text-white border-white/70"
                        : "bg-white/95 text-black border-black/10"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap"
                      style={{ fontFamily: '"ITCAvantGardeStd", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {pin.title}
                    </span>
                  </div>
                </button>

                {/* ── Editorial Spec Card (Compact Luxury Swing-Tag) ── */}
                <div
                  className={`transition-all duration-200 ease-out max-sm:fixed max-sm:inset-x-4 max-sm:bottom-6 max-sm:z-[999] sm:absolute sm:z-[70] sm:w-[260px] ${
                    pin.side === "right"
                      ? "sm:left-[calc(100%+14px)]"
                      : "sm:right-[calc(100%+14px)]"
                  } ${
                    pin.vertical === "bottom"
                      ? "sm:top-[-10px]"
                      : "sm:bottom-[-10px]"
                  } ${
                    isOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  {/* Subtle Hairline Connector */}
                  <div
                    className={`hidden sm:block absolute top-4 h-[1px] bg-gradient-to-r ${
                      pin.side === "right"
                        ? "-left-3 w-3 from-white/40 to-transparent"
                        : "-right-3 w-3 from-transparent to-white/40"
                    }`}
                  />

                  {/* Clean Spec Box Container */}
                  <div className="relative bg-[#1e1e22]/95 border border-white/15 rounded-[0.4rem] p-3 sm:p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl text-left">
                    {/* Header: Title + Minimal Spec Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className="font-sans font-bold text-[12.5px] text-white uppercase tracking-wider leading-tight"
                        style={{ fontFamily: '"ITCAvantGardeStd", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        {pin.title}
                      </h3>
                      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/40 border border-white/10 px-1.5 py-0.5 rounded-full bg-white/[0.04] shrink-0">
                         {pin.num} {"//"} FW26
                      </span>
                    </div>

                    {/* Subtitle / Key Cut */}
                    <p className="font-sans text-[10.5px] text-white/55 tracking-wide mt-1">
                      {pin.subtitle}
                    </p>

                    {/* Minimal Inline Spec Row */}
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1 text-[8.5px] font-mono text-white/60 uppercase tracking-wide">
                      {pin.specs.map((spec, i) => (
                        <span key={i} className="flex items-center gap-1 truncate">
                          {i > 0 && <span className="text-white/20 select-none">·</span>}
                          <span className="text-white/90 font-medium">{spec.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MONUMENTAL CLOSING HEADLINE ── */}
        <div className="absolute bottom-[6.5%] sm:bottom-[7.5%] left-[3%] right-[3%] z-[60] pointer-events-none">
          <p className="uppercase font-bold leading-[0.88] tracking-[-0.04em] text-[clamp(1.8rem,7vw,6.5rem)] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            <span className="block text-left">
              {closingA}
            </span>
            <span className="block text-right sm:text-left">
              {closingB}
            </span>
          </p>
        </div>
      </section>

      {/* Full-bleed dissolve into the New Arrivals canvas */}
      <div className="manifesto-showcase-dissolve" aria-hidden="true" />
    </div>
  );
}
