import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const revalidate = 900; // ISR: edge-cached 15m. Purchases and studio edits call revalidatePath, so on-demand freshness is exact; the interval only bounds how often an idle route re-reads Turso.

export const metadata: Metadata = collectionMetadata({
  title: "Topwear: Shirts & Tees",
  description:
    "Oversized tees, heavyweight shirts, and jackets from BAGIFYYYY. Y2K shapes in small runs.",
  path: "/topwears",
});

export default async function TopwearsPage() {
  const products = await queryProducts({ category: "topwears" });
  return (
    <Suspense fallback={<CategoryPageSkeleton title="Topwears" />}>
      <CategoryPageClient
        category="topwears"
        initialProducts={products}
        prefix="Collection"
        title="Topwears"
        subtitle="Oversized tees, heavyweight shirts, and jackets in small runs."
      />
    </Suspense>
  );
}
