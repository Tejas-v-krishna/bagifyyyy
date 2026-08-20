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
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={interactive ? "button" : undefined}
          onClick={interactive && onRate ? () => onRate(s) : undefined}
          onMouseEnter={interactive ? () => setHover(s) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              s <= (hover || rating) ? "fill-[#232D3B] text-[#232D3B]" : "text-gray-300"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold">
      <span className="w-3 text-right text-y2k-gunmetal/60">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100">
        <div className="h-full bg-[#232D3B] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-y2k-gunmetal/50">{count}</span>
    </div>
  );
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { user, isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formBody, setFormBody] = useState("");
  const [formName, setFormName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  // Pre-fill name from user
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
    <section className="mt-20 pt-12 border-t border-gray-100">
      <h2 className="font-sans font-medium text-2xl tracking-tight text-black mb-8">
        Customer Reviews
        {reviews.length > 0 && (
          <span className="ml-3 text-base text-gray-400 font-normal">({reviews.length})</span>
        )}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
        {/* Left: aggregate + write review form */}
        <div className="flex flex-col gap-8">
          {/* Aggregate */}
          {reviews.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-medium text-5xl tracking-tight">{avgRating}</span>
                <div>
                  <StarRow rating={Math.round(avgRating)} />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                {distribution.map((d) => (
                  <RatingBar key={d.label} label={d.label} count={d.count} total={reviews.length} />
                ))}
              </div>
            </div>
          )}

          {/* Write a review */}
          <div className="border border-gray-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal mb-4">Write a Review</p>

            {formSuccess ? (
              <div className="flex items-center gap-2 text-green-700 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Review submitted — thank you!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Rahul S."
                    className="w-full border border-gray-200 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal transition-colors"
                  />
                </div>

                {/* Star rating */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Rating *</label>
                  <StarRow rating={formRating} interactive onRate={setFormRating} />
                </div>

                {/* Body */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Review *</label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    required
                    rows={4}
                    placeholder="Share your honest thoughts about the fit, quality, and style…"
                    className="w-full border border-gray-200 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal transition-colors resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#232D3B] text-white text-[10px] font-bold uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? "Submitting…" : "Submit Review →"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right: review list */}
        <div>
          {loading ? (
            <div className="text-xs text-gray-400 uppercase tracking-wider py-8">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="text-sm text-gray-400 py-8">
              No reviews yet — be the first to share your thoughts!
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#232D3B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {review.authorName[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black">{review.authorName}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
