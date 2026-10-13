"use client";

import type { ReactNode } from "react";
import { ArrowRight, Asterisk, Layers, Sparkles } from "lucide-react";
import TiltCard, { TiltLayer } from "@/components/ui/TiltCard";
import Magnetic from "@/components/ui/Magnetic";
import ScrambleText from "@/components/ui/ScrambleText";
import CountUp from "@/components/ui/CountUp";
import RippleSurface from "@/components/ui/RippleSurface";
import LensZoom from "@/components/ui/LensZoom";
import SpotlightCard from "@/components/ui/SpotlightCard";

/**
 * Live demo for the interaction kit.
 *
 * Chrome surfaces are painted with inline styles on purpose: the site-wide
 * `monochrome.css` contract rewrites class-based gradients and removes every
 * `shadow-*` utility, so inline values are the only ones that survive.
 */
const CHROME = "linear-gradient(135deg, #ffffff 0%, #ededed 34%, #cfcfcf 58%, #f6f6f6 78%, #d9d9d9 100%)";
const CHROME_SOFT = "linear-gradient(150deg, #ffffff 0%, #f3f3f3 46%, #dedede 100%)";

const TILT_CARDS = [
  {
    tag: "Tilt + glare",
    title: "Chrome panel",
    copy: "The surface rotates toward the pointer while a specular highlight tracks across the metal.",
    depth: 54,
  },
  {
    tag: "Parallax layers",
    title: "Stacked depth",
    copy: "Each layer is pushed along Z, so the type separates from the panel as the card moves.",
    depth: 40,
  },
  {
    tag: "Spring return",
    title: "Eased release",
    copy: "On leave the rotation unwinds through a long cubic-bezier, never snapping back to flat.",
    depth: 62,
  },
];

const SPOTLIGHT_CARDS = [
  { eyebrow: "Spotlight", title: "Move to reveal", copy: "A soft beam follows the cursor across the dark surface." },
  { eyebrow: "Depth", title: "Beam behind content", copy: "The light sits under the copy, so text contrast never drops." },
  { eyebrow: "Restraint", title: "Fine pointers only", copy: "Touch devices and reduced-motion visitors get the flat card." },
];

const STATS = [
  { label: "Pieces archived", value: 12480, decimals: 0, prefix: "", suffix: "" },
  { label: "Drop sell-through", value: 94, decimals: 0, prefix: "", suffix: "%" },
  { label: "Countries shipped", value: 38, decimals: 0, prefix: "", suffix: "" },
  { label: "Average rating", value: 4.9, decimals: 1, prefix: "", suffix: "/5" },
];

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className="text-[9.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: dark ? "rgba(255,255,255,0.55)" : "#8a8a8a" }}
    >
      {children}
    </p>
  );
}

