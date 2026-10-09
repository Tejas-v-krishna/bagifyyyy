"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, CheckCircle2, ArrowUpRight, Sparkles, MessageSquareQuote } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
};

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "1.0 // HEAVY VINTAGE DISTRESSING",
  2: "2.0 // RUNS CROPPED / TIGHT",
  3: "3.0 // TRUE TO VINTAGE FIT",
  4: "4.0 // PREMIUM DRAPE & FIT",
  5: "5.0 // TRUE ARCHIVE GRAIL",
};

function StarRow({
  rating,
  interactive = false,
  onRate,
  onHoverChange,
  size = "md",
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
  onHoverChange?: (r: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);

  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-[18px] h-[18px]";

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const isFilled = s <= (hover || rating);
        return (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            aria-label={interactive ? `Rate ${s} star${s > 1 ? "s" : ""}` : `${rating} stars`}
            onClick={interactive && onRate ? () => onRate(s) : undefined}
            onMouseEnter={() => {
              if (interactive) {
                setHover(s);
                onHoverChange?.(s);
              }
            }}
            onMouseLeave={() => {
              if (interactive) {
                setHover(0);
                onHoverChange?.(0);
              }
            }}
            className={
              interactive
                ? "cursor-pointer p-0.5 transition-transform hover:scale-110 active:scale-95"
                : "pointer-events-none p-0.5"
            }
          >
            <Star
              className={`${starSize} transition-colors ${
                isFilled
                  ? interactive
                    ? "fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                    : "fill-black text-black"
                  : interactive
                  ? "text-white/20 fill-transparent hover:text-white/40"
                  : "text-black/15 fill-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formBody, setFormBody] = useState("");
  const [formName, setFormName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/products/${productId}/reviews`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    if (user?.name) setFormName(user.name);
  }, [user]);

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (formRating === 0) {
      setFormError("Select a star rating to verify fit.");
      return;
    }
    if (formBody.trim().length < 10) {
      setFormError("Archive note must be at least 10 characters.");
      return;
    }
    if (!formName.trim()) {
      setFormError("Please enter your name or handle.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formName.trim(),
          rating: formRating,
          body: formBody.trim(),
          userId: user?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to log review.");
      } else {
        setFormSuccess(true);
        setReviews((prev) => [data.review, ...prev]);
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeRatingDesc =
    RATING_DESCRIPTIONS[hoverRating || formRating] || "TAP STARS TO RATE FIT & QUALITY";

  return (
    <section id="reviews" className="mt-20 sm:mt-24 border-t border-black/10 pt-12 sm:pt-16 scroll-mt-24">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" aria-hidden="true" />
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-black/70">
              ARCHIVE LOG // {reviews.length.toString().padStart(2, "0")} {reviews.length === 1 ? "NOTE" : "NOTES"}
            </span>
          </div>
          <h2 className="font-microgramma text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-black">
            Community Fit Notes
          </h2>
          <p className="mt-1 text-xs font-mono uppercase tracking-[0.06em] text-black/50 max-w-md">
            Verified collector feedback on drape, fabric weight, and vintage condition.
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-4 rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-3 shrink-0">
            <div className="flex flex-col items-start">
              <span className="font-microgramma text-3xl font-bold tracking-tight text-black leading-none">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-black/40 mt-1">
                OVERALL SCORE
              </span>
            </div>
            <div className="h-8 w-px bg-black/10" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <StarRow rating={Math.round(avgRating)} size="sm" />
              <span className="text-[9.5px] font-mono uppercase tracking-[0.1em] text-black/50">
                {reviews.length} {reviews.length === 1 ? "Verified Note" : "Verified Notes"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Grid: Form Card (Left) vs Review Logs (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        {/* ── Left: Archival Form Card ── */}
        <div className="lg:sticky lg:top-24">
          <div className="relative overflow-hidden rounded-[14px] bg-[#111111] text-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-white/10">
            {/* Subtle corner badge / indicator */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9.5px] font-mono font-semibold uppercase tracking-[0.18em] text-white/70">
                  SPEC // FIT_LOG
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/40">
                1-OF-1 ARCHIVE
              </span>
            </div>

            <div className="mb-5">
              <h3 className="font-microgramma text-base font-bold uppercase tracking-tight text-white flex items-center gap-2">
                Document This Piece
                <Sparkles className="h-3.5 w-3.5 text-white/40" />
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                Own or tried this piece? Leave sizing, GSM weight, and wear notes for the next collector.
              </p>
            </div>

            {formSuccess ? (
              <div className="flex flex-col gap-3 py-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-[10.5px] font-mono font-bold uppercase tracking-[0.14em] text-white w-fit border border-white/20">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ARCHIVED // NOTE RECORDED
                </div>
                <p className="text-xs leading-relaxed text-white/75 mt-1">
                  Thank you. Your fit note has been published to the community archive log.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSuccess(false);
                    setFormRating(0);
                    setFormBody("");
                  }}
                  className="mt-3 text-[10.5px] font-mono uppercase tracking-[0.16em] text-white/60 hover:text-white underline underline-offset-4 cursor-pointer text-left"
                >
                  Document another note →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Field 01: Name */}
                <div>
                  <label className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-white/50 mb-1.5">
                    <span>[ 01 ] COLLECTOR HANDLE / NAME</span>
                    <span className="text-white/30">REQ</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Yash K. (@yashk_)"
                    className="w-full rounded-[6px] border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-white/25 outline-none transition-all focus:border-white/50 focus:bg-white/[0.08]"
                  />
                </div>

                {/* Field 02: Rating */}
                <div>
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-white/50 mb-2">
                    <span>[ 02 ] FIT & PIECE RATING</span>
                    <span className="text-white/30">REQ</span>
                  </div>
                  <div className="rounded-[6px] border border-white/15 bg-white/[0.04] p-3 flex flex-col gap-2">
                    <StarRow
                      rating={formRating}
                      interactive
                      onRate={setFormRating}
                      onHoverChange={setHoverRating}
                    />
                    <span className="text-[9.5px] font-mono font-medium tracking-[0.12em] text-white/75">
                      {activeRatingDesc}
                    </span>
                  </div>
                </div>

                {/* Field 03: Fit & Sizing note */}
                <div>
                  <label className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-white/50 mb-1.5">
                    <span>[ 03 ] FIT, WASH & SILHOUETTE NOTE</span>
                    <span className="text-white/30">REQ</span>
                  </label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    required
                    rows={3}
                    placeholder="e.g. Fits boxy with dropped shoulders, heavy 280 GSM cotton, flawless vintage fade..."
                    className="w-full rounded-[6px] border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-white/25 outline-none transition-all focus:border-white/50 focus:bg-white/[0.08] resize-none leading-relaxed"
                  />
                </div>

                {formError && (
                  <p className="rounded-[6px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-red-400">
                    {formError}
                  </p>
                )}

                {/* Split Capsule CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-2 flex w-full items-center justify-between rounded-full bg-white px-5 py-2 text-black transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {submitting ? "Logging Note…" : "Submit Archive Note"}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white transition-all duration-300 group-hover:scale-105 group-hover:rotate-12">
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Right: Review Cards / Empty State ── */}
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 rounded-[12px] bg-black/[0.03] animate-pulse border border-black/5" />
              <div className="h-28 rounded-[12px] bg-black/[0.03] animate-pulse border border-black/5" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="relative overflow-hidden rounded-[14px] border border-black/10 bg-[#f9f9f8] p-8 sm:p-12 text-center flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white mb-4 shadow-sm">
                <MessageSquareQuote className="h-5 w-5 text-black/50" />
              </div>
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-black/40 mb-1">
                INDEX 00 // REPOSITORY EMPTY
              </span>
              <p className="font-microgramma text-base sm:text-lg font-bold uppercase tracking-tight text-black">
                No Archive Notes Yet
              </p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.06em] text-black/55 max-w-sm leading-relaxed">
                Every piece in this drop is a unique 1-of-1 archive find. Test the drape and record the first fit note using the card on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div
                  key={review.id}
                  className="group relative rounded-[12px] border border-black/10 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-black/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                >
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-black/6">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-mono font-bold tracking-wider text-white">
                        {review.authorName[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold uppercase tracking-wider text-black">
                            {review.authorName}
                          </p>
                          <span className="hidden sm:inline-block rounded-full bg-black/[0.05] px-2 py-0.5 text-[8.5px] font-mono uppercase tracking-[0.1em] text-black/60">
                            Verified Collector
                          </span>
                        </div>
                        <p className="font-mono text-[9px] tracking-[0.06em] text-black/40 mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StarRow rating={review.rating} size="sm" />
                      <span className="font-mono text-[10px] font-bold text-black/80 bg-black/[0.04] px-1.5 py-0.5 rounded">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mt-3.5">
                    <p className="text-xs sm:text-[13px] leading-relaxed text-black/80 font-normal">
                      &ldquo;{review.body}&rdquo;
                    </p>
                  </div>

                  {/* Card bottom metadata pill */}
                  <div className="mt-4 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.14em] text-black/35 pt-2">
                    <span>RECORD #{String(reviews.length - idx).padStart(2, "0")}</span>
                    <span>AUTHENTIC 1-OF-1 DROP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
