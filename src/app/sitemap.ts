import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bagifyyyy.in";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/topwears",
    "/bottomwears",
    "/accessories",
    "/bundles",
    "/new-arrivals",
    "/curated-grails",
    "/shipping",
    "/customer-service",
    "/faq",
    "/size-guide",
    "/terms",
    "/privacy-policy",
    "/traceability",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/products" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/products") ? 0.9 : 0.7,
  }));

  try {
    // Dynamic products
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
