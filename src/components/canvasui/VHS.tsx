"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

export interface VHSOptions {
  /** Playback speed of the tape artifacts. 1 is normal speed. */
  speed?: number;
  /** Strength of the slow horizontal tape wave (0 to 3). */
  wave?: number;
  /** Strength of the fine per-line horizontal jitter (0 to 3). */
  jitter?: number;
  /** Strength of the travelling tape crease band (0 to 3). */
  crease?: number;
  /** Strength of the head-switching noise at the bottom (0 to 3). */
  switching?: number;
  /** Height of the head-switching band as a fraction of the screen. */
  switchingHeight?: number;
  /** Strength of the horizontal glow bleed (0 to 1). */
  bloom?: number;
  /** RGB channel misalignment in CSS pixels. */
  aberration?: number;
  /** Strength of the slow brightness beat rolling down the frame (0 to 1). */
  acBeat?: number;
  /** Amount of animated static grain (0 to 1). */
  grain?: number;
  /** Intensity of the CRT scanline overlay (0 to 1). */
  scanlines?: number;
  /** Darkening toward the frame corners (0 to 1). */
  vignette?: number;
  /** CRT tube curvature bending the frame inward (0 to 1). 0 disables. */
  barrel?: number;
  /** Color saturation. 1 keeps the content's colors, 0 is grayscale. */
  saturation?: number;
  /** Extra brightness multiplier applied at the end. */
  exposure?: number;
}

export interface VHSProps extends VHSOptions {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const DEFAULTS: Required<VHSOptions> = {
  speed: 0.1,
  wave: 0.5,
  jitter: 0.15,
  crease: 0.15,
  switching: 0.4,
  switchingHeight: 0.005,
  bloom: 0.7,
  aberration: 1.5,
  acBeat: 1.35,
  grain: 0.25,
  scanlines: 0.35,
  vignette: 0.05,
  barrel: 0.15,
  saturation: 1.15,
  exposure: 0.9,
};

export function VHS({ children, className, style, ...options }: VHSProps) {
  const config = { ...DEFAULTS, ...options };
  const containerRef = useRef<HTMLDivElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchTransform, setGlitchTransform] = useState({ x: 0, skew: 0 });

  // Animated procedural analog noise generator
  useEffect(() => {
    const canvas = noiseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = 180;
    const height = 120;
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    let frameCount = 0;
    const renderNoise = () => {
      frameCount++;
      // Render every 2nd frame for realistic retro film grain FPS
      if (frameCount % 2 === 0) {
        const grainIntensity = (config.grain ?? 0.25) * 45;
        for (let i = 0; i < data.length; i += 4) {
          const v = Math.random() * grainIntensity;
          data[i] = v;     // R
          data[i + 1] = v; // G
          data[i + 2] = v; // B
          data[i + 3] = v > 10 ? (config.grain ?? 0.25) * 60 : 0; // Alpha
        }
        ctx.putImageData(imgData, 0, 0);
      }
      animId = requestAnimationFrame(renderNoise);
    };

    animId = requestAnimationFrame(renderNoise);
    return () => cancelAnimationFrame(animId);
  }, [config.grain]);

  // Periodic random tracking / tape crease glitch pulse
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const triggerRandomGlitch = () => {
      const delay = 3500 + Math.random() * 5000;
      timeout = setTimeout(() => {
        setGlitchTransform({
          x: (Math.random() - 0.5) * 4 * (config.jitter || 1),
          skew: (Math.random() - 0.5) * 0.4,
        });
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 120 + Math.random() * 180);
        triggerRandomGlitch();
      }, delay);
    };
    triggerRandomGlitch();
    return () => clearTimeout(timeout);
  }, [config.jitter]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className || ""}`}
      style={{
        position: "relative",
        filter: `saturate(${config.saturation}) brightness(${config.exposure})`,
        ...style,
      }}
    >
      {/* ── Content Layer (Keeps all interactive links/buttons alive) ── */}
      <div
         className="relative w-full h-full transition-transform duration-75"
         style={{
           transform: glitchActive
             ? `translateX(${glitchTransform.x}px) skewX(${glitchTransform.skew}deg)`
             : "none",
        }}
      >
        {children}
      </div>

      {/* ── VHS OVERLAYS LAYER (Pointer-events none) ── */}
      <div className="pointer-events-none absolute inset-0 z-40 select-none overflow-hidden" aria-hidden="true">
        
        {/* 1. CRT Scanlines Pattern */}
        <div
          className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.45) 0px,
              rgba(0, 0, 0, 0.45) 1.5px,
              transparent 1.5px,
              transparent 3px
            )`,
            opacity: config.scanlines,
          }}
        />

        {/* 2. Slow AC Rolling Hum Bar */}
        <div
          className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent pointer-events-none"
          style={{
            animation: `vhsRollingBar ${10 / (config.speed || 1)}s linear infinite`,
          }}
        />

        {/* 3. Real-time Animated Grain Canvas */}
        <canvas
          ref={noiseCanvasRef}
          className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none"
          style={{
            opacity: (config.grain ?? 0.25) * 2.2,
          }}
        />

        {/* 4. Chromatic Aberration Edge Glow (Bloom) */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
          style={{
            boxShadow: `inset ${config.aberration}px 0 0 rgba(255, 0, 0, 0.25), inset -${config.aberration}px 0 0 rgba(0, 240, 255, 0.25)`,
            opacity: config.bloom,
          }}
        />

        {/* 5. Head Switching Crease Distortion at Bottom */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent"
          style={{
            height: `${(config.switchingHeight || 0.005) * 100 * 5}%`,
            opacity: config.switching,
          }}
        />

        {/* 6. CRT Vignette Curvature Frame */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 100px rgba(0,0,0,0.6)",
            opacity: Math.max(config.vignette ?? 0.05, 0.2),
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes vhsRollingBar {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(600%);
          }
        }
      `}</style>
    </div>
  );
}

export default VHS;
