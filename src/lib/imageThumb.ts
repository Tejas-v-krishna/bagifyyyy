import sharp from "sharp";
import {
  THUMB_MAX_HEIGHT,
  THUMB_MAX_WIDTH,
  THUMB_QUALITY,
} from "./imageVariants";

/**
 * Server-only thumbnail encoder, shared by the studio upload route and the
 * one-time backfill script so both produce byte-identical variants.
 *
 * Do not import this from a client component — it pulls in the native `sharp`
 * binary. Client code should use the pure helpers in `imageVariants.ts`.
 */

export interface ThumbResult {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Downscale + encode a card thumbnail as WebP.
 *
 * - `rotate()` bakes in EXIF orientation so phone photos are not sideways.
 * - `fit: inside` preserves aspect ratio, so both 3:4 and 4:5 product shots
 *   land inside the 600x800 box without cropping or stretching.
 * - `withoutEnlargement` keeps already-small images at their native size
 *   rather than upscaling them into a larger, blurrier file.
 *
 * Returns null when sharp cannot decode the input (SVG without librsvg, some
 * HEIC builds, exotic TIFF). Callers should mirror the original bytes under
 * the thumb key in that case so the derived URL still resolves.
 */
export async function buildThumb(input: Buffer): Promise<ThumbResult | null> {
  try {
    const pipeline = sharp(input)
      .rotate()
      .resize({
        width: THUMB_MAX_WIDTH,
        height: THUMB_MAX_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: THUMB_QUALITY, effort: 4, smartSubsample: true });

    const buffer = await pipeline.toBuffer();
    const meta = await sharp(buffer).metadata();

    return {
      buffer,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  } catch {
    return null;
  }
}
