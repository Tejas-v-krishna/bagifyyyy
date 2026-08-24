/**
 * The categories a product can be filed under, and where each one lives on the
 * storefront. This is the only place that mapping is written down.
 *
 * Rows in the database carry both spellings: the seeded catalogue uses the
 * plural form ("topwears") and the studio used to write the singular form
 * ("topwear"), which meant a product created in the studio got a breadcrumb
 * pointing at /topwear, a route that does not exist. Everything canonical is
 * plural, because that is what the storefront routes are named.
 */

export type Category = {
  /** Canonical value stored on Product.category, and the storefront path. */
  slug: string;
  /** What the studio dropdown and the product breadcrumb show. */
  label: string;
  /** Extra spellings that have been written to the database over time. */
  aliases: string[];
};

export const CATEGORIES: Category[] = [
  { slug: "topwears", label: "Topwear", aliases: ["topwear", "tops", "top"] },
  { slug: "bottomwears", label: "Bottomwear", aliases: ["bottomwear", "bottoms", "bottom"] },
  { slug: "footwears", label: "Footwear", aliases: ["footwear", "shoes", "shoe"] },
  { slug: "accessories", label: "Accessories", aliases: ["accessory"] },
  { slug: "unisex", label: "Unisex", aliases: [] },
];

/** Resolves whatever is on a product row to a known category, or null. */
export function findCategory(value?: string | null): Category | null {
  if (!value) return null;
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  return (
    CATEGORIES.find((c) => c.slug === needle || c.aliases.includes(needle)) ?? null
  );
}

/** The canonical slug to store, falling back to the value as given. */
export function canonicalCategory(value?: string | null): string {
  return findCategory(value)?.slug ?? (value ?? "").trim().toLowerCase();
}

/**
 * A storefront path that is guaranteed to resolve. Unknown categories go to the
 * full catalogue rather than to a 404.
 */
export function categoryHref(value?: string | null): string {
  const category = findCategory(value);
  return category ? `/${category.slug}` : "/products";
}

/** A human label for display, falling back to the stored value. */
export function categoryLabel(value?: string | null): string {
  const category = findCategory(value);
  if (category) return category.label;
  return value?.trim() ? value.trim() : "Collection";
}
