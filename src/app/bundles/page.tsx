import BundlesPageClient from "./BundlesPageClient";
import { queryBundles } from "@/lib/bundles";

export const revalidate = 900; // ISR: edge-cached 15m. Purchases and studio edits call revalidatePath, so on-demand freshness is exact; the interval only bounds how often an idle route re-reads Turso.

export default async function BundlesPage() {
  const bundles = await queryBundles();
  return <BundlesPageClient initialBundles={bundles} />;
}
