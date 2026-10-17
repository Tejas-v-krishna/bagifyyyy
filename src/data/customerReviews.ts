/**
 * Curated community reviews — DM screenshots from Instagram highlights.
 *
 * No user-written reviews on the site. To add a review:
 * 1. Drop the screenshot in `public/reviews/` (e.g. `review-1.jpg`)
 * 2. Add one line below: { src: "/reviews/review-1.jpg", alt: "DM review" }
 *
 * Shown on every product page in the same order.
 */
export type CustomerReview = {
  src: string;
  alt: string;
};

export const CUSTOMER_REVIEWS: CustomerReview[] = [
  // Temporary preview — replace via /studio/reviews with DM screenshots.
  { src: "/hero-1.png", alt: "Customer review 1" },
  { src: "/hero-2.png", alt: "Customer review 2" },
  { src: "/fit.jpg", alt: "Customer review 3" },
];
