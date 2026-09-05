import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Topwear — Shirts & Tees",
  description:
     "Oversized tees, heavyweight shirts, and jackets from BAGIFYYYY. Y2K shapes in small runs.",
  path: "/topwears",
});

export default function TopwearsPage() {
  return (
    <CategoryPageClient
      category="topwears"
      prefix="Collection"
      title="Topwears"
       subtitle="Oversized tees, heavyweight shirts, and jackets in small runs."
    />
  );
}
