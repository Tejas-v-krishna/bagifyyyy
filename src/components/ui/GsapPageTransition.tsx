"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";

export default function GsapPageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const curtainRef = useRef<HTMLDivElement | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip initial landing as Preloader handles the very first visit
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (!curtainRef.current) return;

    // Reset scroll position instantaneously at peak of curtain coverage
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (typeof window !== "undefined" && window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }

    // GSAP Reveal: Curtain moves smoothly UP and exits off the top at a cinematic luxury pace
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
      });

      tl.set(curtainRef.current, { display: "block", pointerEvents: "all" })
        .fromTo(
          curtainRef.current,
          { yPercent: 0 },
          {
            yPercent: -100,
            duration: 0.75,
            ease: "power3.inOut",
          }
        )
        .set(curtainRef.current, { display: "none", pointerEvents: "none" });
    });

    return () => ctx.revert();
  }, [pathname, searchParams]);

  // Global link click listener to trigger the solid curtain moving UP from bottom
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

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
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        if (!curtainRef.current) return;

        gsap.killTweensOf(curtainRef.current);
        gsap.set(curtainRef.current, { display: "block", pointerEvents: "all" });

        gsap.fromTo(
          curtainRef.current,
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: 0.65,
            ease: "power3.inOut",
          }
        );
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, []);

  return (
    <div
      ref={curtainRef}
      className="fixed inset-0 z-[99998] pointer-events-none hidden w-full h-full bg-[#232D3B] overflow-hidden shadow-2xl"
    >
      {/* Sleek bottom hairline highlight on curtain */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}
