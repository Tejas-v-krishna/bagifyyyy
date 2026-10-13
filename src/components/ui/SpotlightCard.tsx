"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { canUsePointerEffects, rafThrottle, type RafThrottled } from "@/lib/motion";

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Dark card lit by a soft radial beam that follows the pointer. The beam sits
 * behind the content, so it reveals the surface underneath while the text stays
 * crisp. Fine pointers only; the beam is hidden under `prefers-reduced-motion`.
 */
export default function SpotlightCard({ children, className = "", style }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<RafThrottled<[number, number]> | null>(null);

  useEffect(() => {
    const track = rafThrottle((clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      el.style.setProperty("--spot-x", `${(((clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
      el.style.setProperty("--spot-y", `${(((clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
    });

    trackRef.current = track;
    return () => track.cancel();
  }, []);

  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !canUsePointerEffects()) return;
    ref.current?.classList.add("is-lit");
    trackRef.current?.(event.clientX, event.clientY);
  };

  const handleLeave = () => ref.current?.classList.remove("is-lit");

  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`.trim()}
      style={style}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <span className="spotlight-beam" aria-hidden="true" />
      <div className="spotlight-content">{children}</div>
    </div>
  );
}
