"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { canUsePointerEffects, rafThrottle, type RafThrottled } from "@/lib/motion";

export interface MagneticProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Fraction of the pointer offset the wrapper follows (0–1). */
  strength?: number;
  /** Extra follow applied to the inner content, for parallax depth. */
  innerStrength?: number;
  /** Pointer distance (px) beyond which the magnet releases. */
  radius?: number;
}

/**
 * Magnetic hover wrapper. The root drifts toward the pointer while the inner
 * content drifts a little further, giving CTAs a springy, tactile pull that
 * eases back into place on leave. Fine pointers only.
 */
export default function Magnetic({
  children,
  className = "",
  style,
  strength = 0.32,
  innerStrength = 0.12,
  radius = 130,
}: MagneticProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<RafThrottled<[number, number]> | null>(null);

  useEffect(() => {
    const track = rafThrottle((clientX: number, clientY: number) => {
      const root = rootRef.current;
      const inner = innerRef.current;
      if (!root || !inner) return;

      const rect = root.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const falloff = distance > radius ? 0 : 1 - distance / radius;

      root.style.transform = `translate3d(${(dx * strength * falloff).toFixed(2)}px, ${(dy * strength * falloff).toFixed(2)}px, 0)`;
      inner.style.transform = `translate3d(${(dx * innerStrength * falloff).toFixed(2)}px, ${(dy * innerStrength * falloff).toFixed(2)}px, 0)`;
    });

    trackRef.current = track;
    return () => track.cancel();
  }, [strength, innerStrength, radius]);

  const reset = () => {
    rootRef.current?.classList.remove("is-pulled");
    if (rootRef.current) rootRef.current.style.transform = "translate3d(0, 0, 0)";
    if (innerRef.current) innerRef.current.style.transform = "translate3d(0, 0, 0)";
  };

  const handleMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== "mouse" || !canUsePointerEffects()) return;
    rootRef.current?.classList.add("is-pulled");
    trackRef.current?.(event.clientX, event.clientY);
  };

  return (
    <span
      ref={rootRef}
      className={`magnetic-root ${className}`.trim()}
      style={style}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      <span ref={innerRef} className="magnetic-inner">
        {children}
      </span>
    </span>
  );
}
