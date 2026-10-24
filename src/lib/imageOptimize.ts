import sharp from "sharp";

/**
 * Shared server-side image optimizer used by the studio upload route.
 *
 * Keeps image quality high and crisp: resizes down to 1600px cap (if larger)
 * and encodes to WebP at quality 85 (dropping to 78 only if file exceeds 550KB).
 * Does NOT apply median or blurring filters so garments, textures, and details
 * remain pin-sharp across laptop and mobile displays.
 */

/** Long edge cap for studio uploads — plenty for 3:4 product shots at 2x/3x retina. */
export const OPTIMIZE_MAX_DIMENSION = 1600;
/** WebP effort: 4 keeps upload responses comfortably inside Vercel limits. */
const WEBP_EFFORT = 4;
/** Quality ladder: 85 delivers crisp ecommerce quality; 78 as fallback for heavy files. */
const QUALITY_STEPS = [85, 78];
/** Weight target after which the next (lower) quality step is tried. */
export const OPTIMIZE_TARGET_BYTES = 550 * 1024;
/**
 * Client-side WebP files at/below this size are kept pristine — re-encoding
 * them would add a lossy generation for a negligible byte win.
 */
export const KEEP_PRISTINE_MAX_BYTES = 500 * 1024;

export interface OptimizeResult {
  buffer: Buffer;
  /** WebP quality actually used. */
  quality: number;
  width: number;
  height: number;
  originalBytes: number;
}

/**
 * True when an upload is already small enough to store untouched: a WebP
 * within the dimension cap whose weight is at or below the keep-pristine
 * budget. Used by the upload route to skip a needless lossy generation.
 */
export function isKeepPristineWebp(
  meta: { format?: string; width?: number; height?: number },
  bytes: number
): boolean {
  return (
    meta.format === "webp" &&
    (meta.width || 0) <= OPTIMIZE_MAX_DIMENSION &&
    (meta.height || 0) <= OPTIMIZE_MAX_DIMENSION &&
    bytes <= KEEP_PRISTINE_MAX_BYTES
  );
}

/**
 * Downscale + encode a raster image to clean, crisp WebP.
 *
 * - `rotate()` applies EXIF orientation before everything else.
 * - Preserves sharp edges without blurring or median smoothing.
 * - Returns the first ladder result at/below the target bytes, or the final
 *   step's result when even the floor quality stays heavier.
 */
export async function optimizeImageBuffer(input: Buffer): Promise<OptimizeResult> {
  const originalMeta = await sharp(input).metadata();
  const originalBytes = input.length;

  let best: OptimizeResult | null = null;

  for (const quality of QUALITY_STEPS) {
    const pipeline = sharp(input)
      .rotate()
      .resize({
        width: OPTIMIZE_MAX_DIMENSION,
        height: OPTIMIZE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });

    const buffer = await pipeline
      .webp({ quality, effort: WEBP_EFFORT, smartSubsample: true })
      .toBuffer();

    const meta = await sharp(buffer).metadata();
    best = {
      buffer,
      quality,
      width: meta.width || originalMeta.width || 0,
      height: meta.height || originalMeta.height || 0,
      originalBytes,
    };

    if (buffer.length <= OPTIMIZE_TARGET_BYTES) break;
  }

  // QUALITY_STEPS is never empty, so `best` is always set here.
  return best as OptimizeResult;
}

/** Filename suffix marking an already-optimized backfill output. */
export const OPTIMIZED_SUFFIX = "-opt";

/** Derive the optimized key/filename for a stored object name. */
export function optimizedKeyFor(key: string): string {
  const match = /\.[a-z0-9]+$/i.exec(key);
  const base = match ? key.slice(0, match.index) : key;
  return `${base}${OPTIMIZED_SUFFIX}.webp`;
}

/** True when an object already came out of the optimizer. */
export function isOptimizedKey(key: string): boolean {
  return /-opt\.webp$/i.test(key);
}
