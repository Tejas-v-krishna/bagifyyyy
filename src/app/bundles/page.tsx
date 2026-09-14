import BundlesPageClient from "./BundlesPageClient";
import { queryBundles } from "@/lib/bundles";

// Static shell + 30s ISR: the navbar "Bundles" link lands on cached HTML with
// the catalogue already baked in, instead of fetching /api/bundles client-side.
export const revalidate = 30;

export default async function BundlesPage() {
  const bundles = await queryBundles();
  return <BundlesPageClient initialBundles={bundles} />;
}
