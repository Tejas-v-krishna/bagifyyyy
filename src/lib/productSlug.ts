/**
 * Utilities for generating clean, structured, and short product URLs.
 *
 * Example:
 * Product: "Heavy 3D Chrome Star Studded Belt" (id: "c619b068-d064-42b7-8494-1a9386a34710")
 * Structured URL: /product/heavy-3d-chrome-star-studded-belt-c619b068
 * Short share URL: /p/c619b068
 */

export function getProductSlug(product: { id: string; name: string }): string {
  const cleanName = product.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  const shortId = product.id.slice(0, 8);
  return cleanName ? `${cleanName}-${shortId}` : shortId;
}

export function getProductPath(product: { id: string; name?: string }): string {
  if (product.name) {
    return `/product/${getProductSlug({ id: product.id, name: product.name })}`;
  }
  return `/product/${product.id.slice(0, 8)}`;
}

export function getShortProductPath(productId: string): string {
  return `/p/${productId.slice(0, 8)}`;
}
