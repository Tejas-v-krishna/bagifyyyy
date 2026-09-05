import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Accessories",
  description:
     "BAGIFYYYY accessories are on the way. Belts, bags, and hardware for finishing a Y2K fit.",
  path: "/accessories",
});

export default function AccessoriesPage() {
  return (
    <CategoryPageClient
      category="accessories"
      prefix="Collection"
      title="Accessories"
       badge="COMING SOON"
       subtitle="Belts, bags, and hardware are being lined up now."
    />
  );
}
