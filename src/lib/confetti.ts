"use client";

import confetti from "canvas-confetti";

interface ClickCoord {
  clientX?: number;
  clientY?: number;
}

/**
 * Normalizes screen client (x, y) to viewport ratio (0..1) for canvas-confetti.
 */
function getNormalizedOrigin(e?: ClickCoord | null): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0.5, y: 0.5 };
  if (!e || typeof e.clientX !== "number" || typeof e.clientY !== "number") {
    return { x: 0.5, y: 0.6 };
  }
  return {
    x: Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth)),
    y: Math.max(0.05, Math.min(0.95, e.clientY / window.innerHeight)),
  };
}

/**
 * Joyful Piñata explosion!
 * Spits out vibrant multi-colored street/Y2K confetti pieces with dynamic spread & gravity.
 */
export function triggerPinataBurst(e?: ClickCoord | null) {
  if (typeof window === "undefined") return;

  const origin = getNormalizedOrigin(e);

  // Vibrant Y2K street palette: Hot Pink, Electric Lime, Cyber Yellow, Cyan, Violet, Gold
  const pinataColors = ["#FF007A", "#00F0FF", "#FFE600", "#10B981", "#8B5CF6", "#FF6B00", "#EC4899"];

  // Stage 1: Sharp central burst
  confetti({
    particleCount: 42,
    spread: 60,
    startVelocity: 35,
    origin,
    colors: pinataColors,
    ticks: 200,
    gravity: 1.1,
    scalar: 0.9,
    disableForReducedMotion: true,
  });

  // Stage 2: Wider festive pop slightly after
  setTimeout(() => {
    confetti({
      particleCount: 28,
      spread: 100,
      startVelocity: 25,
      origin,
      colors: pinataColors,
      ticks: 180,
      gravity: 0.95,
      scalar: 0.75,
      shapes: ["circle", "square"],
      disableForReducedMotion: true,
    });
  }, 75);
}

/**
 * Celebratory Sparkle Burst for promo codes & coupons!
 * Golden, emerald, and holographic sparks celebrating a discount.
 */
export function triggerPromoSuccessBurst(e?: ClickCoord | null) {
  if (typeof window === "undefined") return;

  const origin = getNormalizedOrigin(e);
  const promoColors = ["#10B981", "#34D399", "#F59E0B", "#FBBF24", "#059669", "#FFFFFF"];

  confetti({
    particleCount: 36,
    spread: 70,
    startVelocity: 30,
    origin,
    colors: promoColors,
    ticks: 160,
    gravity: 1.0,
    scalar: 0.85,
    shapes: ["circle", "square"],
    disableForReducedMotion: true,
  });
}
