import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductFlexCarousel from "@/components/ui/ProductFlexCarousel";

export type VintageArchiveItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  reserved?: boolean;
  sizes?: string[];
  colors?: string[];
};

export default function VintageArchiveSection({ items }: { items: VintageArchiveItem[] }) {
  if (!items.length) return null;

  const products = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image || "/placeholder.jpg",
  }));

  return (
    <section className="curated-grails-dark w-full bg-[#151518] text-white" data-nav-theme="dark">
      <div className="curated-grails-transition curated-grails-transition-in" aria-hidden="true" />

      <div className="relative bg-[#151518] px-3 py-20 text-white sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="mb-6 flex items-end justify-between px-2 sm:px-4 md:px-6">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[11px] sm:text-[12px] tracking-[0.14em] font-medium text-white/50">
                Hard-to-find pieces
              </span>
              <h2 className="font-display uppercase text-[20px] sm:text-[26px] md:text-[32px] font-bold tracking-[-0.03em] leading-none text-white">
                The good stuff
              </h2>
            </div>
            <Link
              href="/curated-grails"
              className="h-9 sm:h-10 inline-flex items-center gap-2 rounded-[15px] px-4 sm:px-5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap bg-white text-black hover:bg-white/85"
            >
              <span>See all pieces</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="text-white [&_span]:!text-white">
            <ProductFlexCarousel products={products} />
          </div>
        </div>
      </div>

      <div className="curated-grails-transition curated-grails-transition-out" aria-hidden="true" />
    </section>
  );
}
