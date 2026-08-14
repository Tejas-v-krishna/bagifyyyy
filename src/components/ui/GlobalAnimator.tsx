"use client";

import { useEffect, useRef } from "react";
import { animate, splitText, stagger } from "animejs";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

export default function GlobalAnimator() {
  const pathname = usePathname();
  const isPreloaderFinished = useAppStore((state) => state.isPreloaderFinished);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isPreloaderFinished) return;

    // Clean up old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;

            // Make the element visible
            el.style.opacity = "1";

            const hasClip =
              el.classList.contains("bg-clip-text") ||
              el.querySelector(".bg-clip-text") !== null ||
              el.children.length > 0;

            let split: any = null;
            if (!hasClip) {
              try {
                split = splitText(el, { chars: { wrap: "clip" } });
              } catch (e) {}
            }

            if (split && split.chars && split.chars.length > 0) {
              animate(split.chars, {
                y: ["100%", "0%"],
                opacity: [0, 1],
                duration: 1000,
                ease: "outQuart",
                delay: stagger(30),
                loop: false,
              });
            } else {
              animate(el, {
                y: ["30px", "0px"],
                opacity: [0, 1],
                duration: 900,
                ease: "outQuart",
                loop: false,
              });
            }

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );

    observerRef.current = observer;

    const timer = setTimeout(() => {
      // 1. Text elements (scroll triggered)
      const texts = document.querySelectorAll<HTMLElement>(
        '[data-animate="text-up"], [data-animate="text-down"], [data-animate="text-blur"]'
      );
      texts.forEach((el) => {
        el.style.opacity = "0";
        observer.observe(el);
      });

      // 2. Buttons (hover triggered)
      const buttons = document.querySelectorAll<HTMLElement>(
        '[data-animate="button"]'
      );
      buttons.forEach((btn) => {
        if ((btn as any)._isAnimatedButton) return;
        (btn as any)._isAnimatedButton = true;

        let split: any;
        try {
          split = splitText(btn, { chars: { wrap: "clip" } });
        } catch (e) {}

        const handleMouseEnter = () => {
          if ((btn as any)._isAnimating) return;
          if (split && split.chars && split.chars.length > 0) {
            (btn as any)._isAnimating = true;
            animate(split.chars, {
              y: [
                { to: "-100%", duration: 250, ease: "in(2)" },
                { to: "100%", duration: 1 },
                { to: "0%", duration: 250, ease: "out(2)" },
              ],
              delay: stagger(25),
              loop: false,
            });
            const totalDuration = 500 + split.chars.length * 25;
            setTimeout(() => {
              (btn as any)._isAnimating = false;
            }, totalDuration);
          }
        };

        btn.addEventListener("mouseenter", handleMouseEnter);
        (btn as any)._hoverHandler = handleMouseEnter;
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) observerRef.current.disconnect();

      const buttons = document.querySelectorAll<HTMLElement>(
        '[data-animate="button"]'
      );
      buttons.forEach((btn) => {
        if ((btn as any)._hoverHandler) {
          btn.removeEventListener("mouseenter", (btn as any)._hoverHandler);
        }
      });
    };
  }, [pathname, isPreloaderFinished]);

  return null;
}
