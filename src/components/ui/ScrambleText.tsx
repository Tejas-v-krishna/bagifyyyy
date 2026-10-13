"use client";

import { useCallback, useEffect, useRef, useState, type ElementType } from "react";
import { prefersReducedMotion, useInView } from "@/lib/motion";

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$*<>/\\";

export interface ScrambleTextProps {
  text: string;
  /** Element to render, e.g. `"h2"`. Defaults to `"span"`. */
  as?: ElementType;
  className?: string;
  /** What starts the decode. Defaults to scrolling into view. */
  trigger?: "view" | "hover" | "mount";
  /** Total decode time in ms. */
  duration?: number;
  /** Glyphs cycled through before each character resolves. */
  charset?: string;
}

/**
 * Y2K decode/glitch text. Characters resolve left to right while the tail
 * cycles random glyphs. The real string is exposed to assistive tech via a
 * visually hidden node, and the effect collapses to plain text under
 * `prefers-reduced-motion`.
 */
export default function ScrambleText({
  text,
  as: Tag = "span",
  className = "",
  trigger = "view",
  duration = 900,
  charset = DEFAULT_CHARSET,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);
  const { ref, inView } = useInView<HTMLElement>({ once: true });

  const run = useCallback(() => {
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const length = text.length;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(progress * length);
      let out = "";

      for (let i = 0; i < length; i += 1) {
        const target = text[i];
        if (target === " ") {
          out += " ";
        } else if (i < revealed) {
          out += target;
        } else {
          out += charset[Math.floor(Math.random() * charset.length)];
        }
      }

      setDisplay(out);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
        setDisplay(text);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [text, duration, charset]);

  useEffect(() => {
    if (trigger !== "mount") return;
    const frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [trigger, run]);

  useEffect(() => {
    if (trigger !== "view" || !inView) return;
    const frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [trigger, inView, run]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return (
    <Tag ref={ref} className={className} onMouseEnter={trigger === "hover" ? run : undefined}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </Tag>
  );
}
