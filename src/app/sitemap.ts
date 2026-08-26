import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

/**
 * Only canonical, self-resolving URLs belong here. Routes that just `redirect()`
 * used to be listed (`/new-arrivals`, `/curated-grails`), which Search Console
 * reports as "Page with redirect" and declines to index — those two are now real
 * listing pages, and the remaining redirect stubs (`/footwears`, `/top-picks`)
 * stay out of the sitemap deliberately.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/topwears",
    "/bottomwears",
    "/unisex",
    "/accessories",
    "/bundles",
    "/new-arrivals",
    "/curated-grails",
    "/about",
    "/contact",
    "/track",
    "/shipping",
    "/customer-service",
    "/faq",
    "/size-guide",
    "/terms",
    "/privacy-policy",
    "/right-of-withdrawal",
    "/traceability",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/products" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/products") ? 0.9 : 0.7,
  }));

  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      take: 1000,
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
