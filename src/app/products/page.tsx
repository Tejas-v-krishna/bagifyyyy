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
  title: "All Drops",
  description:
    "The full BAGIFYYYY catalogue: Y2K streetwear, vintage finds, oversized tees, cargos, and heavy denim.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await queryProducts({});
  return (
    <Suspense fallback={<CategoryPageSkeleton title="All Drops" />}>
      <CategoryPageClient
        initialProducts={products}
        prefix="Collection"
        title="All Drops"
      />
    </Suspense>
  );
}
