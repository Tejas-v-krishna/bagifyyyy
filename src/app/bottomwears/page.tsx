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
  title: "Bottomwear — Pants & Cargos",
  description:
    "Cargos, heavy denim, and wide-leg trousers from BAGIFYYYY. Y2K cuts in small runs.",
  path: "/bottomwears",
});

export default async function BottomwearsPage() {
  const products = await queryProducts({ category: "bottomwears" });
  return (
    <Suspense fallback={<CategoryPageSkeleton title="Bottomwears" />}>
      <CategoryPageClient
        category="bottomwears"
        initialProducts={products}
        prefix="Collection"
        title="Bottomwears"
        subtitle="Cargos, heavy denim, and wide-leg trousers in small runs."
      />
    </Suspense>
  );
}
