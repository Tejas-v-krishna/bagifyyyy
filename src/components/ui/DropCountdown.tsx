"use client";

import { useState, useEffect } from "react";

type DropInfo = {
  targetAt: string | null;
  label: string | null;
};

function pad(n: number, len = 2): string[] {
  return String(Math.max(0, n)).padStart(len, "0").split("");
}

function Digit({ char }: { char: string }) {
  return (
    <span className="flex h-12 w-9 items-center justify-center rounded-md border border-black/10 bg-white font-microgramma text-[22px] font-bold tabular-nums text-black shadow-[0_2px_10px_rgba(0,0,0,0.06)] sm:h-16 sm:w-12 sm:text-3xl">
      {char}
    </span>
  );
}

function Unit({ digits, label }: { digits: string[]; label: string }) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <span className="flex items-center gap-1">
        {digits.map((d, i) => (
          <Digit key={i} char={d} />
        ))}
      </span>
      <span className="text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-black/45">
        {label}
      </span>
    </span>
  );
}

function Colon() {
  return (
    <span className="pb-6 font-microgramma text-xl sm:text-2xl font-bold text-black/70 select-none" aria-hidden="true">
      :
    </span>
  );
}

/**
 * Next-drop countdown band. Renders nothing until the studio sets a target
 * via /api/drop, and disappears on its own once the moment passes.
 */
export default function DropCountdown() {
  const [drop, setDrop] = useState<DropInfo | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/drop")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DropInfo | null) => {
        if (!cancelled && data?.targetAt) setDrop(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!drop) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [drop]);

  if (!drop?.targetAt) return null;
  const remaining = Date.parse(drop.targetAt) - now;
  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <section className="relative z-10 w-full bg-white px-4 pt-24 pb-8 sm:px-6 sm:pt-28" aria-label="Next drop countdown">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col items-center gap-4">
        <h2 className="font-microgramma uppercase text-[clamp(1.4rem,3vw,2.6rem)] font-bold leading-none tracking-tight text-black">
          {drop.label || "Next Drop"}
        </h2>
        <div className="flex items-start gap-1.5 sm:gap-2.5" role="timer" aria-live="off">
          <Unit digits={pad(days)} label="Day" />
          <Colon />
          <Unit digits={pad(hours)} label="Hr" />
          <Colon />
          <Unit digits={pad(minutes)} label="Min" />
          <Colon />
          <Unit digits={pad(seconds)} label="Sec" />
        </div>
      </div>
    </section>
  );
}
