import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireStudioAuth } from '@/lib/requireStudioAuth';
import { isR2Configured, uploadToR2 } from '@/lib/r2';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/heic": ".jpg",
  "image/heif": ".jpg",
};

function getFileExtension(filename: string, mime: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return ".jpg";
  if (ext === ".png") return ".png";
  if (ext === ".webp") return ".webp";
  if (ext === ".avif") return ".avif";
  if (ext === ".gif") return ".gif";
  if (ext === ".heic" || ext === ".heif") return ".jpg";
  return IMAGE_EXTENSIONS[mime.toLowerCase()] || ".jpg";
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
      const typeLower = (file.type || "").toLowerCase();
      const ext = path.extname(file.name || "").toLowerCase();
      const isKnownType = IMAGE_EXTENSIONS[typeLower] || [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".heic", ".heif"].includes(ext);

      if (!(file instanceof File) || !isKnownType) {
        return NextResponse.json({ error: `File type not supported for ${file.name || "uploaded file"}. Please upload JPEG, PNG, WebP, or AVIF.` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Each image must be 15 MB or smaller." }, { status: 400 });
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

      if (file.type === "image/gif") {
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
          console.warn("Server sharp compression fallback:", sharpErr);
          ext = getFileExtension(file.name, file.type);
          contentType = file.type || "image/jpeg";
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
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "Failed to upload image from device." }, { status: 500 });
  }
}
