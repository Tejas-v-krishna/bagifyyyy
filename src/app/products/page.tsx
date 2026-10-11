import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
