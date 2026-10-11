"use client";

import { upload } from "@vercel/blob/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Long edge cap for studio uploads — plenty for 3:4 product shots. */
const MAX_DIMENSION = 1600;
/** WebP quality: visually lossless for product photos at a tenth of PNG size. */
const WEBP_QUALITY = 0.82;

/**
 * Downscale + convert to high-efficiency WebP in the browser before upload.
 * Strips heavy camera EXIF headers and reduces 5MB–10MB photos to ~150–250KB
 * with visually lossless 0.82 quality, ensuring instant loading even on slow 3G/4G.
 */
async function compressImage(file: File): Promise<File> {
  // If already an SVG or animated GIF, keep untouched so animation and vector fidelity are preserved
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const renderToCompressedBlob = (
    source: CanvasImageSource,
    origWidth: number,
    origHeight: number
  ): Promise<File | null> => {
    return new Promise((resolve) => {
      try {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(origWidth, origHeight));
        const width = Math.max(1, Math.round(origWidth * scale));
        const height = Math.max(1, Math.round(origHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(source, 0, 0, width, height);

        // Try WebP first for optimal byte-size / visual clarity balance
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
              resolve(new File([blob], name, { type: "image/webp" }));
            } else {
              // Fallback to high-quality progressive JPEG if WebP canvas export fails
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
                    resolve(new File([jpegBlob], name, { type: "image/jpeg" }));
                  } else {
                    resolve(null);
                  }
                },
                "image/jpeg",
                WEBP_QUALITY
              );
            }
          },
          "image/webp",
          WEBP_QUALITY
        );
      } catch {
        resolve(null);
      }
    });
  };

  try {
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        try {
          const compressed = await renderToCompressedBlob(bitmap, bitmap.width, bitmap.height);
          if (compressed) return compressed;
        } finally {
          bitmap.close();
        }
      } catch {
        // createImageBitmap failed (e.g. certain HEIC/camera codecs), fallback to Image element below
      }
    }

    // Fallback using HTMLImageElement
    return await new Promise<File>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        URL.revokeObjectURL(url);
        const compressed = await renderToCompressedBlob(img, img.naturalWidth, img.naturalHeight);
        resolve(compressed || file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  } catch {
    return file;
  }
}

/**
 * Upload device files and return their public URLs.
 *
 * Production (Vercel) has a read-only filesystem and a ~4.5MB server body
 * limit, so files go straight from the browser to Blob storage via a
 * short-lived token minted by /api/studio/blob-upload. When Blob isn't
 * configured (local dev), it falls back to the legacy /api/studio/upload
 * route that writes into public/uploads.
 */
export async function uploadDeviceImages(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f instanceof File && IMAGE_TYPES.includes(f.type));
  if (valid.length === 0) {
    throw new Error("Only JPEG, PNG, WebP, and AVIF images are allowed.");
  }

  // Shrink before sending: keeps Blob usage ~10x lower with no visible loss.
  const compressed = await Promise.all(valid.map(compressImage));

  // Preferred path: direct-to-Blob (works on Vercel, no size bottleneck).
  try {
    const blobs = await Promise.all(
      compressed.map((file) =>
        upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/studio/blob-upload",
        })
      )
    );
    return blobs.map((b) => b.url);
  } catch {
    // Fall through to the legacy local route below.
  }

  // Fallback: legacy server-side route (local dev filesystem).
  const formData = new FormData();
  compressed.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to upload image from device.");

  const urls: string[] = data.urls || (data.url ? [data.url] : []);
  if (urls.length === 0) throw new Error("Failed to upload image from device.");
  return urls;
}
