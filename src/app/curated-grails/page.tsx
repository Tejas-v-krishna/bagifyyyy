import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Curated Grails",
  description:
    "The grails — BAGIFYYYY's most-wanted archive and Y2K pieces, ranked. Single-run garments, no restocks, no replicas.",
  path: "/curated-grails",
});

/**
 * Used to redirect to /#showcase. Now a real listing filtered to `isBestSeller`,
 * so the footer link and the sitemap entry both resolve to actual content.
 */
export default function CuratedGrailsPage() {
  return <CategoryPageClient filter="curated-grails" title="CURATED GRAILS" />;
}
