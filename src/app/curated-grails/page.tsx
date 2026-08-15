import { Metadata } from "next";
import CategoryPageClient from "@/components/product/CategoryPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Curated Grails | BAGIFYYYY Vintage & Archive",
  description: "Hand-selected archival grails, rare designer deadstock, and high-provenance vintage collector pieces.",
};

export default function CuratedGrailsPage() {
  return (
    <CategoryPageClient
      filter="grails"
      title="CURATED GRAILS"
      badge="VAULT SELECTION • 1-OF-1 PIECES"
      subtitle="Hand-selected archival grails, collector-grade vintage, and authenticated provenance."
    />
  );
}
