'use client';

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import gsap from 'gsap';

/* Paths from Codrops sketch 021 — SVG Path Page Transition (Vertical).
   Edit them here: https://yqnn.github.io/svg-path-editor/ */
const PATHS = {
  step1: {
    unfilled: 'M 0 100 V 100 Q 50 100 100 100 V 100 z',
    inBetween: {
      curve1: 'M 0 100 V 50 Q 50 0 100 50 V 100 z',
    },
    filled: 'M 0 100 V 0 Q 50 0 100 0 V 100 z',
  },
  step2: {
    filled: 'M 0 0 V 100 Q 50 100 100 100 V 0 z',
    inBetween: {
      curve1: 'M 0 0 V 50 Q 50 0 100 50 V 0 z',
    },
    unfilled: 'M 0 0 V 0 Q 50 0 100 0 V 0 z',
  },
};

const SvgTransitionContext = createContext<(href: string) => void>(() => {});

export const useSvgPageTransition = () => useContext(SvgTransitionContext);

export default function SvgPathTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef<SVGPathElement>(null);
  const animatingRef = useRef(false);
  const pendingRevealRef = useRef(false);

  // Reveal (wipe exits upward) once the new route has rendered.
  useEffect(() => {
    if (!pendingRevealRef.current) return;
    pendingRevealRef.current = false;
    const overlayPath = pathRef.current;
    if (!overlayPath) {
      animatingRef.current = false;
      return;
    }
    gsap
      .timeline({ onComplete: () => (animatingRef.current = false) })
      .set(overlayPath, { attr: { d: PATHS.step2.filled } })
      .to(overlayPath, {
        duration: 0.2,
        ease: 'sine.in',
        attr: { d: PATHS.step2.inBetween.curve1 },
      })
      .to(overlayPath, {
        duration: 1,
        ease: 'power4',
        attr: { d: PATHS.step2.unfilled },
      });
  }, [pathname]);

  const transitionTo = useCallback(
    (href: string) => {
      if (animatingRef.current) return;
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        router.push(href);
        return;
      }
      const overlayPath = pathRef.current;
      if (!overlayPath) {
        router.push(href);
        return;
      }
      animatingRef.current = true;
      gsap
        .timeline()
        .set(overlayPath, { attr: { d: PATHS.step1.unfilled } })
        .to(
          overlayPath,
          {
            duration: 0.8,
            ease: 'power4.in',
            attr: { d: PATHS.step1.inBetween.curve1 },
          },
          0
        )
        .to(overlayPath, {
          duration: 0.2,
          ease: 'power1',
          attr: { d: PATHS.step1.filled },
          onComplete: () => {
            // Screen is fully covered — swap the route underneath.
            pendingRevealRef.current = true;
            router.push(href);
          },
        });
    },
    [router]
  );

  return (
    <SvgTransitionContext.Provider value={transitionTo}>
      {children}
      <svg
        className="pointer-events-none fixed inset-0 z-[9000] h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          vectorEffect="non-scaling-stroke"
          fill="#0a0a0a"
          d={PATHS.step1.unfilled}
        />
      </svg>
    </SvgTransitionContext.Provider>
  );
}
