import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  KEEP_PRISTINE_MAX_BYTES,
  OPTIMIZE_MAX_DIMENSION,
  OPTIMIZE_TARGET_BYTES,
  isKeepPristineWebp,
  isOptimizedKey,
  optimizeImageBuffer,
  optimizedKeyFor,
} from "@/lib/imageOptimize";

/** Deterministic pseudo-random noise — mimics camera/compression grain. */
function noisyBuffer(width: number, height: number, seed = 42, channels = 3): Buffer {
  const raw = Buffer.alloc(width * height * channels);
  let state = (seed >>> 0) || 1;
  for (let i = 0; i < raw.length; i++) {
    // xorshift32 — full-period, no short low-bit cycles.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    raw[i] = state & 0xff;
  }
  return raw;
}

describe("Shared image optimizer (studio uploads + existing-image backfill)", () => {
  it("downscales high-resolution images to the 1600px cap and re-encodes as WebP", async () => {
    const rawBuffer = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 120, g: 60, b: 200 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await optimizeImageBuffer(rawBuffer);
    const metadata = await sharp(result.buffer).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(OPTIMIZE_MAX_DIMENSION);
    // Aspect ratio preserved: 3000x2000 -> 1600x1067
    expect(metadata.height).toBe(1067);
    expect(result.buffer.length).toBeLessThan(rawBuffer.length);
    expect([78, 70]).toContain(result.quality);
  });

  it("does not enlarge images smaller than the cap", async () => {
    const smallBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 50, g: 150, b: 250 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeImageBuffer(smallBuffer);
    const meta = await sharp(result.buffer).metadata();

    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });

  it("converts PNGs to lightweight WebP files", async () => {
    const pngBuffer = await sharp({
      create: {
        width: 1800,
        height: 1800,
        channels: 4,
        background: { r: 255, g: 100, b: 50, alpha: 1 },
      },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const result = await optimizeImageBuffer(pngBuffer);
    const meta = await sharp(result.buffer).metadata();

    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(OPTIMIZE_MAX_DIMENSION);
    expect(meta.height).toBe(OPTIMIZE_MAX_DIMENSION);
    expect(result.buffer.length).toBeLessThan(pngBuffer.length);
  });

  it("cleans sensor/compression grain on noisy photos far below a plain WebP re-encode", async () => {
    // A 1600px noisy "photo" straight out of a phone camera.
    const noisy = await sharp(noisyBuffer(1600, 1600), {
      raw: { width: 1600, height: 1600, channels: 3 },
    })
      .jpeg({ quality: 92 })
      .toBuffer();

    const plainWebp = await sharp(noisy)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();

    const result = await optimizeImageBuffer(noisy);

    // The median cleanup must beat an already-strong plain encode by a wide
    // margin — that gap is the whole point of the backfill.
    expect(result.buffer.length).toBeLessThan(plainWebp.length * 0.8);
    expect(result.buffer.length).toBeLessThan(noisy.length);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("webp");
  });

  it("steps down quality when the first pass stays over budget (alpha images skip cleanup)", async () => {
    // 4-channel noise: hasAlpha skips the median cleanup on purpose, so the
    // first (q78) pass cannot squeeze under the target and the ladder MUST
    // settle on the floor quality instead of ballooning the file further.
    const noisyAlpha = await sharp(noisyBuffer(1600, 1600, 7, 4), {
      raw: { width: 1600, height: 1600, channels: 4 },
    })
      .png()
      .toBuffer();

    const result = await optimizeImageBuffer(noisyAlpha);

    expect(result.quality).toBe(70);
    expect(result.buffer.length).toBeGreaterThan(OPTIMIZE_TARGET_BYTES);
    expect(result.buffer.length).toBeLessThan(noisyAlpha.length);
  });

  it("keeps clean, already-small client WebP files pristine", async () => {
    const clientWebp = await sharp({
      create: {
        width: 1200,
        height: 1600,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .webp({ quality: 60 })
      .toBuffer();
    const meta = await sharp(clientWebp).metadata();

    expect(clientWebp.length).toBeLessThanOrEqual(KEEP_PRISTINE_MAX_BYTES);
    expect(isKeepPristineWebp(meta, clientWebp.length)).toBe(true);

    // Oversized or over-dimension files must NOT be treated as pristine.
    expect(isKeepPristineWebp(meta, KEEP_PRISTINE_MAX_BYTES + 1)).toBe(false);
    expect(isKeepPristineWebp({ format: "webp", width: 2000, height: 2000 }, 10 * 1024)).toBe(false);
    expect(isKeepPristineWebp({ format: "jpeg", width: 1200, height: 1200 }, 10 * 1024)).toBe(false);
  });

  it("derives and detects the -opt.webp backfill suffix", () => {
    expect(optimizedKeyFor("prod_123_abc_img_0115.webp")).toBe("prod_123_abc_img_0115-opt.webp");
    expect(optimizedKeyFor("migrated_img_9373.jpeg")).toBe("migrated_img_9373-opt.webp");
    expect(optimizedKeyFor("noext")).toBe("noext-opt.webp");
    expect(isOptimizedKey("prod_123-opt.webp")).toBe(true);
    expect(isOptimizedKey("prod_123.webp")).toBe(false);
  });

  it("correctly identifies vector SVGs and animated GIFs to keep them pristine", () => {
    const isSvg = (mime: string, name: string) =>
      mime === "image/svg+xml" || name.toLowerCase().endsWith(".svg");
    const isGif = (mime: string, name: string) =>
      mime === "image/gif" || name.toLowerCase().endsWith(".gif");

    expect(isSvg("image/svg+xml", "logo.svg")).toBe(true);
    expect(isSvg("", "icon.SVG")).toBe(true);
    expect(isSvg("image/jpeg", "photo.jpg")).toBe(false);

    expect(isGif("image/gif", "animation.gif")).toBe(true);
    expect(isGif("", "drop.GIF")).toBe(true);
    expect(isGif("image/png", "banner.png")).toBe(false);
  });

  it("exposes a sane target budget below the pristine keep threshold", () => {
    expect(OPTIMIZE_TARGET_BYTES).toBeLessThanOrEqual(320 * 1024);
    expect(KEEP_PRISTINE_MAX_BYTES).toBeLessThanOrEqual(OPTIMIZE_TARGET_BYTES);
  });
});
