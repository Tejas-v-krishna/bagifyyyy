import CategoryPageClient from "@/components/product/CategoryPageClient";

export const dynamic = "force-dynamic";

export default function FootwearsPage() {
  return (
    <CategoryPageClient
      category="footwears"
      title="Footwears"
      badge="COMING SOON • ARCHIVE SOURCING"
      subtitle="Footwear drops are currently being curated and authenticated."
    />
  );
}
