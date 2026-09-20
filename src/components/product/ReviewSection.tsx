"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
};

function StarRow({ rating, interactive = false, onRate }: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          aria-label={interactive ? `Rate ${s} star${s > 1 ? 's' : ''}` : `${rating} stars`}
          onClick={interactive && onRate ? () => onRate(s) : undefined}
          onMouseEnter={interactive ? () => setHover(s) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          className={interactive ? "cursor-pointer p-1 -ml-1 first:ml-0 transition-opacity hover:opacity-70" : "pointer-events-none p-0.5"}
        >
          <Star
            className={`w-[18px] h-[18px] transition-colors ${
              s <= (hover || rating) ? "fill-black text-black" : "text-black/15"
            }`}
            strokeWidth={1.4}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-[10px]">
      <span className="w-3 text-right font-mono text-[11px] font-bold tracking-tight text-black">{label}</span>
      <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div className="h-full bg-black transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 font-mono text-[11px] font-medium text-black/40">{count}</span>
    </div>
  );
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [formRating, setFormRating] = useState(0);
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
        if (err instanceof DOMException && err.name === 'AbortError') return;
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

  const distribution = [5, 4, 3, 2, 1].map((s) => ({
    label: String(s),
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (formRating === 0) { setFormError("Please select a star rating."); return; }
    if (formBody.trim().length < 10) { setFormError("Review must be at least 10 characters."); return; }
    if (!formName.trim()) { setFormError("Please enter your name."); return; }

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
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 sm:mt-20 border-t border-black/10 pt-10 sm:pt-12">
      {/* Editorial header — matches product page / checkout typography */}
      <div className="flex items-start justify-between gap-6 mb-8 sm:mb-10">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-black/40 mb-2">
            Archive Notes — {reviews.length.toString().padStart(2, "0")}
          </p>
          <h2 className="font-microgramma text-[clamp(1.75rem,4vw,2.75rem)] font-bold uppercase leading-none tracking-tight text-black">
            Customer Reviews
          </h2>
          {reviews.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-black/50 max-w-prose">
              Unfiltered fit notes from the archive. Every review is from a verified piece.
            </p>
          )}
        </div>
        {reviews.length > 0 && (
          <span className="hidden sm:inline-flex h-6 items-center border border-black/10 px-2.5 text-[10px] font-mono font-bold tracking-[0.14em] text-black/60">
            {reviews.length} {reviews.length === 1 ? "NOTE" : "NOTES"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-10 items-start">
        {/* Left: snapshot + writer */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          {/* Snapshot */}
          {reviews.length > 0 ? (
            <div className="bg-white border border-black/10 p-6 sm:p-7">
              <div className="flex items-baseline gap-4">
                <span className="font-microgramma text-5xl font-bold leading-none tracking-tight text-black">
                  {avgRating.toFixed(1)}
                </span>
                <div>
                  <StarRow rating={Math.round(avgRating)} />
                  <p className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"} — Avg
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 border-t border-black/10 pt-5">
                {distribution.map((d) => (
                  <RatingBar key={d.label} label={d.label} count={d.count} total={reviews.length} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#f5f5f2] border border-black/10 p-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Snapshot</p>
              <p className="mt-2 text-sm leading-relaxed text-black/60">
                No notes yet. Be the first to leave a fit note.
              </p>
            </div>
          )}

          {/* Writer — editorial card like checkout Step */}
          <div className="bg-white border border-black/10 p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-5 border-b border-black/10 pb-4">
              <h3 className="font-microgramma text-[13px] font-bold uppercase tracking-[0.14em] text-black">Write a Review</h3>
              <p className="mt-1 font-mono text-[10px] leading-relaxed tracking-[0.04em] text-black/40">
                Fit, fabric, wash — what should the next owner know?
              </p>
            </div>

            {formSuccess ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="inline-flex items-center gap-2 border border-black bg-black px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Review submitted — thank you
                </div>
                <p className="text-xs leading-relaxed text-black/60">
                  Your note is now in the archive and visible to everyone viewing this piece.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSuccess(false);
                    setFormRating(0);
                    setFormBody("");
                  }}
                  className="mt-1 inline-flex w-fit border border-black/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Write another note
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60">
                    Your Name <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Rahul S."
                    className="w-full border border-black/15 bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none transition-colors focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60">
                    Rating <span className="text-black">*</span>
                  </label>
                  <div className="border border-black/10 bg-[#f5f5f2] px-3 py-2.5">
                    <StarRow rating={formRating} interactive onRate={setFormRating} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60">
                    Review <span className="text-black">*</span>
                  </label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    required
                    rows={4}
                    placeholder="How did it fit? What did you notice?"
                    className="w-full resize-none border border-black/15 bg-white px-4 py-3 text-sm leading-relaxed text-black placeholder:text-black/30 outline-none transition-colors focus:border-black"
                  />
                </div>

                {formError && (
                  <p className="border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-red-700">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 bg-black px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Submitting…" : "Submit Review →"}
                </button>

                <p className="text-center font-mono text-[10px] leading-relaxed tracking-[0.04em] text-black/30">
                  By submitting, you agree your note may be shown publicly.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Right: list */}
        <div className="min-w-0">
          {loading ? (
            <div className="border border-black/10 bg-white p-8">
              <div className="h-4 w-32 animate-pulse bg-black/10" />
              <div className="mt-6 space-y-4">
                <div className="h-20 animate-pulse bg-black/[0.04]" />
                <div className="h-20 animate-pulse bg-black/[0.04]" />
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="border border-dashed border-black/15 bg-white p-10 text-center">
              <p className="font-microgramma text-sm font-bold uppercase tracking-[0.12em] text-black">No reviews yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-black/50">
                Own this piece? Leave the first fit note — it helps the next person choose their size.
              </p>
            </div>
          ) : (
            <div className="flex flex-col border border-black/10 bg-white divide-y divide-black/10">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-black text-[11px] font-bold tracking-widest text-white">
                        {review.authorName[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold tracking-tight text-black">{review.authorName}</p>
                        <p className="font-mono text-[10px] font-medium tracking-[0.08em] text-black/40">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  <p className="mt-4 text-[13.5px] leading-[1.7] text-black/75">{review.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
