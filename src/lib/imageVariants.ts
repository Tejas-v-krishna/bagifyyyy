/**
 * Card-thumbnail variant naming, shared by the client and the server.
 *
 * Why this file exists: every product image is stored once at full resolution
 * and served everywhere — including 288px grid cards, which then download a
 * ~550 KB file to fill a 576-device-pixel box. A 20-card category page weighed
 * ~10.8 MB because of that.
 *
 * The fix is a second, small WebP stored next to each original under a
 * `_thumb.webp` key. Grids request the thumb; the product detail page keeps
 * the full file. Both live in R2, so neither costs anything on Vercel.
 *
 * This module is deliberately pure string manipulation with no `sharp` import
 * so client components can derive thumb URLs without pulling a native binary
 * into the browser bundle.
 */

/**
 * Longest edge of a generated card thumbnail, in pixels.
 *
 * Sized against the real grid: `lg:grid-cols-4` inside a ~1400px container puts
 * each card at roughly 330 CSS px, which needs ~660 device pixels at 2x DPR.
 * 720x960 covers that with a little headroom (and the 2-up mobile grid at 3x
 * DPR) while staying far below the full 1200x1600 original.
 */
export const THUMB_MAX_WIDTH = 720;
export const THUMB_MAX_HEIGHT = 960;
/** WebP quality for thumbnails — crisp at card sizes, ~70% smaller than full. */
export const THUMB_QUALITY = 80;
/** Filename marker separating a thumbnail from its full-size original. */
export const THUMB_SUFFIX = "_thumb";

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif)$/i;

/**
 * Hosts we must never rewrite. These are third-party CDNs that Next already
 * allows in `next.config.ts`; they have no `_thumb` sibling, so rewriting would
 * guarantee a 404.
 */
const THIRD_PARTY_HOSTS = [
  "unsplash.com",
  "cloudinary.com",
  "i.ibb.co",
  "googleusercontent.com",
  "githubusercontent.com",
  "fbcdn.net",
  "cdninstagram.com",
  "vercel-storage.com",
  "supabase.co",
  "amazonaws.com",
  "cdn.sanity.io",
  "stripe.com",
  "razorpay.com",
];

/**
 * Derive the thumbnail key for a stored object name.
 * `prod_123_abc_img_0084.webp` -> `prod_123_abc_img_0084_thumb.webp`
 */
export function thumbKeyFor(key: string): string {
  const withoutQuery = key.split("?")[0];
  const match = IMAGE_EXT_RE.exec(withoutQuery);
  if (!match) return `${withoutQuery}${THUMB_SUFFIX}.webp`;
  return `${withoutQuery.slice(0, match.index)}${THUMB_SUFFIX}.webp`;
}

/** True when a URL already points at a thumbnail. */
export function isThumbUrl(url: string): boolean {
  return new RegExp(`${THUMB_SUFFIX}\\.webp$`, "i").test(url.split("?")[0]);
}

/**
 * Map a full-size image URL to its card thumbnail URL.
 *
 * Returns the input untouched when it is not a rewriteable image (placeholder,
 * data URI, third-party CDN, or already a thumb). Callers should still handle
 * the case where the thumbnail does not exist yet — `<ThumbImage>` falls back
 * to the full URL on error.
 */
export function thumbUrlFor(url: string): string {
  if (!url) return url;

  const queryIndex = url.indexOf("?");
  const path = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : url.slice(queryIndex);

  if (isThumbUrl(path)) return url;
  if (!IMAGE_EXT_RE.test(path)) return url;

  // Dev uploads written to public/uploads (no R2 configured).
  if (path.startsWith("/uploads/")) return `${thumbKeyFor(path)}${query}`;
  // Any other relative asset (e.g. /placeholder.jpg) has no thumb sibling.
  if (path.startsWith("/")) return url;

  if (!/^https?:\/\//i.test(path)) return url;

  try {
    const host = new URL(path).hostname.toLowerCase();
    const isThirdParty = THIRD_PARTY_HOSTS.some(
      (blocked) => host === blocked || host.endsWith(`.${blocked}`)
    );
    if (isThirdParty) return url;
  } catch {
    return url;
  }

  return `${thumbKeyFor(path)}${query}`;
}
