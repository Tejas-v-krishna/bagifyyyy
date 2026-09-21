import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

/**
 * Sanity — content-only layer.
 *
 * RULE: Sanity owns marketing content (hero/manifesto media, banner text,
 * FAQ, about copy). It NEVER owns anything transactional: no prices, no
 * stock, no availability, no orders. Those stay strictly in Turso/Prisma.
 *
 * Every fetcher returns null when Sanity is unconfigured or unreachable, so
 * the site always falls back to its hardcoded copy. Nothing here can break
 * a render or a build.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const sanityConfigured =
  Boolean(projectId) && projectId !== "placeholder";

const client = createClient({
  projectId: projectId ?? "placeholder",
  dataset,
  apiVersion: "2025-01-01",
  // Published content only, served from the CDN. Preview/draft flows are
  // intentionally out of scope for this storefront.
  useCdn: true,
  perspective: "published",
});

const builder = imageUrlBuilder({ projectId: projectId ?? "placeholder", dataset });

export type SanityImage = {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
} | null | undefined;

/** Responsive CDN URL for a Sanity image, or null (caller falls back). */
export function sanityImageUrl(source: SanityImage, width = 1600): string | null {
  if (!sanityConfigured || !source || !source.asset?._ref) return null;
  try {
    return builder.image(source).width(width).auto("format").url();
  } catch {
    return null;
  }
}

export type HeroContent = {
  image?: SanityImage;
  alt?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type TickerContent = {
  phrases?: string[];
};

export type ManifestoContent = {
  image?: SanityImage;
  alt?: string;
  headingLine1?: string;
  headingLine2?: string;
  intro?: string;
  statementA?: string;
  statementB?: string;
  closingA?: string;
  closingB?: string;
};

export type FaqCategory = {
  category: string;
  items: { q: string; a: string }[];
};

export type FaqContent = {
  categories?: FaqCategory[];
};

export type AboutContent = {
  heroImage?: SanityImage;
  heroAlt?: string;
  kicker?: string;
  quoteLine1?: string;
  quoteLine2?: string;
  tagline?: string;
  ideaTitle?: string;
  ideaBody?: string[];
  pillars?: { value: string; label: string }[];
  panels?: { kicker: string; title: string; body: string }[];
  closingKicker?: string;
  closingTitle?: string;
};

async function fetchSanity<T>(query: string, tag: string): Promise<T | null> {
  if (!sanityConfigured) return null;
  try {
    return await client.fetch<T>(query, {}, { next: { revalidate: 300, tags: ["sanity", tag] } });
  } catch {
    return null;
  }
}

export const getHeroContent = () =>
  fetchSanity<HeroContent>(
    `*[_type == "hero"][0]{ image, alt, ctaLabel, ctaHref }`,
    "sanity:hero"
  );

export const getTickerContent = () =>
  fetchSanity<TickerContent>(`*[_type == "ticker"][0]{ phrases }`, "sanity:ticker");

export const getManifestoContent = () =>
  fetchSanity<ManifestoContent>(
    `*[_type == "manifesto"][0]{ image, alt, headingLine1, headingLine2, intro, statementA, statementB, closingA, closingB }`,
    "sanity:manifesto"
  );

export const getFaqContent = () =>
  fetchSanity<FaqContent>(
    `*[_type == "faqPage"][0]{ categories[]{ category, items[]{ "q": question, "a": answer } } }`,
    "sanity:faq"
  );

export const getAboutContent = () =>
  fetchSanity<AboutContent>(
    `*[_type == "aboutPage"][0]{ heroImage, heroAlt, kicker, quoteLine1, quoteLine2, tagline, ideaTitle, ideaBody, pillars[]{ value, label }, panels[]{ kicker, title, body }, closingKicker, closingTitle }`,
    "sanity:about"
  );
