import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Sanity publish webhook → instant content refresh.
 *
 * Point a Sanity webhook at POST /api/sanity-revalidate with the shared
 * secret. Avoids waiting out the 5-minute content cache after an edit.
 * Content-only: this touches the "sanity*" cache tags, never product,
 * stock, or order data.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-sanity-revalidate-secret");

  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tag = "sanity";
  try {
    const body = await request.json();
    // Sanity sends the changed document's _type; map it to the matching tag.
    const typeMap: Record<string, string> = {
      hero: "sanity:hero",
      ticker: "sanity:ticker",
      manifesto: "sanity:manifesto",
      faqPage: "sanity:faq",
      aboutPage: "sanity:about",
    };
    if (body?._type && typeMap[body._type]) {
      tag = typeMap[body._type];
    }
  } catch {
    // No JSON body (e.g. manual curl) — fall back to the umbrella tag.
  }

  // Two-arg form is required in this Next version; single-arg is deprecated.
  revalidateTag(tag, "max");
  if (tag !== "sanity") {
    revalidateTag("sanity", "max");
  }

  return NextResponse.json({ revalidated: true, tag });
}
