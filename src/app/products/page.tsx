import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "All Drops",
  description:
     "The full BAGIFYYYY catalogue: Y2K streetwear, vintage finds, oversized tees, cargos, and heavy denim.",
  path: "/products",
});

export default function ProductsPage() {
  return <CategoryPageClient prefix="Collection" title="All Drops" />;
}
