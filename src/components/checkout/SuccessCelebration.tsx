"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import LottieCheck from "@/components/ui/LottieCheck";

const money = (value: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function DetailRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/45 shrink-0">
        {label}
      </span>
      <span
        className={`text-right font-semibold text-black break-all ${
          emphasize ? "font-sans text-sm sm:text-base" : "text-[11px] sm:text-xs"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Full-screen celebration shown once per order (per session) on the success
 * page after a completed payment.
 *
 * Robustness note: the backdrop is a plain element and the card starts at
 * full opacity, so the overlay is fully visible and dismissible even if the
 * animation loop is ever stalled. Only the pop-in (scale/translate) depends
 * on framer-motion.
 */
export default function SuccessCelebration({
  orderNumber,
  orderDate,
  customerEmail,
  totalAmount,
  totalQty,
  onClose,
}: {
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  totalAmount: number;
  totalQty: number;
  onClose: () => void;
}) {
  // Escape closes the celebration.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Order confirmed"
      className="fixed inset-0 z-[12000] bg-black/50 backdrop-blur-[2px] overflow-y-auto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 1, scale: 0.92, y: 22 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md rounded-[28px] bg-white px-6 sm:px-9 pt-8 pb-7 text-center shadow-[0_32px_90px_-24px_rgba(16,16,18,0.55)]"
        >
          <LottieCheck className="mx-auto h-28 w-28" />

          <h2 className="font-microgramma text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black mt-1">
            Success!
          </h2>
          <p className="text-xs sm:text-sm text-black/60 leading-relaxed mt-3 max-w-sm mx-auto">
            Payment received and your order is confirmed. A confirmation email is on its
            way to <span className="font-semibold text-black break-all">{customerEmail}</span>.
          </p>

          <div className="mt-6 rounded-2xl border border-black/[0.06] bg-[#f5f5f2] divide-y divide-black/[0.06] text-left">
            <DetailRow label="Order Number" value={`#${orderNumber}`} />
            <DetailRow label="Order Date" value={orderDate} />
            <DetailRow label="Items" value={totalQty === 1 ? "1 piece" : `${totalQty} pieces`} />
            <DetailRow label="Total Paid" value={`₹${money(totalAmount)}`} emphasize />
            <DetailRow label="Delivery ETA" value="3–5 business days" />
            <DetailRow label="Confirmation Email" value={customerEmail} />
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-black text-white py-3.5 px-6 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer"
            >
              View Order Details
            </button>
            <Link
              href="/"
              onClick={onClose}
              className="w-full rounded-full border border-black/15 bg-white text-black py-3.5 px-6 text-xs font-medium uppercase tracking-[0.14em] text-center hover:border-black hover:bg-black/[0.02] transition-colors cursor-pointer"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
