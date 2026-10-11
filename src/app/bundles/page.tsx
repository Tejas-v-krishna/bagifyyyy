import BundlesPageClient from "./BundlesPageClient";
import { queryBundles } from "@/lib/bundles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BundlesPage() {
  const bundles = await queryBundles();
  return <BundlesPageClient initialBundles={bundles} />;
}
