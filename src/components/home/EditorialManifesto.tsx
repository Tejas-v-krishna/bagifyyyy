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
    desc: "Boxy button-down with dropped shoulders, a raw hem, and reinforced bar tacks at the stress points.",
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
    desc: "Solid chrome wallet chain with heavy links and an industrial carabiner clasp. It keeps its weight when you move.",
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
    desc: "Whisker fading across the knee and thigh. Each pair gets its own stone wash, so no two fades land exactly alike.",
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
    desc: "Extra-wide legs with enough structure to stack over boots and platform soles.",
    provenance: "TOKYO PATTERN STUDY",
    top: "65%",
    left: "38%",
    side: "left",
    vertical: "top",
  },
];

export default function EditorialManifesto() {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  return (
    <div className="relative w-full bg-black select-none" data-nav-theme="dark">
      <section
        className="relative w-full max-w-[1440px] mx-auto min-h-[660px] sm:min-h-[760px] md:aspect-[1/1.06] overflow-hidden bg-black"
        aria-labelledby="manifesto-heading"
      >
        {/* Soft top gradient blend */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/40 to-transparent z-20" />

        {/* ── Central Model Cutout Image ── */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center z-10">
          <Image
            src="/editorial-manifesto.png"
            alt="BAGIFYYYY editorial manifesto FW26"
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-contain object-center select-none"
            priority={true}
            quality={100}
            unoptimized
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
            Clothes For<br />The Offbeat
          </h2>
        </div>

        <div className="absolute top-[8%] right-[4%] max-w-[260px] sm:max-w-[300px] text-right z-25 pointer-events-none">
          <p className="font-mono text-[8px] sm:text-[9px] tracking-[0.05em] leading-[1.65] text-white/60">
            BAGIFYYYY pulls from early-2000s streetwear, club nights, and the clothes that looked better after a hundred wears.
          </p>
        </div>

        {/* ── HERO STATEMENT: ARCHIVE OVER TREND // ENDURANCE OVER HYPE ── */}
        <div className="absolute top-[29%] left-[3.2%] right-[3.2%] flex flex-col gap-1 sm:gap-2 z-25 pointer-events-none">
          <p className="uppercase font-bold leading-none tracking-[-0.03em] text-[clamp(1.1rem,3.2vw,3.2rem)] text-white">
            Wear It, Don&apos;t Chase It
          </p>
          <p className="uppercase font-bold leading-none tracking-[-0.03em] text-[clamp(1.1rem,3.2vw,3.2rem)] text-white text-right">
            Weight Over Hype
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
                {/* ── Reticle Target Button (Hover-only trigger) ── */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={pin.title}
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

                    {/* Rotating Dashed Outer Viewfinder Ring */}
                    <div
                      className={`absolute inset-0 rounded-full border border-dashed transition-all duration-500 ${
                        isOpen
                          ? "border-white rotate-90 scale-110"
                          : "border-white/35 group-hover:border-white/70 group-hover:rotate-45"
                      }`}
                    />

                    {/* Corner Micro-Ticks (Crosshair effect) */}
                    <div className="absolute inset-1 pointer-events-none">
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1 bg-white/70" />
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-1 bg-white/70" />
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-1 bg-white/70" />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-[1px] w-1 bg-white/70" />
                    </div>

                    {/* Central Glowing Core Pulse */}
                    <div
                      className={`rounded-full transition-all duration-300 ${
                        isOpen
                          ? "w-2.5 h-2.5 bg-white shadow-[0_0_16px_rgba(255,255,255,1)] scale-125"
                          : "w-1.5 h-1.5 bg-white/90 group-hover:scale-125 group-hover:bg-white"
                      }`}
                    />
                  </div>

                  {/* Micro Coordinate Pill Tag (Avant Garde font) */}
                  <div
                    className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${
                      isOpen
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] translate-x-0.5"
                        : "bg-black/75 text-white/90 border-white/25 group-hover:border-white/60 group-hover:text-white"
                    }`}
                  >
                    <span
                      className="text-[9.5px] font-bold tracking-wider"
                      style={{ fontFamily: '"ITCAvantGardeStd", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {pin.num}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-60" />
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
                  <div className="relative bg-[#0c0c0c]/95 border border-white/15 rounded-[0.4rem] p-3 sm:p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl text-left">
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
              Wear History
            </span>
            <span className="block text-right sm:text-left">
              Make It Yours
            </span>
          </p>
        </div>
      </section>

      {/* Full-bleed dissolve into the New Arrivals canvas */}
      <div className="manifesto-showcase-dissolve" aria-hidden="true" />
    </div>
  );
}
