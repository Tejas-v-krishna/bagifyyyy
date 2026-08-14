"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const isPreloaderFinished = useAppStore((state) => state.isPreloaderFinished);

  useEffect(() => {
    // Initialize Lenis with optimized e-commerce settings
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    // Synchronize ScrollTrigger with Lenis
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP ticker with healthy lag smoothing
    function onFrame(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(onFrame);
    // Allow standard lag smoothing (do NOT use 0 which freezes when idle)
    gsap.ticker.lagSmoothing(500, 33);

    // Refresh dimensions on window resize and image loads
    const handleResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("load", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
      gsap.ticker.remove(onFrame);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  // Whenever the preloader finishes or route changes, recalculate scroll dimensions
  useEffect(() => {
    if (lenisRef.current) {
      const timer = setTimeout(() => {
        lenisRef.current?.resize();
        ScrollTrigger.refresh();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPreloaderFinished, pathname]);

  return <>{children}</>;
}
