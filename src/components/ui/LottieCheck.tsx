"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lottie check-mark animation (black disc pop + white tick draw-in) used by
 * the post-payment success celebration. `lottie-web` is loaded lazily so the
 * player only ships to browsers that actually render the overlay. If the
 * player or the JSON ever fails, we fall back to a static inline SVG check —
 * the celebration must never break because of the animation.
 */
export default function LottieCheck({ className = "h-24 w-24" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let animation: { destroy: () => void } | null = null;

    (async () => {
      try {
        const [{ default: lottie }, { default: animationData }] = await Promise.all([
          import("lottie-web"),
          import("./success-check.json"),
        ]);
        if (cancelled) return;
        animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: false,
          autoplay: true,
          animationData,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
        <svg viewBox="0 0 96 96" className="h-full w-full">
          <circle cx="48" cy="48" r="43" fill="#101012" />
          <path
            d="M31 49.5 42.5 62 65.5 36"
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
