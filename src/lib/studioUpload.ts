"use client";

import { upload } from "@vercel/blob/client";
import { isSupportedImageFile, IMAGE_FORMATS_HINT } from "./imageFormats";

function isImageFile(file: File): boolean {
  return isSupportedImageFile(file);
}

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
  // If already an SVG or animated GIF, keep untouched so animation and vector fidelity are preserved.
  // Detect by MIME *or* extension — iOS sometimes reports an empty MIME type.
  const nameLower = (file.name || "").toLowerCase();
  const mimeLower = (file.type || "").toLowerCase();
  if (
    mimeLower === "image/svg+xml" ||
    mimeLower === "image/gif" ||
    nameLower.endsWith(".svg") ||
    nameLower.endsWith(".gif")
  ) {
    return file;
  }

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
 * Primary path: /api/studio/upload (streams compressed images directly to Cloudflare R2 / local uploads).
 * Fallback: direct-to-Blob (if Vercel Blob is configured).
 */
export async function uploadDeviceImages(files: File[]): Promise<string[]> {
  const valid = files.filter(isImageFile);
  if (valid.length === 0) {
    throw new Error(`Only image files are allowed (${IMAGE_FORMATS_HINT}).`);
  }

  // Shrink before sending: keeps payload tiny (~150KB-250KB) with no visible loss.
  const compressed = await Promise.all(valid.map(compressImage));

  let lastError: string | null = null;

  // Primary path: /api/studio/upload (streams compressed images directly to Cloudflare R2 with $0 egress)
  try {
    const formData = new FormData();
    compressed.forEach((file) => formData.append("files", file));

    const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const urls: string[] = data.urls || (data.url ? [data.url] : []);
      if (urls.length > 0) return urls;
    } else if (data?.error) {
      lastError = data.error;
    }
  } catch (err) {
    console.warn("Direct R2 / studio upload failed, trying fallback:", err);
  }

  // Fallback: direct-to-Blob (if Vercel Blob is configured)
  try {
    const blobs = await Promise.all(
      compressed.map((file) =>
        upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/studio/blob-upload",
        })
      )
    );
    const urls = blobs.map((b) => b.url);
    if (urls.length > 0) return urls;
  } catch (blobErr) {
    console.warn("Blob upload fallback failed:", blobErr);
  }

  throw new Error(lastError || "Failed to upload image from device. Please check file format and connection.");
}
