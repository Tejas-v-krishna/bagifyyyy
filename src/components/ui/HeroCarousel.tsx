"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/hero-1-new.jpg",
    title: "NEW ARRIVALS",
    subtitle: "DROP 01 · UNISEX APPAREL",
    link: "/new-arrivals",
    btnLabel: "SHOP NEW ARRIVALS",
  },
  {
    id: 2,
    image: "/hero-2-editorial.jpg",
    title: "CARGO & STREETWEAR",
    subtitle: "TACTICAL ESSENTIALS · UNISEX",
    link: "/bottomwears",
    btnLabel: "SHOP CARGOS & PANTS",
  },
  {
    id: 3,
    image: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    title: "RAW DENIM",
    subtitle: "SELVEDGE HARDWARE · UNISEX",
    link: "/products",
    btnLabel: "EXPLORE ALL DROPS",
  },
];

const SLIDE_DURATION = 5000; // 5 seconds per slide

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance every 5 seconds (paused on hover)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isHovered]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div 
      className="w-full relative flex-1 flex overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-8 md:p-12 z-10 pointer-events-none">
        
        {/* Progress / Navigation indicators (Top) */}
        <div className="flex justify-center gap-2.5 z-20 pointer-events-auto">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1 transition-all duration-300 ease-out cursor-pointer ${
                idx === currentSlide ? "w-12 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Text and Button (Bottom) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-8 pointer-events-auto w-full">
          <div className="max-w-xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentSlide}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-white/90 mb-2.5 drop-shadow-md">
                  {slide.subtitle}
                </p>
                <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] uppercase tracking-tighter text-white drop-shadow-lg leading-[0.85]">
                  {slide.title}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>

          <Link
            href={slide.link}
            className="btn-bagify flex md:inline-flex w-full md:w-auto items-center justify-center gap-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] py-4 md:py-5 px-8 md:px-12 backdrop-blur-sm hover:scale-[1.02] transition-transform shadow-xl cursor-pointer"
          >
            <span>{slide.btnLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
