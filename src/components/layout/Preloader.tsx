"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

import { usePathname } from "next/navigation";

export default function Preloader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const setPreloaderFinished = useAppStore(state => state.setPreloaderFinished);
  const isDashboard = pathname?.startsWith("/studio") || pathname?.startsWith("/admin");

  useEffect(() => {
    // Studio/admin or reduced motion never delays downstream animations
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isDashboard || prefersReducedMotion) {
      setIsLoading(false);
      setPreloaderFinished(true);
      return;
    }

    // Atmospheric brand reveal (snappy 600ms reveal)
    const timer = setTimeout(() => {
      setIsLoading(false);
      setPreloaderFinished(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [isDashboard, setPreloaderFinished]);

  if (isDashboard) {
    return null;
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ 
            y: "100%",
            transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] }
          }}
          className="fixed inset-0 z-[9999] bg-y2k-ice flex items-center justify-center pointer-events-none origin-bottom"
        >
          <motion.div
            initial={{ filter: "blur(20px)", opacity: 0, scale: 0.9 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="relative w-64 h-16 md:w-80 md:h-20"
          >
            <img
              src="/bagifyyyy-wordmark-animated.gif"
              alt="Bagifyyyy Logo"
              width={845}
              height={219}
              fetchPriority="high"
              className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(36,55,76,0.16)]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
