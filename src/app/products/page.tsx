import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "All Drops",
  description:
    "The full BAGIFYYYY catalogue — Y2K streetwear, archive fashion, and limited drops. Oversized tees, cyber cargos, heavy denim. No restocks, no replicas.",
  path: "/products",
});

export default function ProductsPage() {
  return <CategoryPageClient title="ALL DROPS" />;
}
