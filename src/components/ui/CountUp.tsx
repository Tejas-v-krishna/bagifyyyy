"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useInView } from "@/lib/motion";

export interface CountUpProps {
  value: number;
  /** Animation length in ms. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** BCP-47 locale for digit grouping. Defaults to the storefront's `en-IN`. */
  locale?: string;
  className?: string;
  /** Wait until the element scrolls into view before counting. */
  startOnView?: boolean;
}

/**
 * Eased number counter. Starts when scrolled into view (or immediately when
 * `startOnView` is false) and snaps straight to the final value under
 * `prefers-reduced-motion`.
 */
export default function CountUp({
  value,
  duration = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "en-IN",
  className = "",
  startOnView = true,
}: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>({ once: true, threshold: 0.4 });
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startOnView && !inView) return;
    if (startedRef.current) return;
    startedRef.current = true;

    // A zero-length run settles on the final value inside the first frame,
    // which keeps reduced-motion visitors from ever seeing an animated counter.
    const effectiveDuration = prefersReducedMotion() ? 0 : duration;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = effectiveDuration <= 0 ? 1 : Math.min((now - start) / effectiveDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(value * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [inView, startOnView, value, duration]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(current);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
