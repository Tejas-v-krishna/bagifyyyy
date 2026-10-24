import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const revalidate = 60; // ISR: edge-cached 60s; revalidatePath fires on purchases/edits so stock stays fresh

export const metadata: Metadata = collectionMetadata({
  title: "New Arrivals",
  description:
    "The latest BAGIFYYYY pieces: Y2K streetwear, vintage finds, and small-run releases.",
  path: "/new-arrivals",
});

/**
 * Used to redirect to /#showcase, which meant the footer's "New Arrivals" link
 * dropped you on the homepage and told Google the URL was a redirect. It is now
 * a real listing filtered to `isNew`, which is what the sitemap already claims.
 */
export default async function NewArrivalsPage() {
  const products = await queryProducts({ filter: "new" });
  return (
    <Suspense fallback={<CategoryPageSkeleton title="New In" />}>
      <CategoryPageClient
        filter="new"
        initialProducts={products}
        prefix="Collection"
        title="New In"
      />
    </Suspense>
  );
}
