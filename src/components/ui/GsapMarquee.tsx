"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function GsapMarquee() {
  const container = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // GSAP animation for the sparkle icons - scoped to container
    gsap.to(".sparkle-icon", {
      rotation: -360,
      repeat: -1,
      duration: 8,
      ease: "none",
    });

    // Smooth seamless marquee - scoped to this component only
    // Track contains 4 identical copies (50% = 2 copies width), so looping -50% is seamless
    if (trackRef.current) {
      gsap.to(trackRef.current, {
        xPercent: -50,
        repeat: -1,
        duration: 25,
        ease: "none",
      });
    }
  }, { scope: container });

  return (
    <div 
      ref={container}
      className="w-full py-4 md:py-6 bg-y2k-gunmetal text-y2k-ice border-y border-y2k-slate flex items-center overflow-hidden relative -rotate-1 scale-105 my-16 shadow-lg"
    >
      <div
        ref={trackRef}
        className="flex w-max whitespace-nowrap relative z-10 will-change-transform"
        style={{ transform: "translateX(0)" }}
      >
        {/* 4 identical copies: track is 400% wide, translating -50% (2 copies) loops seamlessly with no gap on any viewport */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 items-center text-3xl md:text-5xl font-display font-light uppercase tracking-tighter shrink-0 px-4" aria-hidden={i !== 0}>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex gap-8 items-center shrink-0">
                <span>1/1 ARCHIVE</span>
                <Image src="/sparkle.svg" alt="sparkle" width={64} height={64} className="sparkle-icon w-12 h-12 md:w-16 md:h-16 opacity-80" />
                <span>NO RESTOCKS</span>
                <Image src="/sparkle.svg" alt="sparkle" width={64} height={64} className="sparkle-icon w-12 h-12 md:w-16 md:h-16 opacity-80" />
                <span>SECURE THE BAG</span>
                <Image src="/sparkle.svg" alt="sparkle" width={64} height={64} className="sparkle-icon w-12 h-12 md:w-16 md:h-16 opacity-80" />
                <span>CURATED HEAT</span>
                <Image src="/sparkle.svg" alt="sparkle" width={64} height={64} className="sparkle-icon w-12 h-12 md:w-16 md:h-16 opacity-80" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
