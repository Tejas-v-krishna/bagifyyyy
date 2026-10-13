"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { prefersReducedMotion } from "@/lib/motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface RippleSurfaceProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Ripple fill. Defaults to a soft ink wash for light surfaces. */
  color?: string;
}

/**
 * Adds a material-style click ripple to any surface. The wave spawns at the
 * pointer and expands to cover the farthest corner, then removes itself from
 * state. Skipped entirely under `prefers-reduced-motion`.
 */
export default function RippleSurface({
  children,
  className = "",
  style,
  color = "rgba(11, 11, 11, 0.16)",
}: RippleSurfaceProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.hypot(rect.width, rect.height) * 2;
    const id = (idRef.current += 1);

    setRipples((prev) => [
      ...prev,
      {
        id,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
        size,
      },
    ]);

    window.setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 720);
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`.trim()}
      style={style}
      onPointerDown={handlePointerDown}
    >
      {children}
      <span className="ripple-layer" aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple-wave"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
