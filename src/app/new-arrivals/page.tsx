import type { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";
import { collectionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = collectionMetadata({
  title: "New Arrivals",
  description:
    "The latest BAGIFYYYY drops — newest Y2K streetwear and archive pieces first. Limited quantity, no restocks, no replicas.",
  path: "/new-arrivals",
});

/**
 * Used to redirect to /#showcase, which meant the footer's "New Arrivals" link
 * dropped you on the homepage and told Google the URL was a redirect. It is now
 * a real listing filtered to `isNew`, which is what the sitemap already claims.
 */
export default function NewArrivalsPage() {
  return <CategoryPageClient filter="new" title="NEW ARRIVALS" />;
}
