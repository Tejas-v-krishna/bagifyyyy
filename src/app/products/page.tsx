import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const revalidate = 900; // ISR: edge-cached 15m. Purchases and studio edits call revalidatePath, so on-demand freshness is exact; the interval only bounds how often an idle route re-reads Turso.

export const metadata: Metadata = collectionMetadata({
  title: "All Products",
  description:
    "The full BAGIFYYYY catalogue: Y2K streetwear, vintage finds, oversized tees, cargos, and heavy denim.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await queryProducts({});
  return (
    <Suspense fallback={<CategoryPageSkeleton title="All Pieces" />}>
      <CategoryPageClient
        initialProducts={products}
        prefix="Catalogue"
        title="All Pieces"
        subtitle="The entire BAGIFYYYY collection. Small-run streetwear and archive vintage."
      />
    </Suspense>
  );
}
