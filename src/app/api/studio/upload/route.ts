import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireStudioAuth } from '@/lib/requireStudioAuth';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import {
  IMAGE_MIME_TYPES,
  IMAGE_FORMATS_HINT,
  extFromFilename,
  extFromMime,
  sniffImageMime,
} from '@/lib/imageFormats';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** True when the declared MIME type or the filename extension looks like an image. */
function looksLikeImage(name: string, mime: string): boolean {
  const declared = (mime || '').toLowerCase().trim();
  if (declared.startsWith('image/')) return true;
  if (IMAGE_MIME_TYPES.includes(declared)) return true;
  return extFromFilename(name || '') !== null;
}

/** Pick the on-disk extension for a file we are storing without conversion. */
function resolveExtension(filename: string, mime: string, detectedMime: string | null): string {
  return (
    extFromFilename(filename || '') ||
    extFromMime(mime) ||
    (detectedMime ? extFromMime(detectedMime) : null) ||
    '.jpg'
  );
}

export async function POST(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const filesToProcess: File[] = [];
    if (singleFile) filesToProcess.push(singleFile);
    if (files && files.length > 0) {
      files.forEach((f) => {
        if (!filesToProcess.some((existing) => existing.name === f.name && existing.size === f.size)) {
          filesToProcess.push(f);
        }
      });
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "No image files provided." }, { status: 400 });
    }

    for (const file of filesToProcess) {
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "No valid image files provided." }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Each image must be 15 MB or smaller." }, { status: 400 });
      }

      // Fast path: a known MIME type or extension is enough.
      if (looksLikeImage(file.name || "", file.type || "")) continue;

      // Slow path: no MIME type and no usable extension (common on iOS camera
      // roll) — sniff the file header so the upload still succeeds.
      const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
      if (!sniffImageMime(head)) {
        return NextResponse.json(
          {
            error: `File type not supported for ${file.name || "uploaded file"}. Please upload an image (${IMAGE_FORMATS_HINT}).`,
          },
          { status: 400 }
        );
      }
    }

    const useR2 = isR2Configured();
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!useR2) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);
      let ext = ".webp";
      let contentType = "image/webp";

      const declaredMime = (file.type || "").toLowerCase().trim();
      const nameLower = (file.name || "").toLowerCase();
      const isGif = declaredMime === "image/gif" || nameLower.endsWith(".gif");

      if (isGif) {
        // Keep animated GIFs pristine without flattening frames
        ext = ".gif";
        contentType = "image/gif";
      } else {
        try {
          buffer = await sharp(buffer)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
        } catch (sharpErr) {
          // sharp cannot decode this format (e.g. HEIC on some builds) — store
          // the original bytes under their TRUE extension instead of mislabelling.
          console.warn("Server sharp compression fallback:", sharpErr);
          const detected = sniffImageMime(buffer.subarray(0, 32));
          ext = resolveExtension(file.name, declaredMime, detected);
          contentType = declaredMime || detected || "image/jpeg";
        }
      }

      // Clean filename
      const cleanBaseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const uniqueFilename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanBaseName}${ext}`;

      if (useR2) {
        const r2Url = await uploadToR2({
          buffer,
          key: uniqueFilename,
          contentType,
        });
        uploadedUrls.push(r2Url);
      } else {
        const filePath = path.join(uploadsDir, uniqueFilename);
        await writeFile(filePath, buffer);
        const publicUrl = `/uploads/${uniqueFilename}`;
        uploadedUrls.push(publicUrl);
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Failed to upload image from device.";
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
