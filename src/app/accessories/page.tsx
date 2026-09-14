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
  title: "Accessories",
  description:
    "BAGIFYYYY accessories are on the way. Belts, bags, and hardware for finishing a Y2K fit.",
  path: "/accessories",
});

export default async function AccessoriesPage() {
  const products = await queryProducts({ category: "accessories" });
  return (
    <Suspense fallback={<CategoryPageSkeleton title="Accessories" />}>
      <CategoryPageClient
        category="accessories"
        initialProducts={products}
        prefix="Collection"
        title="Accessories"
        badge="COMING SOON"
        subtitle="Belts, bags, and hardware are being lined up now."
      />
    </Suspense>
  );
}
