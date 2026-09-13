import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Hard-to-find pieces",
  description:
    "Hard-to-find vintage and Y2K pieces from BAGIFYYYY. Small quantities, no replicas, and no promise of a restock.",
  path: "/curated-grails",
});

/**
 * Used to redirect to /#showcase. Now a real listing filtered to `isBestSeller`,
 * so the footer link and the sitemap entry both resolve to actual content.
 */
export default async function CuratedGrailsPage() {
  const products = await queryProducts({ filter: "curated-grails" });
  return (
    <CategoryPageClient
      filter="curated-grails"
      initialProducts={products}
      prefix="Collection"
      title="Hard-to-find pieces"
    />
  );
}
