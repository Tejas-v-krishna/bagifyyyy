import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ArchiveModeNotice from "@/components/product/ArchiveModeNotice";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { getProductPath } from "@/lib/productSlug";
import type { ProductForDisplay } from "@/lib/product";

/**
 * Product page served from the offline catalogue snapshot.
 *
 * Upstream `ProductDetailClient` owns bag holds, stock polling and checkout,
 * all of which need live database reads — so an archive piece gets a
 * read-only page instead of a buy button that cannot possibly succeed.
 */
export default function ArchiveProductPreview({ product }: { product: ProductForDisplay }) {
  const images = product.images.length > 0 ? product.images : [product.image];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 font-sans text-black">
      <Link
        href={categoryHref(product.category)}
        className="inline-flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/50 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to {categoryLabel(product.category)}
      </Link>

      <div className="mt-6">
        <ArchiveModeNotice />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#e9e9ec]">
            <Image
              src={images[0] || "/placeholder.jpg"}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 9).map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#e9e9ec]"
                >
                  <Image
                    src={src}
                    alt={`${product.name} view ${index + 2}`}
                    fill
                    sizes="(max-width: 1023px) 25vw, 14vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-black/60">
            Archive · Read only
          </span>
          <h1 className="mt-4 font-microgramma text-[clamp(1.6rem,3.2vw,2.6rem)] font-bold uppercase leading-[0.95] tracking-tight">
            {product.name}
          </h1>
          {product.brand && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {product.brand}
            </p>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-[22px] font-semibold tracking-tight">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {typeof product.compareAtPrice === "number" && product.compareAtPrice > product.price && (
              <span className="text-sm text-black/35 line-through">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-[13px] leading-relaxed text-black/65">
              {product.description}
            </p>
          )}

          <div className="mt-8 rounded-xl border border-black/10 bg-[#fafafa] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">
              Checkout temporarily closed
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-black/60">
              Our live stock is offline, so this piece cannot be reserved or bought right now.
              Prices and availability from the archive view may be out of date. Message us and we
              will confirm the piece the moment the catalogue is back.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="btn-bagify btn-bagify-dark px-7 text-[11px] font-bold uppercase tracking-[0.14em]"
              >
                <span>Ask about this piece</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-black/[0.03]"
              >
                Browse the archive
              </Link>
            </div>
          </div>
        </div>
      </div>

      {product.relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-black/10 pt-10">
          <h2 className="font-microgramma text-lg font-bold uppercase tracking-tight">
            Also in the archive
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {product.relatedProducts.map((related) => (
              <Link key={related.id} href={getProductPath(related)} className="group block">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-[#e9e9ec]">
                  <Image
                    src={related.image || "/placeholder.jpg"}
                    alt={related.name}
                    fill
                    sizes="(max-width: 639px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-3 truncate text-[12px] font-semibold tracking-tight">
                  {related.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
