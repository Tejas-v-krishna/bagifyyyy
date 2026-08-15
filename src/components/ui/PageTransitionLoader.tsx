"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete and reset loader when route actually changes
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const doneTimer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 350);
      return () => clearTimeout(doneTimer);
    }
  }, [pathname]);

  // Intercept all internal Link / button clicks to trigger instantaneous smooth progress loading
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Only trigger for internal links that navigate away from current path
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // If clicking current exact url, don't trigger
        const currentUrl = window.location.pathname;
        if (href === currentUrl) return;

        setIsNavigating(true);
        setProgress(25);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 85;
            }
            return prev + Math.floor(Math.random() * 15) + 8;
          });
        }, 120);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <>
      {/* Top Luxury Progress Line */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] bg-transparent"
          >
            <motion.div
              className="h-full bg-y2k-gunmetal shadow-[0_0_8px_rgba(40,50,63,0.6)]"
              style={{
                width: `${progress}%`,
                transition: "width 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
