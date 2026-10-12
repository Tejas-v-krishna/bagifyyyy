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

  const prevPathnameRef = useRef<string | null>(null);
  const isPopStateRef = useRef<boolean>(false);

  // Track popstate events (browser back/forward button, router.back())
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Next.js App Router sets history.scrollRestoration = 'manual'
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onPopState = () => {
      isPopStateRef.current = true;
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = pathname;
    const prevPath = prevPathnameRef.current;
    const wasPopState = isPopStateRef.current;
    isPopStateRef.current = false; // reset for subsequent navigations

    // If we're leaving a previous page, save its scroll position before switching
    // Note: scroll position is also saved on unmount/pagehide/beforeunload
    if (prevPath && prevPath !== currentPath) {
      // already saved in unmount/before-nav or we can retrieve current session value
    }

    // Determine target scroll position
    let targetY = 0;
    let shouldRestore = false;

    if (wasPopState && currentPath) {
      try {
        const saved = sessionStorage.getItem(`bagify_scroll_${currentPath}`);
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed > 0) {
            targetY = parsed;
            shouldRestore = true;
          }
        }
      } catch {
        // sessionStorage might be restricted
      }
    }

    const applyScroll = () => {
      if (shouldRestore) {
        if (window.__lenis) {
          window.__lenis.scrollTo(targetY, { immediate: true });
        } else {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        }
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        }
      }
    };

    // Apply scroll immediately
    applyScroll();

    // Re-check after layout settles (in case content took a frame to paint or resize)
    const restoreTimer = setTimeout(() => {
      if (shouldRestore) {
        applyScroll();
      }
    }, 50);

    const restoreTimer2 = setTimeout(() => {
      if (shouldRestore) {
        applyScroll();
      }
    }, 150);

    // Save current path for next route transition
    prevPathnameRef.current = currentPath;

    // Track scroll positions continuously or on scroll/nav
    const saveCurrentScroll = () => {
      if (!currentPath) return;
      const y = window.__lenis ? window.__lenis.scroll : (window.scrollY || document.documentElement.scrollTop || 0);
      try {
        sessionStorage.setItem(`bagify_scroll_${currentPath}`, String(y));
      } catch {}
    };

    // Save on beforeunload / pagehide
    window.addEventListener("pagehide", saveCurrentScroll);
    window.addEventListener("beforeunload", saveCurrentScroll);

    // Periodic or scroll debounced save
    let scrollTimeout: NodeJS.Timeout;
    const onScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveCurrentScroll, 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    if (isStudioRoute || !containerRef.current) {
      return () => {
        clearTimeout(restoreTimer);
        clearTimeout(restoreTimer2);
        clearTimeout(scrollTimeout);
        saveCurrentScroll();
        window.removeEventListener("pagehide", saveCurrentScroll);
        window.removeEventListener("beforeunload", saveCurrentScroll);
        window.removeEventListener("scroll", onScroll);
      };
    }

    // Trigger deterministic GSAP Fade-In on the container element on storefront
    // route changes. Kept to a fast opacity/y lift: the heavy blur+scale intro
    // added ~650ms of perceived latency to every navigation.
    gsap.killTweensOf(containerRef.current);
    gsap.fromTo(
      containerRef.current,
      {
        opacity: 0,
        y: 12,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.26,
        ease: "power2.out",
        clearProps: "transform,willChange",
      }
    );

    return () => {
      clearTimeout(restoreTimer);
      clearTimeout(restoreTimer2);
      clearTimeout(scrollTimeout);
      saveCurrentScroll();
      window.removeEventListener("pagehide", saveCurrentScroll);
      window.removeEventListener("beforeunload", saveCurrentScroll);
      window.removeEventListener("scroll", onScroll);
    };
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
