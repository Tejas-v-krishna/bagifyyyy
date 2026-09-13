import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Bottomwear — Pants & Cargos",
  description:
    "Cargos, heavy denim, and wide-leg trousers from BAGIFYYYY. Y2K cuts in small runs.",
  path: "/bottomwears",
});

export default async function BottomwearsPage() {
  const products = await queryProducts({ category: "bottomwears" });
  return (
    <CategoryPageClient
      category="bottomwears"
      initialProducts={products}
      prefix="Collection"
      title="Bottomwears"
      subtitle="Cargos, heavy denim, and wide-leg trousers in small runs."
    />
  );
}
