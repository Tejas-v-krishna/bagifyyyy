"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/hero-1-new.jpg",
    title: "NEW ARRIVALS",
    subtitle: "Explore the latest archive pieces",
    link: "/topwears",
    btnLabel: "SHOP MENS",
  },
  {
    id: 2,
    image: "/hero-2.jpg",
    title: "CURATED GRAILS",
    subtitle: "Sourced vintage & heavy hardware",
    link: "/bottomwears",
    btnLabel: "SHOP WOMENS",
  },
  {
    id: 3,
    image: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg", // From instagram section
    title: "RAW DENIM",
    subtitle: "Japanese Selvedge Trucker Fittings",
    link: "/topwears",
    btnLabel: "ACQUIRE NOW",
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div 
      className="w-full relative flex-1 flex overflow-hidden border-t border-y2k-gunmetal/15"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-8 md:p-12 z-10 pointer-events-none">
        
        {/* Progress / Navigation indicators (Moved to Top) */}
        <div className="flex justify-center gap-2 z-20 pointer-events-auto">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1 transition-all duration-500 ease-out ${
                idx === currentSlide ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-white/90 mb-3 drop-shadow-md">
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
            className="btn-bagify flex md:inline-flex w-full md:w-auto items-center justify-center gap-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] py-4 md:py-5 px-8 md:px-12 backdrop-blur-sm hover:scale-[1.02] transition-transform shadow-xl"
          >
            <span>{slide.btnLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
