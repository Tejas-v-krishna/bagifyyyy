import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

// Static shell + 30s ISR: navbar clicks land on cached HTML instantly instead
// of waiting on a fresh remote DB query every time.
export const revalidate = 30;

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
