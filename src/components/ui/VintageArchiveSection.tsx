import InteractiveShowcase from "@/components/ui/InteractiveShowcase";

export type VintageArchiveItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  sizes?: string[];
  colors?: string[];
};

export default function VintageArchiveSection({ items }: { items: VintageArchiveItem[] }) {
  if (!items.length) return null;

  const products = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    isSoldOut: item.isSoldOut,
    images: [{ url: item.image || "/placeholder.jpg" }],
    sizes: item.sizes,
    colors: item.colors,
  }));

  return (
    <section className="curated-grails-dark w-full bg-black" data-nav-theme="dark">
      <div className="curated-grails-transition curated-grails-transition-in" aria-hidden="true" />

      <div className="relative bg-black px-3 py-20 sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <InteractiveShowcase
          products={products}
          eyebrow="Hard-to-find pieces"
          heading="The good stuff"
          viewAllHref="/curated-grails"
          ariaLabel="Hard-to-find pieces"
          mirroredLayout
          tone="dark"
        />
      </div>

      <div className="curated-grails-transition curated-grails-transition-out" aria-hidden="true" />
    </section>
  );
}
