import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Bottomwear — Pants & Cargos",
  description:
     "Cargos, heavy denim, and wide-leg trousers from BAGIFYYYY. Y2K cuts in small runs.",
  path: "/bottomwears",
});

export default function BottomwearsPage() {
  return (
    <CategoryPageClient
      category="bottomwears"
      prefix="Collection"
      title="Bottomwears"
       subtitle="Cargos, heavy denim, and wide-leg trousers in small runs."
    />
  );
}
