import sharp from "sharp";

/**
 * Shared server-side image optimizer used by the studio upload route and the
 * one-time backfill script (`scripts/optimize-existing-images.ts`).
 *
 * Why this exists: phone photos of garments (especially flat-lays on textured
 * carpet and WhatsApp-forwarded shots) can stay ~1 MB even after a plain WebP
 * re-encode, because per-pixel grain from the camera/compression is the bulk
 * of the data. A mild 5×5 median pass removes that speckle *without* touching
 * real edges (stitching, prints, garment seams), which lets the encoder get
 * 3–5× smaller files at a quality that is visually indistinguishable at
 * storefront sizes.
 *
 * The quality ladder only steps down when the result is still over budget, so
 * clean photos finish in a single encode and stubborn grainy ones settle for
 * one lower quality step instead of ballooning the request time.
 */

/** Long edge cap for studio uploads — plenty for 3:4 product shots. */
export const OPTIMIZE_MAX_DIMENSION = 1600;
/** WebP effort: 4 keeps upload responses comfortably inside Vercel limits. */
const WEBP_EFFORT = 4;
/** First attempt quality; the ladder steps down only when the result is heavy. */
const QUALITY_STEPS = [78, 70];
/** Weight target after which the next (lower) quality step is tried. */
export const OPTIMIZE_TARGET_BYTES = 300 * 1024;
/**
 * Client-side WebP files at/below this size are kept pristine — re-encoding
 * them would add a lossy generation for a negligible byte win.
 */
export const KEEP_PRISTINE_MAX_BYTES = 280 * 1024;

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
 * Downscale + clean + encode a raster image to WebP.
 *
 * - `rotate()` applies EXIF orientation before everything else.
 * - `median(5)` speckle cleanup is skipped for images with alpha so soft
 *   transparency edges are not smeared.
 * - Returns the first ladder result at/below the target bytes, or the final
 *   step's result when even the floor quality stays heavier.
 */
export async function optimizeImageBuffer(input: Buffer): Promise<OptimizeResult> {
  const originalMeta = await sharp(input).metadata();
  const hasAlpha = Boolean(originalMeta.hasAlpha);
  const originalBytes = input.length;

  let best: OptimizeResult | null = null;

  for (const quality of QUALITY_STEPS) {
    let pipeline = sharp(input)
      .rotate()
      .resize({
        width: OPTIMIZE_MAX_DIMENSION,
        height: OPTIMIZE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (!hasAlpha) {
      pipeline = pipeline.median(5);
    }

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
