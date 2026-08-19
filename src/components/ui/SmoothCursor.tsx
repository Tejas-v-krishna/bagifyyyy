"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function SmoothCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const wiggleTlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const cursor = cursorRef.current;
    const icon = iconRef.current;
    if (!cursor || !icon) return;

    let isVisible = false;
    let isHovered = false;

    // Use GSAP quickTo for ultra-smooth buttery inertia tracking
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.16, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.16, ease: "power3.out" });

    gsap.set(cursor, { xPercent: 0, yPercent: 0, opacity: 0 });

    const startWiggle = () => {
      if (wiggleTlRef.current) wiggleTlRef.current.kill();

      // Compact small cursor scale (0.72x) with stylish micro wiggle
      gsap.to(icon, {
        scale: 0.72,
        duration: 0.25,
        ease: "power2.out",
      });

      const tl = gsap.timeline({ repeat: -1 });
      tl.to(icon, { rotation: -8, duration: 0.12, ease: "sine.inOut" })
        .to(icon, { rotation: 8, duration: 0.14, ease: "sine.inOut" })
        .to(icon, { rotation: -5, duration: 0.12, ease: "sine.inOut" })
        .to(icon, { rotation: 5, duration: 0.12, ease: "sine.inOut" })
        .to(icon, { rotation: 0, duration: 0.14, ease: "sine.inOut" });

      wiggleTlRef.current = tl;
    };

    const stopWiggle = () => {
      if (wiggleTlRef.current) {
        wiggleTlRef.current.kill();
        wiggleTlRef.current = null;
      }

      gsap.to(icon, {
        scale: 1,
        rotation: 0,
        duration: 0.25,
        ease: "power2.out",
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.to(cursor, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }

      xTo(e.clientX);
      yTo(e.clientY);

      const target = e.target as Element | null;
      if (target && typeof target.closest === "function") {
        const isClickable =
          target.closest("a") ||
          target.closest("button") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea") ||
          target.closest("[role='button']") ||
          target.closest(".product-card") ||
          target.closest("[data-card]") ||
          target.closest(".cursor-pointer") ||
          target.closest(".btn-bagify") ||
          window.getComputedStyle(target).cursor === "pointer";

        if (isClickable && !isHovered) {
          isHovered = true;
          startWiggle();
        } else if (!isClickable && isHovered) {
          isHovered = false;
          stopWiggle();
        }
      }
    };

    const handleMouseDown = () => {
      gsap.to(icon, {
        scale: isHovered ? 0.6 : 0.85,
        duration: 0.12,
        ease: "power2.out",
      });
    };

    const handleMouseUp = () => {
      if (isHovered) {
        gsap.to(icon, {
          scale: 0.72,
          duration: 0.2,
          ease: "power2.out",
        });
      } else {
        gsap.to(icon, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
      gsap.to(cursor, { opacity: 0, duration: 0.2, ease: "power2.out" });
    };

    const handleMouseEnter = () => {
      isVisible = true;
      gsap.to(cursor, { opacity: 1, duration: 0.2, ease: "power2.out" });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      if (wiggleTlRef.current) wiggleTlRef.current.kill();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[999999] will-change-transform hidden md:block"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    >
      <div
        ref={iconRef}
        className="relative w-8 h-8 -translate-x-[2px] -translate-y-[2px] drop-shadow-[0_3px_10px_rgba(0,0,0,0.22)]"
      >
        <Image
          src="/cursor-32.png"
          alt="cursor"
          width={32}
          height={32}
          className="object-contain w-full h-full select-none pointer-events-none"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
