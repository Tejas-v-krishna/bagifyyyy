import Link from "next/link";
import { ArrowRight, Archive } from "lucide-react";
import { FALLBACK_CATALOG_CAPTURED_AT } from "@/lib/catalogFallback";

/**
 * Shown only when product data came from the offline catalogue snapshot.
 * Keeps a degraded storefront honest: pieces can be browsed, but nothing can
 * be bought until live stock is readable again.
 */
export default function ArchiveModeNotice({ className = "" }: { className?: string }) {
  const captured = new Date(FALLBACK_CATALOG_CAPTURED_AT);
  const capturedLabel = Number.isNaN(captured.getTime())
    ? null
    : captured.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      role="status"
      className={`flex flex-col gap-2 rounded-xl border border-amber-900/15 bg-amber-50/80 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <Archive className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-[11.5px] leading-relaxed text-amber-950/80">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">
            Archive view
          </span>{" "}
          — the live catalogue is temporarily unavailable, so you are seeing the last saved pieces
          {capturedLabel ? ` from ${capturedLabel}` : ""}. Checkout reopens as soon as it is back.
        </p>
      </div>
      <Link
        href="/contact"
        className="inline-flex shrink-0 items-center gap-1.5 self-start border-b border-amber-900/30 pb-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-900 hover:border-amber-900 sm:self-auto"
      >
        Ask about a piece
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}
