"use client";

import { useEffect } from "react";
import { syncCartHoldsAndApply } from "@/store/useCartStore";

const RENEW_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keeps the shopper's stock holds alive while the site is open: renews every
 * five minutes and whenever the tab becomes visible again. Also reconciles on
 * load, so a bag restored from storage regains its holds.
 */
export default function CartHoldSync() {
  useEffect(() => {
    void syncCartHoldsAndApply();

    const renew = () => {
      if (document.visibilityState === "visible") {
        void syncCartHoldsAndApply();
      }
    };

    const interval = window.setInterval(renew, RENEW_INTERVAL_MS);
    document.addEventListener("visibilitychange", renew);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", renew);
    };
  }, []);

  return null;
}
