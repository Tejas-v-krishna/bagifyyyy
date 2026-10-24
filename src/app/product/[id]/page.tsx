import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getProductForDisplay } from "@/lib/product";
import { getProductPath } from "@/lib/productSlug";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { absoluteUrl, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ArchiveProductPreview from "@/components/product/ArchiveProductPreview";

import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 60; // ISR: edge-cached 60s; revalidatePath fires on purchases/edits so stock stays fresh

// Metadata + page both need the same product — share one DB hit per render
// instead of querying twice.
const getProduct = cache(getProductForDisplay);

/** Meta descriptions get truncated around 160 characters, so do it on a word. */
function clampDescription(text: string, limit = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  const title = `${product.name} · ${categoryLabel(product.category)}`;
  const description = clampDescription(
    product.description ||
      `${product.name} from BAGIFYYYY. ₹${product.price.toLocaleString("en-IN")}. Limited quantity, no restocks.`
  );
  const image = absoluteUrl(product.images[0] || product.image);
  const canonical = getProductPath(product);

  return {
    title,
    description,
    alternates: { canonical },
    // Snapshot pages are a temporary stand-in for live stock — keep them out
    // of the index so stale prices never become the search result.
    robots: product.fallback ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: "BAGIFYYYY",
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center font-sans">
        <div className="max-w-md w-full border border-black/10 rounded-2xl bg-[#fafafa] p-8 sm:p-10 shadow-xs">
          <span className="inline-block rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-black/60 mb-4">
            ARCHIVE NOTICE
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black mb-3">
            THIS PIECE IS ALREADY GONE
          </h1>
          <p className="font-sans text-xs sm:text-sm text-black/60 leading-relaxed mb-6">
            This 1-of-1 archival piece has been acquired or archived. Since every drop is a single original, it will not be restocked.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors"
          >
            EXPLORE LIVE DROPS →
          </Link>
        </div>
      </main>
    );
  }

  if (product.fallback) {
    return <ArchiveProductPreview product={product} />;
  }

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Drops", path: "/products" },
    { name: categoryLabel(product.category), path: categoryHref(product.category) },
    { name: product.name, path: getProductPath(product) },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetailClient product={product} />
    </>
  );
}
