import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "Bottomwear — Pants & Cargos",
  description:
    "Cyber cargos, heavy denim, and archive bottomwear from BAGIFYYYY. Y2K streetwear cuts, limited quantity, no restocks.",
  path: "/bottomwears",
});

export default function BottomwearsPage() {
  return <CategoryPageClient category="bottomwears" title="PANTS & CARGOS" />;
}
