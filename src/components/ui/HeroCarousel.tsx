"use client";

import { useState, useEffect, useReducer } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/hero-1-new.jpg",
    link: "/new-arrivals",
    alt: "New arrivals — unisex streetwear drop",
  },
  {
    id: 2,
    image: "/hero-2-editorial.jpg",
    link: "/bottomwears",
    alt: "Cargo and streetwear — tactical essentials",
  },
  {
    id: 3,
    image: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    link: "/products",
    alt: "Raw selvedge denim — archive collection",
  },
];

const SLIDE_DURATION = 7000; // 7s — unhurried, premium

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // WCAG 2.3.3: disable auto-advance when prefers-reduced-motion is set
  useEffect(() => {
    if (isHovered || shouldReduceMotion) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isHovered, shouldReduceMotion]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div
      className="w-full relative flex-1 flex overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Hero image carousel"
    >
      {/* Slide imagery */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
          {/* Subtle gradient — bottom for CTA legibility only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
        </motion.div>
      </AnimatePresence>

      {/* Minimal UI layer */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 md:p-14 pointer-events-none">

        {/* Top: slide indicators */}
        <div
          className="flex items-center gap-2 self-end"
          role="tablist"
          aria-label="Slide navigation"
        >
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === currentSlide}
              aria-label={`Slide ${idx + 1} of ${HERO_SLIDES.length}`}
              onClick={() => setCurrentSlide(idx)}
              className={`pointer-events-auto h-[2px] transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 ${
                idx === currentSlide
                  ? "w-10 bg-white"
                  : "w-4 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Bottom: single minimal glass CTA */}
        <div className="flex items-end justify-between">
          {/* Glass pill link */}
          <Link
            href={slide.link}
            aria-label={`${slide.alt} — explore collection`}
            className="pointer-events-auto glass-pill flex items-center gap-3 px-6 py-3 text-white text-[10px] uppercase tracking-[0.22em] hover:bg-white/20 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <span>Explore</span>
            <span className="w-4 h-px bg-white/60" aria-hidden="true" />
            <span aria-hidden="true">→</span>
          </Link>

          {/* Slide counter */}
          <span
            className="text-white/40 text-[10px] uppercase tracking-[0.22em] font-mono select-none"
            aria-live="polite"
            aria-atomic="true"
          >
            {String(currentSlide + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
