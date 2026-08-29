/**
 * Site-wide SEO helpers: the canonical origin, and the JSON-LD documents we
 * publish.
 *
 * Structured data is only worth adding when it is true. Every builder here
 * takes its values from the database row it describes, and omits a field
 * entirely rather than guessing — an aggregateRating on a product nobody has
 * reviewed, or a return policy we have not written down, is the kind of claim
 * that gets rich results withdrawn.
 */

/** Canonical origin, with no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://bagifyyyy.in'
).replace(/\/$/, '');

export const SITE_NAME = 'BAGIFYYYY';

/** Profiles we actually run. Used for Organization.sameAs. */
export const SOCIAL_PROFILES = ['https://www.instagram.com/bagifyyyy'];

/** Turns a site-relative path into an absolute URL. Passes absolute URLs through. */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

type ProductLdInput = {
  id: string;
  name: string;
  description: string;
  price: number;
  brand: string | null;
  images: string[];
  image: string;
  isSoldOut: boolean;
  totalStock: number;
  rating: { count: number; average: number | null };
};

/**
 * schema.org/Product for a product detail page.
 *
 * `offers.availability` follows the same rule the storefront uses to decide
 * whether to show the buy button, so the markup and the page can't disagree.
 */
export function productJsonLd(product: ProductLdInput) {
  const images = (product.images.length > 0 ? product.images : [product.image])
    .filter(Boolean)
    .map(absoluteUrl);

  const inStock = !product.isSoldOut && product.totalStock > 0;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${product.id}`),
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };

  // Only claim a rating when real reviews back it.
  if (product.rating.count > 0 && product.rating.average !== null) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return ld;
}

export type Crumb = { name: string; path: string };

/** schema.org/BreadcrumbList. `path` is site-relative. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** schema.org/Organization for the root layout. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: ['Bagify', 'Bagifyy'],
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    sameAs: SOCIAL_PROFILES,
  };
}

/** schema.org/WebSite, which is what enables a sitelinks search box. */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Metadata for a collection/listing page. `path` is the canonical route so the
 * OG url and canonical tag agree.
 */
export function collectionMetadata(opts: {
  title: string;
  description: string;
  path: string;
}) {
  const canonical = opts.path;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical },
    openGraph: {
      type: 'website' as const,
      title: opts.title,
      description: opts.description,
      url: absoluteUrl(canonical),
      siteName: SITE_NAME,
      images: [{ url: absoluteUrl('/opengraph-image'), alt: `${SITE_NAME} archive fashion` }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: opts.title,
      description: opts.description,
      images: [absoluteUrl('/opengraph-image')],
    },
  };
}
