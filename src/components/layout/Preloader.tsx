"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import Image from "next/image";

import { usePathname } from "next/navigation";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

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

    // Keep the animated wordmark visible long enough for the motion to register.
    const timer = setTimeout(() => {
      setIsLoading(false);
      setPreloaderFinished(true);
    }, 3200);

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
            transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] }
          }}
          className="fixed inset-0 z-[9999] bg-y2k-ice flex items-center justify-center pointer-events-none origin-bottom"
        >
          <motion.div
            initial={{ filter: "blur(20px)", opacity: 0, scale: 0.9 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-64 h-16 md:w-80 md:h-20"
          >
            <Image
              src="/bagifyyyy-wordmark-animated.gif"
              alt="Bagifyyyy Logo"
              width={845}
              height={219}
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
