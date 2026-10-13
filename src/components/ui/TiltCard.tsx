"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { canUsePointerEffects, rafThrottle, type RafThrottled } from "@/lib/motion";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Maximum rotation (degrees) reached at the card edges. */
  maxTilt?: number;
  /** Render the pointer-following chrome specular highlight. */
  glare?: boolean;
  /** Scale applied while the pointer is over the card. */
  scale?: number;
  /** Vertical lift (px) applied while hovered. */
  lift?: number;
}

/**
 * Pointer-driven 3D tilt surface with a chrome specular sheen.
 *
 * The rotation and highlight position are written straight onto CSS custom
 * properties through a rAF-throttled handler, so a moving pointer never
 * triggers a React re-render. Fine pointers only; disabled under
 * `prefers-reduced-motion` and on touch devices.
 */
export default function TiltCard({
  children,
  className = "",
  style,
  maxTilt = 9,
  glare = true,
  scale = 1.015,
  lift = 8,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<RafThrottled<[number, number]> | null>(null);

  useEffect(() => {
    const track = rafThrottle((clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;

      el.style.setProperty("--tilt-ry", `${((px - 0.5) * maxTilt * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-rx", `${((0.5 - py) * maxTilt * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-mx", `${(px * 100).toFixed(2)}%`);
      el.style.setProperty("--tilt-my", `${(py * 100).toFixed(2)}%`);
    });

    trackRef.current = track;
    return () => track.cancel();
  }, [maxTilt]);

  const handleEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !canUsePointerEffects()) return;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-scale", String(scale));
    el.style.setProperty("--tilt-lift", `${-lift}px`);
    el.classList.add("is-tilting");
  };

  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !canUsePointerEffects()) return;
    trackRef.current?.(event.clientX, event.clientY);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.setProperty("--tilt-rx", "0deg");
    el.style.setProperty("--tilt-ry", "0deg");
    el.style.setProperty("--tilt-mx", "50%");
    el.style.setProperty("--tilt-my", "50%");
    el.style.setProperty("--tilt-scale", "1");
    el.style.setProperty("--tilt-lift", "0px");
  };

  return (
    <div
      ref={ref}
      className={`tilt-surface ${className}`.trim()}
      style={style}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div className="tilt-surface-inner">{children}</div>
      {glare && <span className="tilt-glare" aria-hidden="true" />}
    </div>
  );
}

export interface TiltLayerProps {
  children: ReactNode;
  /** Distance (px) to push the layer along the Z axis. */
  depth?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Depth layer for {@link TiltCard}. A positive `depth` floats the layer above
 * the card surface so it separates from the plane while the card tilts.
 */
export function TiltLayer({ children, depth = 30, className = "", style }: TiltLayerProps) {
  return (
    <div
      className={className}
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
