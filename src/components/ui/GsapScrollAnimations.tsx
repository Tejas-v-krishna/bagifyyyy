"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

export default function GsapScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const init = () => {
      // Clean up previous triggers created by this component
      triggers.forEach((st) => st.kill());
      triggers.length = 0;

      // ── 1. CSS background parallax ────────────────────────────────────────
      document.querySelectorAll<HTMLElement>("[data-parallax-bg]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed ?? "0.15");
        const tween = gsap.fromTo(
          el,
          { backgroundPositionY: `${50 + speed * 40}%` },
          {
            backgroundPositionY: `${50 - speed * 40}%`,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
              invalidateOnRefresh: true,
            },
          }
        );
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      });

      // ── 2. Image parallax ─────────────────────────────────────────────────
      document.querySelectorAll<HTMLElement>("[data-parallax-wrap]").forEach((container) => {
        const img = container.querySelector<HTMLElement>("img");
        if (!img) return;

        const speed = parseFloat(container.dataset.parallaxSpeed ?? "1");
        const yAmt = Math.min(speed * 12, 16);

        const tween = gsap.fromTo(
          img,
          {
            scale: 1.3,
            yPercent: -yAmt,
            transformOrigin: "50% 50%",
            willChange: "transform",
          },
          {
            scale: 1.3,
            yPercent: yAmt,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
              invalidateOnRefresh: true,
            },
          }
        );
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      });

      // ── 3. Section scroll reveal ──────────────────────────────────────────
      document.querySelectorAll<HTMLElement>(".scroll-reveal").forEach((el) => {
        const tween = gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      });

      ScrollTrigger.refresh();
    };

    const timer = setTimeout(init, 200);

    return () => {
      clearTimeout(timer);
      triggers.forEach((st) => st.kill());
    };
  }, [pathname]);

  return null;
}
