import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ShowcaseCard from "@/components/product/ShowcaseCard";

export type VintageArchiveItem = {
  id: string;
  name: string;
  price: number;
  images: string[];
  isNew?: boolean;
  isSoldOut: boolean;
  reserved?: boolean;
  sizes?: string[];
  colors?: string[];
};

export default function VintageArchiveSection({ items }: { items: VintageArchiveItem[] }) {
  if (!items.length) return null;

  return (
    <section className="curated-grails-dark w-full bg-[#151518] text-white" data-nav-theme="dark">
      <div className="curated-grails-transition curated-grails-transition-in" aria-hidden="true" />

      <div className="relative bg-[#151518] px-3 pt-6 pb-6 text-white sm:px-6 sm:pt-10 sm:pb-12 md:pt-14 md:pb-16 lg:px-10">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="mb-6 flex items-end justify-between px-2 sm:px-4 md:px-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-display uppercase text-[20px] sm:text-[26px] md:text-[32px] font-bold tracking-[-0.03em] leading-none text-white">
                The good stuff
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 px-2 sm:grid-cols-3 sm:gap-x-5 sm:px-4 md:px-6 lg:grid-cols-4 lg:gap-x-6">
            {items.slice(0, 8).map((item) => (
              <ShowcaseCard
                key={item.id}
                tone="dark"
                product={{
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  images: item.images,
                  isNew: item.isNew,
                  isSoldOut: item.isSoldOut,
                  reserved: item.reserved,
                  sizes: item.sizes,
                  colors: item.colors,
                }}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center px-2 sm:px-4 md:px-6">
            <Link
              href="/topwears"
              className="btn-bagify btn-bagify-light w-full sm:w-auto sm:min-w-[280px] sm:max-w-xs text-[11px] uppercase tracking-[0.14em]"
            >
              <span>Shop all archive pieces</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="curated-grails-transition curated-grails-transition-out" aria-hidden="true" />
    </section>
  );
}
