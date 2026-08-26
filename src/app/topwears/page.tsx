import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Topwear — Shirts & Tees",
  description:
    "Oversized tees, heavyweight shirts, and archive topwear from BAGIFYYYY. Y2K streetwear silhouettes, limited quantity, no restocks.",
  path: "/topwears",
});

export default function TopwearsPage() {
  return <CategoryPageClient category="topwears" title="SHIRTS & TEES" />;
}
