"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

export default function GlobalAnimator() {
  const pathname = usePathname();
  const isPreloaderFinished = useAppStore((state) => state.isPreloaderFinished);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isPreloaderFinished) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;

            animate(el, {
              y: ["20px", "0px"],
              opacity: [0, 1],
              filter: ["blur(12px)", "blur(0px)"],
              duration: 650,
              ease: "outQuart",
              loop: false,
              complete: () => {
                el.style.filter = "";
                el.style.transform = "";
              },
            });

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 40px 0px" }
    );

    observerRef.current = observer;

    const elements = document.querySelectorAll<HTMLElement>(
      '[data-animate="text-up"], [data-animate="scroll-reveal"]'
    );

    elements.forEach((el) => {
      if (el.dataset.animated === "true") return;
      el.dataset.animated = "true";
      el.style.opacity = "0";
      el.style.filter = "blur(12px)";
      el.style.transform = "translateY(20px)";
      observer.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [pathname, isPreloaderFinished]);

  return null;
}
