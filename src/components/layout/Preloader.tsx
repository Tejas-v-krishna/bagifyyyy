"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

import { usePathname } from "next/navigation";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** How long the brand cover holds before revealing the store. */
const PRELOADER_HOLD_MS = 3200;
/** Reduced-motion hold: static logo only, then an instant cut (no animation). */
const REDUCED_HOLD_MS = 1200;

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
    // Studio/admin never delays downstream animations.
    if (isDashboard) {
      setPreloaderFinished(true);
      return;
    }

    // Full brand intro on every fresh load. Client-side route changes never
    // re-run this, so navigation stays instant.
    const timer = setTimeout(() => {
      setIsLoading(false);
      setPreloaderFinished(true);
    }, prefersReducedMotion ? REDUCED_HOLD_MS : PRELOADER_HOLD_MS);

    return () => clearTimeout(timer);
  }, [isDashboard, prefersReducedMotion, setPreloaderFinished]);

  if (isDashboard) {
    return null;
  }

  // Reduced motion still gets the brand cover (static logo, instant cut) —
  // never a fully skipped preloader.
  if (prefersReducedMotion) {
    if (!isLoading) return null;
    return (
      <div className="fixed inset-0 z-[9999] bg-[#ebf1f6] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bagifyyyy-wordmark.webp"
          alt="Bagifyyyy Logo"
          width={384}
          height={100}
          className="h-[4.7rem] w-72 object-contain md:h-[6.25rem] md:w-96"
        />
      </div>
    );
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
          className="fixed inset-0 z-[9999] bg-[#ebf1f6] flex items-center justify-center pointer-events-none origin-bottom"
        >
          <motion.div
            initial={{ filter: "blur(20px)", opacity: 0, scale: 0.94 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-72 h-[4.7rem] md:w-96 md:h-[6.25rem]"
          >
            {/* Animated wordmark: the footer chrome loop, keyed through the
                logo silhouette via mask so it plays instantly with zero
                network-dependent gif frames. Static logo stays underneath
                until the loop is playing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bagifyyyy-wordmark.webp"
              alt="Bagifyyyy Logo"
              width={384}
              height={100}
              fetchPriority="high"
              draggable={false}
              className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(36,55,76,0.16)]"
            />
            <video
              className="wordmark-video-mask absolute inset-0 block h-full w-full object-contain"
              src="/header-wordmark.mp4"
              aria-hidden="true"
              tabIndex={-1}
              loop
              muted
              playsInline
              autoPlay
              preload="auto"
              disablePictureInPicture
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
