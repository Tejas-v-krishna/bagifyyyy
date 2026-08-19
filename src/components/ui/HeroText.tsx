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
  const text = "CARRY THE VIBE";
  const words = text.split(" ");
  const isPreloaderFinished = useAppStore((state) => state.isPreloaderFinished);

  useGSAP(
    () => {
      // Set initial state
      gsap.set(".hero-char", { yPercent: 120, opacity: 0 });

      if (!isPreloaderFinished) return;

      // Animate to final state
      gsap.to(".hero-char", {
        yPercent: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.04,
        ease: "power4.out",
        delay: 0.1,
      });
    },
    { scope: containerRef, dependencies: [isPreloaderFinished] }
  );

  return (
    <h1
      ref={containerRef}
      className="font-display font-medium w-full text-center text-vibe-gradient uppercase tracking-[-0.08em] leading-[0.85] pt-8 md:pt-12 pb-4 select-none overflow-hidden flex flex-wrap justify-center px-4"
      style={{
        fontSize: "clamp(3.5rem, 12vw, 230px)",
        fontWeight: 500,
        lineHeight: 0.85,
        letterSpacing: "-0.06em",
      }}
    >
      {words.map((word, wordIdx) => (
        <span
          key={wordIdx}
          className="inline-block overflow-hidden align-top"
          style={{ paddingBottom: "0.1em", marginBottom: "-0.1em" }}
        >
          {word.split("").map((char, charIdx) => (
            <span
              key={charIdx}
              className="hero-char inline-block"
              style={{ opacity: 0 }}
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
