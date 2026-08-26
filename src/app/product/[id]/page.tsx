import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductForDisplay } from "@/lib/product";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { absoluteUrl, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import ProductDetailClient from "@/components/product/ProductDetailClient";

type Props = { params: Promise<{ id: string }> };

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
  const product = await getProductForDisplay(id);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  const title = `${product.name} — ${categoryLabel(product.category)}`;
  const description = clampDescription(
    product.description ||
      `${product.name} from BAGIFYYYY. ₹${product.price.toLocaleString("en-IN")}. Limited quantity, no restocks.`
  );
  const image = absoluteUrl(product.images[0] || product.image);
  const canonical = `/product/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical },
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
  const product = await getProductForDisplay(id);

  // Renders the sibling not-found.tsx, which keeps the storefront's own
  // "PRODUCT NOT FOUND" screen and returns a real 404 status.
  if (!product) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Drops", path: "/products" },
    { name: categoryLabel(product.category), path: categoryHref(product.category) },
    { name: product.name, path: `/product/${product.id}` },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetailClient product={product} />
    </>
  );
}
