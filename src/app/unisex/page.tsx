import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Unisex",
  description:
    "Unisex pieces from BAGIFYYYY — Y2K streetwear and archive fashion cut to be worn by anyone. Limited quantity, no restocks.",
  path: "/unisex",
});

export default function UnisexPage() {
  return <CategoryPageClient category="unisex" title="UNISEX" />;
}
