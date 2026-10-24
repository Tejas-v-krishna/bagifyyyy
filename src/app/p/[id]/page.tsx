import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import { getProductForDisplay } from "@/lib/product";
import { getProductPath } from "@/lib/productSlug";
import { categoryLabel } from "@/lib/categories";
import { absoluteUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 900;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForDisplay(id);

  if (!product) {
    return {
      title: "Piece Not Found · BAGIFYYYY",
      robots: { index: false, follow: true },
    };
  }

  const title = `${product.name} · ${categoryLabel(product.category)} · BAGIFYYYY`;
  const description =
    product.description ||
    `${product.name} from BAGIFYYYY. ₹${product.price.toLocaleString("en-IN")}. 1-of-1 archival drop, no restocks.`;
  const image = absoluteUrl(product.images[0] || product.image);
  const targetPath = getProductPath(product);

  return {
    title,
    description,
    alternates: { canonical: targetPath },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(targetPath),
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

export default async function ShortLinkProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductForDisplay(id);

  if (!product) {
    notFound();
  }

  const destination = getProductPath(product);
  permanentRedirect(destination);
}
