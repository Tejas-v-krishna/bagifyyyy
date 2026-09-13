import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";
import { queryProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "All Drops",
  description:
    "The full BAGIFYYYY catalogue: Y2K streetwear, vintage finds, oversized tees, cargos, and heavy denim.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await queryProducts({});
  return (
    <CategoryPageClient
      initialProducts={products}
      prefix="Collection"
      title="All Drops"
    />
  );
}
