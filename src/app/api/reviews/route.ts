import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_REVIEWS } from "@/data/customerReviews";

// Public feed for the product-page reviews strip. Short edge cache:
// reviews change only when the owner saves in /studio/reviews.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "community_reviews" },
    });
    if (row?.value) {
      const parsed = JSON.parse(row.value) as {
        images?: { src: string; alt?: string }[];
      };
      const images = (parsed.images ?? []).filter(
        (img): img is { src: string; alt?: string } =>
          Boolean(img && typeof img.src === "string" && img.src.trim())
      );
      return NextResponse.json({ images }, { headers: CACHE_HEADERS });
    }
  } catch (err) {
    console.warn("Could not read community reviews:", err);
  }

  return NextResponse.json({ images: CUSTOMER_REVIEWS }, { headers: CACHE_HEADERS });
}
