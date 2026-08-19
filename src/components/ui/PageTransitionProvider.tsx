"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isStudioRoute = pathname?.startsWith("/studio") || pathname?.startsWith("/admin");

  useEffect(() => {
    // Reset scroll smoothly to top on every route change
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (typeof window !== "undefined" && window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }

    if (isStudioRoute || !containerRef.current) return;

    // Trigger deterministic GSAP Blur Fade-In on the container element on storefront route changes
    gsap.killTweensOf(containerRef.current);
    gsap.fromTo(
      containerRef.current,
      {
        opacity: 0,
        filter: "blur(24px)",
        y: 28,
        scale: 0.985,
      },
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: "power2.out",
        clearProps: "filter,transform,willChange",
      }
    );
  }, [pathname, isStudioRoute]);

  if (isStudioRoute) {
    return <>{children}</>;
  }

  return (
    <div
      key={pathname}
      ref={containerRef}
      className="page-landing-animate w-full flex-1 flex flex-col"
    >
      {children}
    </div>
  );
}
