"use client";

import Image from "next/image";

// 8 fixed, artfully scattered, non-adjacent glass squares covering Left, Center, and Right
const FIXED_SCATTERED_INDICES = [
  4,   // Row 0, Col 4 (Top Right)
  7,   // Row 1, Col 1 (Upper Left - Shirt Shoulder)
  14,  // Row 2, Col 2 (Center - Shirt Body)
  17,  // Row 2, Col 5 (Mid-Upper Far Right)
  21,  // Row 3, Col 3 (Waist / Chain Center)
  24,  // Row 4, Col 0 (Denim Thigh Far Left)
  28,  // Row 4, Col 4 (Denim Thigh / Knee Right)
  37   // Row 6, Col 1 (Lower Leg / Boot Left)
];

export default function GlassFractalGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 grid grid-cols-6 grid-rows-7 z-20 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: 42 }).map((_, i) => {
        const isGlass = FIXED_SCATTERED_INDICES.includes(i);
        const col = i % 6;
        const row = Math.floor(i / 6);

        if (!isGlass) {
          return (
            <div
              key={i}
              className="relative border-r border-b border-white/[0.04]"
            />
          );
        }

        // Randomized lens refraction offsets and rotations per tile
        const shiftX = (i * 7) % 17 - 8; // -8px to +8px
        const shiftY = (i * 11) % 15 - 7; // -7px to +7px
        const rotAngles = [0, 90, 180, 270];
        const rot = rotAngles[(i * 3) % 4];

        return (
          <div
            key={i}
            className="relative overflow-hidden border-r border-b border-white/[0.08]"
            style={{
              backdropFilter: "blur(2.5px) saturate(120%)",
              WebkitBackdropFilter: "blur(2.5px) saturate(120%)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 35%, transparent 70%, rgba(255,255,255,0.015) 100%)",
              boxShadow: "inset 1px 1px 0.5px rgba(255,255,255,0.18), inset -1px -1px 0.5px rgba(255,255,255,0.04), 0 2px 10px rgba(0,0,0,0.2)",
              filter: "drop-shadow(-0.3px -0.15px 0.15px rgba(255,45,85,0.08)) drop-shadow(0.3px 0.15px 0.15px rgba(0,225,255,0.08))",
            }}
          >
            {/* ── 1. Physical Optical Lens Refraction (Magnified & Offset at 100% Native Sharpness) ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: "600%",
                height: "700%",
                left: `-${col * 100}%`,
                top: `-${row * 100}%`,
                transform: `scale(1.06) translate3d(${shiftX}px, ${shiftY}px, 0)`,
                transformOrigin: `${(col + 0.5) * (100 / 6)}% ${(row + 0.5) * (100 / 7)}%`,
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/editorial-manifesto.png"
                  alt="optical refracted layer"
                  fill
                  className="object-contain object-center opacity-95 select-none"
                  quality={100}
                  priority={true}
                  unoptimized
                />
              </div>
            </div>

            {/* ── 2. Delicate Whisper-Sheer Crystal Facet Texture ── */}
            <Image
              src="/fractal-glass.png"
              alt="crystal facet"
              fill
              className={`object-cover opacity-[0.08] mix-blend-screen scale-110 rotate-[${rot}deg] pointer-events-none`}
              unoptimized
            />

            {/* ── 3. Subtle Sheer Directional Specular Sheen (Barely visible highlight) ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(108deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.005) 20%, transparent 40%)",
              }}
            />

            {/* ── 4. Refractive Prism Bevel Border ── */}
            <div className="absolute inset-0 border border-white/[0.04] pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}

