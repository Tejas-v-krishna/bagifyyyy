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
            // Check if WebP was actually generated (browsers without WebP canvas export return image/png per W3C spec)
            if (blob && (blob.type === "image/webp" || blob.type === "")) {
              // If the file is already small and the blob somehow grew, keep original file
              if (
                blob.size >= file.size &&
                origWidth <= MAX_DIMENSION &&
                origHeight <= MAX_DIMENSION &&
                (mimeLower === "image/webp" || mimeLower === "image/jpeg")
              ) {
                resolve(file);
                return;
              }
              const cleanBase = (file.name || "image").replace(/\.[^.]+$/, "");
              const name = `${cleanBase}.webp`;
              const compressedFile = new File([blob], name, { type: "image/webp" });
              console.log(
                `[Studio Upload] Compressed "${file.name}" (${(file.size / 1024).toFixed(1)} KB) -> "${name}" (${(compressedFile.size / 1024).toFixed(1)} KB, saved ${Math.max(0, Math.round((1 - compressedFile.size / file.size) * 100))}%)`
              );
              resolve(compressedFile);
            } else {
              // Fallback to high-quality progressive JPEG if WebP canvas export is unsupported
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    if (
                      jpegBlob.size >= file.size &&
                      origWidth <= MAX_DIMENSION &&
                      origHeight <= MAX_DIMENSION &&
                      mimeLower === "image/jpeg"
                    ) {
                      resolve(file);
                      return;
                    }
                    const cleanBase = (file.name || "image").replace(/\.[^.]+$/, "");
                    const name = `${cleanBase}.jpg`;
                    const compressedFile = new File([jpegBlob], name, { type: "image/jpeg" });
                    console.log(
                      `[Studio Upload] Compressed (JPEG fallback) "${file.name}" (${(file.size / 1024).toFixed(1)} KB) -> "${name}" (${(compressedFile.size / 1024).toFixed(1)} KB)`
                    );
                    resolve(compressedFile);
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
      } catch (err) {
        console.warn("[Studio Upload] Canvas compression error:", err);
        resolve(null);
      }
    });
  };

  try {
    if (typeof createImageBitmap === "function") {
      try {
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch {
          bitmap = await createImageBitmap(file);
        }
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
 * Upload a single image file to /api/studio/upload, with direct-to-Blob fallback.
 */
async function uploadSingleImage(file: File): Promise<string> {
  let fileToSend: File;
  try {
    fileToSend = await compressImage(file);
  } catch (compErr) {
    console.warn("Client-side image compression failed, falling back to original file:", compErr);
    fileToSend = file;
  }

  let lastError: string | null = null;

  // Primary path: /api/studio/upload (streams compressed image directly to Cloudflare R2 with $0 egress)
  try {
    const formData = new FormData();
    formData.append("file", fileToSend);

    const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const url: string = data.url || (data.urls && data.urls[0]);
      if (url) return url;
    } else {
      if (data?.error) {
        lastError = data.error;
      } else if (res.status === 413) {
        lastError = `Photo "${file.name}" exceeds the server maximum upload size.`;
      } else if (res.status === 401) {
        lastError = "Admin session expired or unauthorized. Please re-login.";
      } else {
        lastError = `Server returned error (${res.status} ${res.statusText})`;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Direct R2 upload failed for single image, trying fallback:", err);
    if (!lastError) lastError = msg;
  }

  // Fallback: direct-to-Blob (if Vercel Blob is configured)
  try {
    const blob = await upload(fileToSend.name, fileToSend, {
      access: "public",
      handleUploadUrl: "/api/studio/blob-upload",
    });
    if (blob?.url) return blob.url;
  } catch (blobErr) {
    console.warn("Blob upload fallback failed:", blobErr);
  }

  // Second fallback: if compressed file failed on server, try sending raw original file once
  if (fileToSend !== file && file.size < 4.2 * 1024 * 1024) {
    try {
      const rawFormData = new FormData();
      rawFormData.append("file", file);

      const rawRes = await fetch("/api/studio/upload", { method: "POST", body: rawFormData });
      const rawData = await rawRes.json().catch(() => ({}));
      if (rawRes.ok) {
        const url: string = rawData.url || (rawData.urls && rawData.urls[0]);
        if (url) return url;
      } else if (rawData?.error) {
        lastError = rawData.error;
      }
    } catch {
      // ignore secondary raw fallback error
    }
  }

  throw new Error(lastError || `Failed to upload image "${file.name}". Please check file format and connection.`);
}

export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
}

export async function uploadDeviceImages(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> {
  const valid = files.filter(isImageFile);
  if (valid.length === 0) {
    throw new Error(`Only image files are allowed (${IMAGE_FORMATS_HINT}).`);
  }

  // Upload files individually to keep mobile memory low and stay within payload limits
  const uploadedUrls: string[] = [];
  for (let i = 0; i < valid.length; i++) {
    const file = valid[i];
    onProgress?.({ current: i + 1, total: valid.length, fileName: file.name });
    const url = await uploadSingleImage(file);
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}
