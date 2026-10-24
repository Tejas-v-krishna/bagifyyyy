import BundlesPageClient from "./BundlesPageClient";
import { queryBundles } from "@/lib/bundles";

export const revalidate = 60; // ISR: edge-cached 60s; revalidatePath fires on purchases/edits so stock stays fresh

export default async function BundlesPage() {
  const bundles = await queryBundles();
  return <BundlesPageClient initialBundles={bundles} />;
}
