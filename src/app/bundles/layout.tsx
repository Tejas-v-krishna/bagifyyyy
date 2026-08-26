import type { Metadata } from "next";
import { collectionMetadata } from "@/lib/seo";

export const metadata: Metadata = collectionMetadata({
  title: "Bundles",
  description:
    "BAGIFYYYY bundles — curated Y2K streetwear sets at a set price. Build a full fit from archive pieces in one drop.",
  path: "/bundles",
});

export default function BundlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
