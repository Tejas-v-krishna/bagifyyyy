import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireStudioAuth } from '@/lib/requireStudioAuth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

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
      if (!(file instanceof File) || !IMAGE_EXTENSIONS[file.type]) {
        return NextResponse.json({ error: "Only JPEG, PNG, WebP, and AVIF images are allowed." }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Each image must be 10 MB or smaller." }, { status: 400 });
      }
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const ext = IMAGE_EXTENSIONS[file.type];
      const cleanBaseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const uniqueFilename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanBaseName}${ext}`;

      const filePath = path.join(uploadsDir, uniqueFilename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${uniqueFilename}`;
      uploadedUrls.push(publicUrl);
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
