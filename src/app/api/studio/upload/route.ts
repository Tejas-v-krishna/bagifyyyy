import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
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

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const ext = path.extname(file.name) || ".jpg";
      const cleanBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
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
  } catch (error: any) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "Failed to upload image from device." }, { status: 500 });
  }
}
