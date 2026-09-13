import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Topwear — Shirts & Tees",
  description:
    "Oversized tees, heavyweight shirts, and jackets from BAGIFYYYY. Y2K shapes in small runs.",
  path: "/topwears",
});

export default async function TopwearsPage() {
  const products = await queryProducts({ category: "topwears" });
  return (
    <CategoryPageClient
      category="topwears"
      initialProducts={products}
      prefix="Collection"
      title="Topwears"
      subtitle="Oversized tees, heavyweight shirts, and jackets in small runs."
    />
  );
}
