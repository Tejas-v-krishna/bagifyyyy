"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function SmoothCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

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
    let isPressed = false;

    // Use GSAP quickTo for ultra-smooth buttery inertia tracking
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.18, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.18, ease: "power3.out" });

    // Center icon offset (32px width/height -> offset 2px to align pointer tip)
    gsap.set(cursor, { xPercent: 0, yPercent: 0, opacity: 0 });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.to(cursor, { opacity: 1, duration: 0.25, ease: "power2.out" });
      }

      xTo(e.clientX);
      yTo(e.clientY);

      // Check clickable / hover target
      const target = e.target as HTMLElement | null;
      if (target) {
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
          window.getComputedStyle(target).cursor === "pointer";

        if (isClickable && !isHovered) {
          isHovered = true;
          gsap.to(icon, {
            scale: 1.25,
            rotation: 6,
            duration: 0.35,
            ease: "back.out(2)",
          });
        } else if (!isClickable && isHovered) {
          isHovered = false;
          gsap.to(icon, {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      }
    };

    const handleMouseDown = () => {
      isPressed = true;
      gsap.to(icon, {
        scale: 0.88,
        duration: 0.15,
        ease: "power2.out",
      });
    };

    const handleMouseUp = () => {
      isPressed = false;
      gsap.to(icon, {
        scale: isHovered ? 1.25 : 1,
        duration: 0.25,
        ease: "back.out(1.8)",
      });
    };

    const handleMouseLeave = () => {
      isVisible = false;
      gsap.to(cursor, { opacity: 0, duration: 0.25, ease: "power2.out" });
    };

    const handleMouseEnter = () => {
      isVisible = true;
      gsap.to(cursor, { opacity: 1, duration: 0.25, ease: "power2.out" });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
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
        className="relative w-8 h-8 -translate-x-[2px] -translate-y-[2px] transition-filter duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
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
