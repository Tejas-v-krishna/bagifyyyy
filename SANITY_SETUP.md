# Sanity CMS — content-only layer for BAGIFYYYY

Sanity manages **marketing content only**: homepage hero media + CTA, ticker
phrases, manifesto image + copy, FAQ, and about page.

> **Hard rule: Sanity never owns anything transactional.** No prices, no
> stock, no availability, no orders, no customers. Those stay strictly in
> Turso/Prisma. If a field would affect what a shopper can buy or for how
> much, it does not belong in a Sanity schema.

When Sanity is unconfigured (no `NEXT_PUBLIC_SANITY_PROJECT_ID`), every page
falls back to its hardcoded copy — the site builds and runs identically.

## 1. Create the project

1. Go to [sanity.io](https://www.sanity.io) → create a project (free plan is fine).
2. Note the **Project ID**. Create/use the `production` dataset (public dataset
   needs no API token for reads).

## 2. Environment variables

Add to `.env` (and to the hosting provider for production):

```
NEXT_PUBLIC_SANITY_PROJECT_ID="<project-id>"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_REVALIDATE_SECRET="<long random string>"
```

## 3. Push the schemas & open the Studio

Schemas live in `sanity/schemas/` (hero, ticker, manifesto, faqPage,
aboutPage). From the repo root:

```
npx sanity login
npx sanity dev        # local Studio at http://localhost:3333
npx sanity deploy     # hosted Studio at <name>.sanity.studio
```

Create one document of each type and **Publish** them:

- **Homepage Hero** — campaign image, alt, CTA label/link
- **Hero Ticker Phrases** — 1–8 rotating phrases
- **Homepage Manifesto** — image + all headline/copy lines
- **FAQ Page** — categories with questions + answers
- **About Page** — hero image, quote, pillars, panels

## 4. Instant refresh webhook (optional but recommended)

Content is cached for 5 minutes (`revalidate: 300`, tagged `sanity*`).
For instant updates on publish, add a webhook in
Sanity dashboard → API → Webhooks:

- URL: `https://<your-domain>/api/sanity-revalidate`
- Method: POST, projection: `{_type}` (or leave the default body)
- Header: `x-sanity-revalidate-secret: <same SANITY_REVALIDATE_SECRET>`
- Trigger on: Create, Update, Delete

## 5. CORS

If the Studio is hosted separately, add the site origin
(`http://localhost:4000`, `https://bagifyyyy.in`) under
Sanity dashboard → API → CORS origins.

## Notes

- Images are served from the Sanity CDN with responsive widths and automatic
  format negotiation (`sanityImageUrl` in `src/lib/sanity.ts`) — this is what
  fixes the heavy first-load problem for CMS-managed imagery.
- `next.config.ts` already allows `cdn.sanity.io` for `next/image`.
- Drafts/previews are intentionally not wired: the storefront reads published
  content only.
