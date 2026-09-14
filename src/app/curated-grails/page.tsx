import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

// Static shell + 30s ISR: cached HTML instead of a fresh remote DB query.
export const revalidate = 30;

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
    <Suspense fallback={<CategoryPageSkeleton title="Hard-to-find pieces" />}>
      <CategoryPageClient
        filter="curated-grails"
        initialProducts={products}
        prefix="Collection"
        title="Hard-to-find pieces"
      />
    </Suspense>
  );
}