function Demo({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t px-5 py-14 sm:px-8 lg:px-12" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="mb-8 flex items-baseline gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: "#a5a5a5" }}>
            {index}
          </span>
          <div>
            <h2 className="font-microgramma text-[18px] font-bold uppercase tracking-tight text-black sm:text-[22px]">
              {title}
            </h2>
            <p className="mt-1.5 max-w-[64ch] text-[12px] leading-relaxed" style={{ color: "#5e5e5e" }}>
              {note}
            </p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function UiLabPage() {
  return (
    <div className="w-full pb-24">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="px-5 pt-14 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1180px]">
          <Eyebrow>BAGIFYYYY · front-end interaction kit</Eyebrow>
          <ScrambleText
            as="h1"
            text="Move the mouse"
            trigger="mount"
            duration={1150}
            className="mt-4 block font-microgramma text-[clamp(2.2rem,8.5vw,5.2rem)] font-bold uppercase leading-[0.9] tracking-[-0.045em] text-black"
          />
          <p className="mt-6 max-w-[62ch] text-[13px] leading-relaxed" style={{ color: "#4a4a4a" }}>
            Seven pointer-driven primitives that extend the existing monochrome contract: 3D tilt with a chrome
            specular sheen, magnetic pull, decode text, eased counters, click ripples, a cursor spotlight, and a
            product magnifier. Each one no-ops on touch devices and collapses to a static surface when the visitor
            asks for reduced motion.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            {["Fine pointer only", "rAF-throttled", "Reduced-motion safe", "No per-frame re-render"].map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "#6b6b6b" }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#111" }} />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── 01 · Tilt card ───────────────────────────────────────────── */}
      <Demo
        index="01"
        title="Tilt card"
        note="Rotation and sheen position are written straight onto CSS custom properties inside a requestAnimationFrame callback, so a moving pointer never re-renders React. TiltLayer children are pushed along Z for parallax."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TILT_CARDS.map((card) => (
            <TiltCard key={card.title} className="h-full" style={{ borderRadius: 18 }} maxTilt={10} lift={10}>
              <div
                className="flex h-full flex-col justify-between p-5"
                style={{
                  minHeight: 280,
                  borderRadius: 18,
                  background: CHROME,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <div className="flex items-start justify-between">
                  <TiltLayer depth={38}>
                    <Eyebrow>{card.tag}</Eyebrow>
                  </TiltLayer>
                  <TiltLayer depth={30}>
                    <Asterisk className="h-5 w-5 text-black" aria-hidden="true" />
                  </TiltLayer>
                </div>

                <TiltLayer depth={card.depth}>
                  <h3 className="font-microgramma text-[20px] font-bold uppercase leading-none tracking-tight text-black">
                    {card.title}
                  </h3>
                  <p className="mt-3 max-w-[34ch] text-[12px] leading-relaxed" style={{ color: "#3f3f3f" }}>
                    {card.copy}
                  </p>
                </TiltLayer>

                <TiltLayer depth={22}>
                  <span
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: "#111" }}
                  >
                    Inspect
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </TiltLayer>
              </div>
            </TiltCard>
          ))}
        </div>
      </Demo>

      {/* ── 02 · Spotlight card ──────────────────────────────────────── */}
      <Demo
        index="02"
        title="Cursor spotlight"
        note="A radial beam follows the pointer across a dark card. It is layered above the surface but beneath the content, so the light reveals the panel without ever washing out the type."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SPOTLIGHT_CARDS.map((card) => (
            <SpotlightCard
              key={card.title}
              style={{
                borderRadius: 18,
                background: "linear-gradient(150deg, #141414 0%, #0a0a0a 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex flex-col justify-between p-6" style={{ minHeight: 220 }}>
                <Eyebrow dark>{card.eyebrow}</Eyebrow>
                <div>
                  <h3 className="font-microgramma text-[19px] font-bold uppercase leading-none tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 max-w-[32ch] text-[12px] leading-relaxed text-white/60">{card.copy}</p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </Demo>

      {/* ── 03 · Magnetic ────────────────────────────────────────────── */}
      <Demo
        index="03"
        title="Magnetic pull"
        note="The wrapper drifts toward the pointer with a distance-based falloff while the inner content drifts a little further. Hover a button and pull away slowly to feel the release."
      >
        <div className="flex flex-wrap items-center gap-10">
          <Magnetic radius={150} strength={0.36}>
            <button type="button" className="btn-bagify btn-bagify-dark" style={{ minWidth: 210 }}>
              <span>Shop new in</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </Magnetic>

          <Magnetic radius={150} strength={0.36}>
            <button type="button" className="btn-bagify btn-bagify-dark" style={{ minWidth: 210 }}>
              <span>View the archive</span>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </button>
          </Magnetic>

          <Magnetic radius={150} strength={0.36}>
            <button type="button" className="btn-bagify btn-bagify-dark" style={{ minWidth: 210 }}>
              <span>Open bundles</span>
              <Layers className="h-4 w-4" aria-hidden="true" />
            </button>
          </Magnetic>
        </div>
      </Demo>

      {/* ── 04 · Ripple ──────────────────────────────────────────────── */}
      <Demo
        index="04"
        title="Click ripple"
        note="Each press spawns a wave at the pointer that expands to the farthest corner, then removes itself from state. Ripples are skipped entirely under reduced motion."
      >
        <div className="flex flex-wrap items-center gap-8">
          <RippleSurface className="rounded-full" style={{ borderRadius: 9999 }} color="rgba(255,255,255,0.42)">
            <button
              type="button"
              className="inline-flex items-center gap-3 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ background: "#111111", color: "#ffffff", borderRadius: 9999 }}
            >
              Press anywhere
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </RippleSurface>

          <RippleSurface className="rounded-full" style={{ borderRadius: 9999 }} color="rgba(0,0,0,0.22)">
            <button
              type="button"
              className="inline-flex items-center gap-3 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ background: CHROME_SOFT, color: "#111111", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 9999 }}
            >
              Chrome variant
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </button>
          </RippleSurface>
        </div>
      </Demo>

      {/* ── 05 · Count up ────────────────────────────────────────────── */}
      <Demo
        index="05"
        title="Eased counters"
        note="Numbers animate once, when the block scrolls into view, using an ease-out curve and the storefront's en-IN grouping. Reduced-motion visitors see the final value immediately."
      >
        <div
          className="grid grid-cols-2 gap-x-6 gap-y-10 p-8 sm:grid-cols-4"
          style={{ background: CHROME_SOFT, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 18 }}
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <CountUp
                value={stat.value}
                decimals={stat.decimals}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="block font-microgramma text-[clamp(1.7rem,4.4vw,2.6rem)] font-bold leading-none tracking-[-0.03em] text-black"
              />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b6b6b" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Demo>

      {/* ── 06 · Lens zoom ───────────────────────────────────────────── */}
      <Demo
        index="06"
        title="Magnifier lens"
        note="The lens tracks the pointer and shows a scaled copy of the image aligned to the exact point beneath the cursor. The lens is positioned imperatively, so dragging it across the frame costs no renders."
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <LensZoom
            src="/assets/ai/prod_model_1_hoodie_1786659181183.jpg"
            alt="Editorial hoodie shot used to demonstrate the magnifier lens"
            zoom={2.6}
            lensSize={200}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="aspect-[4/5] w-full"
          />
          <div>
            <Eyebrow>Product detail</Eyebrow>
            <h3 className="mt-3 font-microgramma text-[clamp(1.3rem,3.4vw,2rem)] font-bold uppercase leading-[0.95] tracking-tight text-black">
              <ScrambleText as="span" text="See the stitch" trigger="hover" duration={700} />
            </h3>
            <p className="mt-4 max-w-[46ch] text-[12.5px] leading-relaxed" style={{ color: "#4a4a4a" }}>
              Hover the frame to magnify. The lens hides itself on touch devices, and this heading decodes on hover —
              move the pointer over it to replay the effect.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["Aligned to the exact cursor point", "Imperative positioning, zero re-render", "Hidden under reduced motion"].map(
                (line) => (
                  <li key={line} className="flex items-center gap-3 text-[12px]" style={{ color: "#3f3f3f" }}>
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#111" }} />
                    {line}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </Demo>
    </div>
  );
}
