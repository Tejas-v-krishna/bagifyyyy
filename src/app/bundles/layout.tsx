import type { Metadata } from "next";
import { collectionMetadata } from "@/lib/seo";

export const metadata: Metadata = collectionMetadata({
  title: "Bundles",
  description:
     "BAGIFYYYY bundles: matching Y2K streetwear sets at a lower set price.",
  path: "/bundles",
});

export default function BundlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
