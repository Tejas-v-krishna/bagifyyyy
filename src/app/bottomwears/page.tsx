import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import CategoryPageSkeleton from "@/components/product/CategoryPageSkeleton";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const revalidate = 900; // ISR: edge-cached 15m. Purchases and studio edits call revalidatePath, so on-demand freshness is exact; the interval only bounds how often an idle route re-reads Turso.

export const metadata: Metadata = collectionMetadata({
  title: "Bottomwear: Pants & Cargos",
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
