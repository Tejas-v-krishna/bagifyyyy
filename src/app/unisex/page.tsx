import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const revalidate = 60; // ISR: edge-cached 60s; revalidatePath fires on purchases/edits so stock stays fresh

export const metadata: Metadata = collectionMetadata({
  title: "Unisex",
  description:
    "Unisex pieces from BAGIFYYYY: Y2K streetwear made for whoever wants to wear it.",
  path: "/unisex",
});

export default async function UnisexPage() {
  const products = await queryProducts({ category: "unisex" });
  return (
    <Suspense fallback={<CategoryPageSkeleton title="Unisex" />}>
      <CategoryPageClient
        category="unisex"
        initialProducts={products}
        prefix="Collection"
        title="Unisex"
      />
    </Suspense>
  );
}
