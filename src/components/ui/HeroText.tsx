"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAppStore } from "@/store/useAppStore";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function HeroText() {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const text = "WEAR IT OUT";
  const words = text.split(" ");
  const isPreloaderFinished = useAppStore((state) => state.isPreloaderFinished);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (!isPreloaderFinished) {
        gsap.set(".hero-char", { yPercent: 100, opacity: 0 });
        return;
      }

      // Animate characters up smoothly with luxury easing
      gsap.fromTo(
        ".hero-char",
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.035,
          ease: "power4.out",
          delay: 0.1,
        }
      );
    },
    { scope: containerRef, dependencies: [isPreloaderFinished] }
  );

  return (
    <h1
      ref={containerRef}
      className="font-display font-medium w-full text-center text-y2k-gunmetal uppercase tracking-[-0.05em] leading-[0.85] pt-2 md:pt-4 pb-1 md:pb-3 select-none whitespace-nowrap overflow-hidden px-2 shrink-0"
      style={{
        fontSize: "clamp(1.75rem, 8.8vw, 210px)",
        fontWeight: 500,
        lineHeight: 0.85,
        letterSpacing: "-0.05em",
      }}
    >
      {words.map((word, wordIdx) => (
        <span
          key={wordIdx}
          className="inline-block overflow-hidden align-top"
          style={{ paddingBottom: "0.08em", marginBottom: "-0.08em" }}
        >
          {word.split("").map((char, charIdx) => (
            <span
              key={charIdx}
              className="hero-char inline-block will-change-transform"
            >
              {char}
            </span>
          ))}
          {wordIdx < words.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </span>
      ))}
    </h1>
  );
}
