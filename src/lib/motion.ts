"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared motion utilities for the interaction kit.
 *
 * Every effect in the kit is opt-in: it no-ops on coarse pointers (where hover
 * does not exist) and when the visitor has asked their OS to reduce motion
 * (WCAG 2.3.3), matching the site-wide contract already declared in globals.css.
 */

/** One-shot check for the user's reduced-motion preference. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** One-shot check for a coarse (touch) pointer. */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * True only when rich pointer effects are safe to run: a fine pointer is
 * present and the visitor has not requested reduced motion.
 */
export function canUsePointerEffects(): boolean {
  return !isCoarsePointer() && !prefersReducedMotion();
}

/** Reactive reduced-motion preference, for branching during render. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

interface InViewOptions {
  /** Stop observing after the first intersection. Defaults to true. */
  once?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Reports whether an element has entered the viewport. Falls back to `true`
 * when IntersectionObserver is unavailable so content never stays hidden.
 */
export function useInView<T extends Element>(options: InViewOptions = {}) {
  const { once = true, rootMargin = "0px 0px -12% 0px", threshold = 0.2 } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      // Deferred so the fallback never sets state synchronously in the effect.
      const timer = window.setTimeout(() => setInView(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}

export type RafThrottled<A extends unknown[]> = ((...args: A) => void) & { cancel: () => void };

/**
 * Coalesces high-frequency events (pointermove, scroll) down to one call per
 * animation frame, so pointer effects never queue redundant layout reads.
 */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void): RafThrottled<A> {
  let frame = 0;
  let lastArgs = [] as unknown as A;

  const invoke = () => {
    frame = 0;
    fn(...lastArgs);
  };

  const throttled = (...args: A) => {
    lastArgs = args;
    if (!frame) frame = window.requestAnimationFrame(invoke);
  };

  throttled.cancel = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };

  return throttled;
}

/** Clamps a number into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
