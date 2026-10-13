"use client";

import Image from "next/image";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { canUsePointerEffects, clamp, rafThrottle, type RafThrottled } from "@/lib/motion";

export interface LensZoomProps {
  src: string;
  alt: string;
  /** Magnification factor. */
  zoom?: number;
  /** Lens diameter in px. */
  lensSize?: number;
  /** Responsive sizes hint forwarded to the base image. */
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Magnifier lens for product imagery. The lens tracks the pointer and shows a
 * scaled copy of the image aligned to the exact point under the cursor. The
 * lens is driven imperatively (no re-render per frame) and only appears for
 * fine pointers with motion allowed.
 */
export default function LensZoom({
  src,
  alt,
  zoom = 2.4,
  lensSize = 190,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className = "",
  priority = false,
}: LensZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const zoomWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<RafThrottled<[number, number]> | null>(null);

  useEffect(() => {
    const track = rafThrottle((clientX: number, clientY: number) => {
      const container = containerRef.current;
      const lens = lensRef.current;
      const zoomWrap = zoomWrapRef.current;
      if (!container || !lens || !zoomWrap) return;

      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const radius = lensSize / 2;
      const cx = clamp(clientX - rect.left, radius, rect.width - radius);
      const cy = clamp(clientY - rect.top, radius, rect.height - radius);

      lens.style.left = `${cx}px`;
      lens.style.top = `${cy}px`;

      // Size the scaled copy to the container * zoom, then offset it so the
      // point under the lens centre stays magnified at the lens centre.
      zoomWrap.style.width = `${rect.width * zoom}px`;
      zoomWrap.style.height = `${rect.height * zoom}px`;
      zoomWrap.style.left = `${radius - cx * zoom}px`;
      zoomWrap.style.top = `${radius - cy * zoom}px`;
    });

    trackRef.current = track;
    return () => track.cancel();
  }, [lensSize, zoom]);

  const show = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !canUsePointerEffects()) return;
    lensRef.current?.classList.add("is-visible");
    trackRef.current?.(event.clientX, event.clientY);
  };

  const hide = () => lensRef.current?.classList.remove("is-visible");

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`.trim()}
      onPointerEnter={show}
      onPointerMove={show}
      onPointerLeave={hide}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        draggable={false}
        sizes={sizes}
        className="object-cover"
      />

      <div
        ref={lensRef}
        className="lens-glass"
        style={{ width: lensSize, height: lensSize }}
        aria-hidden="true"
      >
        <div ref={zoomWrapRef} style={{ position: "absolute" }}>
          <Image
            src={src}
            alt=""
            fill
            draggable={false}
            sizes={`${Math.round(lensSize * 4)}px`}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
