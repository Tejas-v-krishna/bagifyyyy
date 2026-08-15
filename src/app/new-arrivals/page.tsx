import { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Arrivals | BAGIFYYYY Vintage & Archive",
  description: "Freshly sourced Y2K garments, rare deadstock capsules, and verified 1-of-1 archive drops.",
};

export default function NewArrivalsPage() {
  return (
    <CategoryPageClient
      filter="new"
      title="NEW ARRIVALS"
      badge="JUST DROPPED • SOURCED WEEKLY"
      subtitle="Latest hand-picked vintage items, rare deadstock, and archival grails."
    />
  );
}
