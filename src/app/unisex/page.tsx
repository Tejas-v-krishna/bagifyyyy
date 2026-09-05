import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Unisex",
  description:
     "Unisex pieces from BAGIFYYYY: Y2K streetwear made for whoever wants to wear it.",
  path: "/unisex",
});

export default function UnisexPage() {
  return <CategoryPageClient category="unisex" prefix="Collection" title="Unisex" />;
}
