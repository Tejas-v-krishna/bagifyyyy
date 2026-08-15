import CategoryPageClient from "@/components/product/CategoryPageClient";

export const dynamic = "force-dynamic";

export default function AccessoriesPage() {
  return (
    <CategoryPageClient
      category="accessories"
      title="Accessories"
      badge="COMING SOON • ARCHIVE SOURCING"
      subtitle="Accessories archive drops are currently being sourced."
    />
  );
}
