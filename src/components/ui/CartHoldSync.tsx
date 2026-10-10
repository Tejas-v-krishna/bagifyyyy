"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { syncCartHolds } from "@/lib/cartHolds";
import { syncCartHoldsAndApply, useCartStore } from "@/store/useCartStore";
import { showToast } from "@/lib/toast";

/** No interaction for this long and the bag goes back to the shop. */
const IDLE_RELEASE_MS = 3 * 60 * 1000;
/** Check hold expiries every 3 seconds so pieces are returned to the shop on time */
const TICK_MS = 3 * 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "wheel"];

/**
 * Keeps the shopper's stock holds honest:
 * - 5-minute hold countdown tracked per piece
 * - when 5 minutes expire without buying, the piece returns to the shop
 * - 3 minutes without any interaction releases pieces back to the shop
 * - checkout flow is exempt while actively paying
 */
export default function CartHoldSync() {
  const pathname = usePathname();
  const lastActivityRef = useRef(0);
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
    void syncCartHoldsAndApply();

    const markActive = () => {
      lastActivityRef.current = Date.now();
      if (releasedRef.current) {
        releasedRef.current = false;
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
      if (!onCheckout) {
        // 1. Check if any piece reached its 5-minute hold expiry
        const expired = useCartStore.getState().removeExpiredItems();
        if (expired) {
          showToast("5-minute hold expired · piece returned to the shop");
          return;
        }

        // 2. Check idle release
        const idleFor = Date.now() - lastActivityRef.current;
        if (idleFor >= IDLE_RELEASE_MS) {
          if (!releasedRef.current) {
            releasedRef.current = true;
            void syncCartHolds([]);
            showToast("Your bag was idle · pieces are back in the shop");
          }
          return;
        }
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
