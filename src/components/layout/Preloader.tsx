"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import Image from "next/image";

import { usePathname } from "next/navigation";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** How long the brand cover holds before revealing the store. */
const PRELOADER_HOLD_MS = 3200;

export default function Preloader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const setPreloaderFinished = useAppStore(state => state.setPreloaderFinished);
  const isDashboard =
    pathname?.startsWith("/studio") ||
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/account";
  const isClient = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const prefersReducedMotion = isClient && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // Studio/admin or reduced motion never delays downstream animations
    if (isDashboard || prefersReducedMotion) {
      setPreloaderFinished(true);
      return;
    }

    // Full brand intro on every fresh load: the animated wordmark needs the
    // hold time to read. Client-side route changes never re-run this, so
    // navigation stays instant.
    const timer = setTimeout(() => {
      setIsLoading(false);
      setPreloaderFinished(true);
    }, PRELOADER_HOLD_MS);

    return () => clearTimeout(timer);
  }, [isDashboard, prefersReducedMotion, setPreloaderFinished]);

  if (isDashboard || prefersReducedMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ y: 0 }}
          exit={{
            y: "100%",
            transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] }
          }}
          className="fixed inset-0 z-[9999] bg-y2k-ice flex items-center justify-center pointer-events-none origin-bottom"
        >
          <motion.div
            initial={{ filter: "blur(20px)", opacity: 0, scale: 0.94 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-72 h-[4.7rem] md:w-96 md:h-[6.25rem]"
          >
            {/* Animated wordmark: a 3.5s, 428KB loop cut from the original GIF
                (was 4.2MB). unoptimized keeps the animation intact. */}
            <Image
              src="/bagifyyyy-wordmark-live.gif"
              alt="Bagifyyyy Logo"
              width={384}
              height={100}
              fetchPriority="high"
              unoptimized
              className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(36,55,76,0.16)]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
