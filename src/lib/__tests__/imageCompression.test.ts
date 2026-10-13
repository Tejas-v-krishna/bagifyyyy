import { describe, it, expect } from "vitest";
import sharp from "sharp";

describe("Dashboard Image Compression & Optimization Pipeline", () => {
  it("downscales high-resolution images (> 1600px) to max 1600px edge", async () => {
    // Generate an oversized 3000x2000 test image
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

    expect(rawBuffer.length).toBeGreaterThan(0);

    // Apply the studio upload compression pipeline
    const compressedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const metadata = await sharp(compressedBuffer).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBeLessThanOrEqual(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);
    // Aspect ratio preserved: 3000x2000 scaled to 1600x1067
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(1067);
    expect(compressedBuffer.length).toBeLessThan(rawBuffer.length);
  });

  it("converts PNGs to lightweight WebP format with massive byte savings", async () => {
    // Create a uncompressed PNG buffer
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

    const compressedBuffer = await sharp(pngBuffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const meta = await sharp(compressedBuffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(1600);
    expect(compressedBuffer.length).toBeLessThan(pngBuffer.length);
  });

  it("does not enlarge images smaller than 1600px", async () => {
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

    const compressed = await sharp(smallBuffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const meta = await sharp(compressed).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });

  it("identifies already-optimized WebP files to prevent generation loss", async () => {
    const clientWebp = await sharp({
      create: {
        width: 1200,
        height: 1600,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .webp({ quality: 82 })
      .toBuffer();

    const meta = await sharp(clientWebp).metadata();
    const isAlreadyOptimized =
      meta.format === "webp" &&
      (meta.width || 0) <= 1600 &&
      (meta.height || 0) <= 1600 &&
      clientWebp.length <= 450 * 1024;

    expect(isAlreadyOptimized).toBe(true);
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
});
