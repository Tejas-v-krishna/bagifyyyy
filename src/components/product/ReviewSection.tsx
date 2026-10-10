"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { triggerPromoSuccessBurst } from "@/lib/confetti";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
};

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
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
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState(0);

  const starSize =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-[18px] h-[18px]";

  return (
    <div className="flex items-center gap-1">
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
                ? "cursor-pointer p-0.5 transition-transform hover:scale-115 active:scale-95"
                : "pointer-events-none p-0.5"
            }
          >
            <Star
              className={`${starSize} transition-colors ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : interactive
                  ? "text-black/20 fill-black/[0.04] hover:text-amber-400/50"
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
      setFormError("Please select a rating.");
      return;
    }
    if (formBody.trim().length < 10) {
      setFormError("Review must be at least 10 characters.");
      return;
    }
    if (!formName.trim()) {
      setFormError("Please enter your name.");
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
        setFormError(data.error || "Failed to submit review.");
      } else {
        setFormSuccess(true);
        setReviews((prev) => [data.review, ...prev]);
        triggerPromoSuccessBurst();
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeRatingDesc =
    RATING_LABELS[hoverRating || formRating] || "Click to rate";

  return (
    <section id="reviews" className="mt-20 sm:mt-24 border-t border-black/10 pt-12 sm:pt-16 scroll-mt-24">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black">
            Customer Reviews
          </h2>
          <p className="mt-1.5 text-xs text-black/60 max-w-md">
            Real feedback and sizing advice from verified buyers.
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white px-5 py-3.5 shadow-2xs shrink-0">
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight text-black leading-none">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-black/40 mt-1 font-medium">
                Average Rating
              </span>
            </div>
            <div className="h-8 w-px bg-black/10" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <StarRow rating={Math.round(avgRating)} size="sm" />
              <span className="text-xs text-black/60 font-medium">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Grid: Form Card (Left) vs Review Logs (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        {/* ── Left: White Revamped Form Card ── */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl bg-white text-black p-6 sm:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/10">
            <div className="mb-6">
              <h3 className="text-lg font-bold uppercase tracking-tight text-black">
                Write a Review
              </h3>
              <p className="mt-1 text-xs text-black/60 leading-relaxed">
                Bought or tried this piece? Share your thoughts on fit, fabric, and condition.
              </p>
            </div>

            {formSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-3 py-6 text-center items-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-1">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  Review Submitted
                </h4>
                <p className="text-xs text-black/60 max-w-xs leading-relaxed">
                  Thank you! Your feedback has been published and helps fellow buyers shop with confidence.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSuccess(false);
                    setFormRating(0);
                    setFormBody("");
                  }}
                  className="mt-4 text-xs font-semibold uppercase tracking-wider text-black hover:text-black/70 underline underline-offset-4 cursor-pointer"
                >
                  Write another review
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Field: Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Alex M."
                    className="w-full rounded-xl border border-black/15 bg-[#fafafa] px-3.5 py-2.5 text-xs text-black placeholder:text-black/35 outline-none transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Field: Rating */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-1.5">
                    Rating
                  </label>
                  <div className="rounded-xl border border-black/15 bg-[#fafafa] p-3 flex items-center justify-between">
                    <StarRow
                      rating={formRating}
                      interactive
                      onRate={setFormRating}
                      onHoverChange={setHoverRating}
                      size="md"
                    />
                    <span className="text-xs font-medium text-black/60">
                      {activeRatingDesc}
                    </span>
                  </div>
                </div>

                {/* Field: Review Body */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    required
                    rows={4}
                    placeholder="Tell us about the fit, fabric quality, and how it feels..."
                    className="w-full rounded-xl border border-black/15 bg-[#fafafa] px-3.5 py-2.5 text-xs text-black placeholder:text-black/35 outline-none transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black resize-none leading-relaxed"
                  />
                </div>

                {formError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 font-medium">
                    {formError}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Right: Review Cards / Empty State ── */}
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 rounded-xl bg-black/[0.03] animate-pulse border border-black/5" />
              <div className="h-28 rounded-xl bg-black/[0.03] animate-pulse border border-black/5" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-2xs">
              <div className="w-12 h-12 rounded-full border border-black/10 bg-black/[0.02] flex items-center justify-center mb-3 text-black/40">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-base font-bold uppercase tracking-tight text-black">
                No Reviews Yet
              </p>
              <p className="mt-1.5 text-xs text-black/55 max-w-sm leading-relaxed">
                Be the first to share your thoughts on this unique piece. Use the review form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-2xs transition-shadow duration-200 hover:shadow-xs"
                  >
                    {/* Top card header */}
                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-black/6">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-xs font-bold text-black shrink-0">
                          {review.authorName[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs font-bold uppercase tracking-wider text-black">
                              {review.authorName}
                            </p>
                            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                              Verified Buyer
                            </span>
                          </div>
                          <p className="text-[11px] text-black/40 mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <StarRow rating={review.rating} size="sm" />
                        <span className="text-xs font-bold text-black/80 ml-1">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="mt-3.5">
                      <p className="text-xs sm:text-[13px] leading-relaxed text-black/80 font-normal">
                        {review.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
