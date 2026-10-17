import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudioAuth } from "@/lib/requireStudioAuth";

type ReviewImage = { src: string; alt?: string };

function clean(images: unknown): ReviewImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter(
      (img): img is ReviewImage =>
        Boolean(img && typeof (img as ReviewImage).src === "string")
    )
    .map((img) => ({
      src: img.src.trim(),
      alt: typeof img.alt === "string" ? img.alt.slice(0, 120) : "",
    }))
    .filter((img) => img.src.length > 0)
    .slice(0, 30);
}

export async function GET() {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "community_reviews" },
    });
    if (row?.value) {
      const parsed = JSON.parse(row.value) as { images?: ReviewImage[] };
      return NextResponse.json({ images: clean(parsed.images) });
    }
  } catch (err) {
    console.warn("Could not read community reviews:", err);
  }
  return NextResponse.json({ images: [] });
}

export async function POST(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const images = clean(body?.images);

    await prisma.siteSetting.upsert({
      where: { key: "community_reviews" },
      update: { value: JSON.stringify({ images, updatedAt: new Date().toISOString() }) },
      create: {
        key: "community_reviews",
        value: JSON.stringify({ images, updatedAt: new Date().toISOString() }),
      },
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Error saving community reviews:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 }
    );
  }
}
