import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Accessories",
  description:
    "BAGIFYYYY accessories — archive sourcing in progress. Belts, bags, and hardware to finish a Y2K fit. Drops announced as they land.",
  path: "/accessories",
});

export default function AccessoriesPage() {
  return (
    <CategoryPageClient
      category="accessories"
      title="ACCESSORIES"
      badge="COMING SOON • ARCHIVE SOURCING"
      subtitle="Accessories archive drops are currently being sourced."
    />
  );
}
