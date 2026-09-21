"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { syncCartHolds } from "@/lib/cartHolds";
import { syncCartHoldsAndApply, useCartStore } from "@/store/useCartStore";
import { showToast } from "@/lib/toast";

/** No interaction for this long and the bag goes back to the shop. */
const IDLE_RELEASE_MS = 3 * 60 * 1000;
/** Holding is refreshed at most this often while the shopper is active. */
const REFRESH_THROTTLE_MS = 60 * 1000;
const TICK_MS = 15 * 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "wheel"];

/**
 * Keeps the shopper's stock holds honest:
 * - active browsing refreshes the (5 minute) hold, throttled
 * - 3 minutes without any interaction releases the pieces back to the shop,
 *   with a notice; coming back re-holds silently when they are still free
 * - the checkout flow is exempt, so a payment is never released mid-flight
 */
export default function CartHoldSync() {
  const pathname = usePathname();
  const lastActivityRef = useRef(0);
  const lastRefreshRef = useRef(0);
  const releasedRef = useRef(false);
  const pathnameRef = useRef(pathname);

  // Keep the interval callback pointed at the current route without
  // re-creating timers on every navigation.
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Initial sync: a bag restored from storage regains its holds.
    const now = Date.now();
    lastActivityRef.current = now;
    lastRefreshRef.current = now;
    void syncCartHoldsAndApply();

    const markActive = () => {
      lastActivityRef.current = Date.now();
      if (releasedRef.current) {
        releasedRef.current = false;
        lastRefreshRef.current = Date.now();
        // Silent re-hold; if someone took the piece meanwhile the store
        // reconciliation will surface that instead.
        void syncCartHoldsAndApply();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }));
    document.addEventListener("visibilitychange", markActive);

    const unsubscribe = useCartStore.subscribe(() => {
      lastActivityRef.current = Date.now();
      if (releasedRef.current) {
        releasedRef.current = false;
        void syncCartHoldsAndApply();
      }
    });

    const tick = () => {
      const items = useCartStore.getState().items;
      if (items.length === 0) {
        releasedRef.current = false;
        return;
      }

      // Never release while the shopper is paying.
      const onCheckout = pathnameRef.current?.startsWith("/checkout") ?? false;
      const idleFor = Date.now() - lastActivityRef.current;

      if (!onCheckout && idleFor >= IDLE_RELEASE_MS) {
        if (!releasedRef.current) {
          releasedRef.current = true;
          lastRefreshRef.current = 0;
          void syncCartHolds([]);
          showToast("Your bag was idle — pieces are back in the shop");
        }
        return;
      }

      if (Date.now() - lastRefreshRef.current >= REFRESH_THROTTLE_MS) {
        lastRefreshRef.current = Date.now();
        void syncCartHoldsAndApply();
      }
    };

    const interval = window.setInterval(tick, TICK_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
      document.removeEventListener("visibilitychange", markActive);
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
