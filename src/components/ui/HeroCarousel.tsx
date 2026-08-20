"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/hero-1-new.jpg",
    link: "/new-arrivals",
    alt: "New arrivals — unisex streetwear drop",
    title: "NEW ARRIVALS",
    subtitle: "UNISEX ARCHIVE STREETWEAR",
  },
  {
    id: 2,
    image: "/hero-2-editorial.jpg",
    link: "/bottomwears",
    alt: "Cargo and streetwear — tactical essentials",
    title: "CYBER CARGOS",
    subtitle: "TACTICAL ESSENTIALS BUILT TO LAST",
  },
  {
    id: 3,
    image: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    link: "/products",
    alt: "Raw selvedge denim — archive collection",
    title: "VINTAGE DENIM",
    subtitle: "RAW SELVEDGE ARCHIVE COLLECTION",
  },
];

const SLIDE_DURATION = 5000;

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function HeroCarousel() {
  const [[page, direction], setPage] = useState([0, 0]);
  const shouldReduceMotion = useReducedMotion();

  const slideIndex = ((page % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  // Autoplay without pause-on-hover so it never gets stuck
  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setInterval(() => {
      paginate(1);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [page, shouldReduceMotion]);

  const slide = HERO_SLIDES[slideIndex];

  return (
    <div
      className="w-full relative flex-1 flex overflow-hidden select-none bg-y2k-gunmetal"
      role="region"
      aria-label="Hero image carousel"
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={shouldReduceMotion ? undefined : variants}
          initial={shouldReduceMotion ? { opacity: 0 } : "enter"}
          animate={shouldReduceMotion ? { opacity: 1 } : "center"}
          exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
          {/* Gradients to ensure text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-transparent to-transparent md:from-black/50" />
        </motion.div>
      </AnimatePresence>

      {/* Minimal UI layer overlaying the slider */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 md:p-14 pointer-events-none">
        
        {/* Top: slide indicators */}
        <div
          className="flex items-center gap-2 self-start md:self-end"
          role="tablist"
          aria-label="Slide navigation"
        >
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === slideIndex}
              aria-label={`Slide ${idx + 1} of ${HERO_SLIDES.length}`}
              onClick={() => {
                const diff = idx - slideIndex;
                if (diff !== 0) {
                   setPage([page + diff, diff > 0 ? 1 : -1]);
                }
              }}
              className={`pointer-events-auto h-[2px] transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 ${
                idx === slideIndex
                  ? "w-10 bg-white"
                  : "w-4 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Bottom Area: Text on Right, Button on Left (or stacked on mobile) */}
        <div className="flex flex-col-reverse md:flex-row items-start md:items-end justify-between w-full gap-8">
          
          {/* Button & Counter */}
          <div className="flex flex-col items-start gap-6">
            <Link
              href={slide.link}
              aria-label={`${slide.alt} — explore collection`}
              className="pointer-events-auto bg-white flex items-center gap-3 px-7 py-3.5 text-y2k-gunmetal text-[10px] uppercase tracking-[0.22em] font-bold hover:bg-y2k-ice hover:scale-[1.02] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              <span>Explore</span>
              <span className="w-4 h-px bg-y2k-gunmetal/60" aria-hidden="true" />
              <span aria-hidden="true">→</span>
            </Link>

            <span
              className="text-white/40 text-[10px] uppercase tracking-[0.22em] font-mono select-none"
              aria-live="polite"
              aria-atomic="true"
            >
              {String(slideIndex + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
            </span>
          </div>

          {/* Text Content (Right Aligned on Desktop) */}
          <motion.div 
            key={`text-${page}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-start md:items-end text-left md:text-right max-w-sm pointer-events-none"
          >
            <h2 className="font-display text-white text-3xl md:text-4xl lg:text-5xl uppercase tracking-[-0.04em] leading-none mb-3">
              {slide.title}
            </h2>
            <p className="text-white/70 text-[10px] uppercase tracking-[0.2em] leading-relaxed">
              {slide.subtitle}
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
