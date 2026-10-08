import Image from "next/image";
import Link from "next/link";
import { Asterisk, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { attachReservedFlags, availableProductWhere } from "@/lib/products";
import { getHeroContent, getTickerContent, getManifestoContent, sanityImageUrl } from "@/lib/sanity";
import NewInRail from "@/components/ui/NewInRail";
import EditorialManifesto from "@/components/home/EditorialManifesto";
import InstagramFeed from "@/components/ui/InstagramFeed";
import HomeBundlesSection from "@/components/ui/HomeBundlesSection";
import VintageArchiveSection from "@/components/ui/VintageArchiveSection";
import DropCountdown from "@/components/ui/DropCountdown";
import Footer from "@/components/layout/Footer";
// Cached HTML keeps first loads instant in production; sections refresh at
// most 30s behind it. Stock truth is enforced at cart/checkout anyway.
export const revalidate = 30;

const productInclude = { images: true, variants: true } as const;

export default async function Home() {
  // All catalogue reads run in one parallel batch â€” including the fallback
  // lists, fetched optimistically so no query ever waits on another. Each
  // read degrades to an empty list instead of hanging the render on a slow
  // remote DB.
  const [newFlagged, priceTop, rawBundles, bestSellers] = await Promise.all([
    prisma.product
      .findMany({ where: { isNew: true, ...availableProductWhere }, orderBy: { createdAt: 'desc' }, include: productInclude })
      .catch(() => []),
    prisma.product
      .findMany({ where: availableProductWhere, take: 20, orderBy: { price: 'desc' }, include: productInclude })
      .catch(() => []),
    prisma.bundle
      .findMany({
        include: {
          products: {
            include: {
              product: {
                include: { images: { take: 1 }, variants: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })
      .catch(() => []),
    prisma.product
      .findMany({ where: { isBestSeller: true, ...availableProductWhere }, take: 20, orderBy: { price: 'desc' }, include: productInclude })
      .catch(() => []),
  ]);

  // New Arrivals rail is new-flagged pieces only — older stock lives in the
  // catalogue pages, never on the landing rail.
  const newArrivals = newFlagged;

  const vintageArchive = bestSellers.length >= 4 ? bestSellers : priceTop;

  // Flag pieces another shopper is currently holding, so the showcases can
  // show the "on hold" signal. Editorial content (hero/manifesto/ticker)
  // comes from Sanity when configured, hardcoded copy otherwise.
  const [newArrivalsFlagged, vintageArchiveFlagged, sanityHero, sanityTicker, sanityManifesto] = await Promise.all([
    attachReservedFlags(newArrivals),
    attachReservedFlags(vintageArchive),
    getHeroContent(),
    getTickerContent(),
    getManifestoContent(),
  ]);

  const formattedBundles = rawBundles.map((b) => {
    const items = b.products.map((bp) => ({
      ...(() => {
        const defaultVariant = bp.product.variants.find((variant) => variant.stock > 0) ?? bp.product.variants[0];
        return {
          defaultVariant: defaultVariant
            ? { size: defaultVariant.size, color: defaultVariant.color }
            : null,
        };
      })(),
      id: bp.product.id,
      name: bp.product.name,
      price: bp.product.price,
      image: bp.product.images[0]?.url || '/placeholder.jpg',
      isSoldOut:
        bp.product.isSoldOut ||
        (bp.product.variants.length > 0 && !bp.product.variants.some((variant) => variant.stock > 0)),
    }));
    const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
    const bundlePrice = Math.round(originalTotal * (1 - b.discount / 100) * 100) / 100;
    const savings = Math.round((originalTotal - bundlePrice) * 100) / 100;
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      discount: b.discount,
      products: items,
      originalTotal,
      bundlePrice,
      savings,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans w-full mx-auto overflow-x-clip">
      
      {/* 1. Editorial seasonal hero */}
      <section className="flex h-[calc(100svh-60px)] w-full flex-col overflow-hidden bg-[#f5f5f2] pt-3 md:h-[calc(100svh-72px)] md:pt-4">
        <h1 className="sr-only">
           BAGIFYYYY (Bagify) - Y2K streetwear and one-off vintage pieces
        </h1>

        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="relative z-10 shrink-0 px-4 sm:px-6 lg:px-10 pt-0 sm:pt-1 pb-1 sm:pb-1.5">
            {/* Natural dense lockup: spread pinned left/right on sm+,
                stacked full-width lines on mobile so words never collide. */}
            <h2
              aria-hidden="true"
              className="font-microgramma font-bold uppercase leading-[0.9] tracking-[-0.05em] text-[#050505] w-full select-none"
            >
              <span className="flex flex-col leading-[0.95] text-[clamp(2.5rem,15.5vw,4.5rem)] sm:hidden">
                <span>Your</span>
                <span>New</span>
                <span>Old</span>
              </span>
              <span className="hidden sm:flex w-full items-baseline justify-between whitespace-nowrap text-[clamp(1.6rem,13.2vw,24rem)]">
                <span>Your</span>
                <span>New</span>
                <span>Old</span>
              </span>
            </h2>
          </div>

          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-black" data-nav-theme="dark">
            <Image
              src={sanityImageUrl(sanityHero?.image, 2000) ?? "/hero-main.webp"}
              alt={sanityHero?.alt || "BAGIFYYYY FW26 campaign"}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center contrast-[1.08]"
            />
            {/* Soft atmospheric gradient fading down towards ticker */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Hero shopping cue: first-time visitors learn this is a thrift
                store and can buy right away. Copy editable via Sanity hero. */}
            <div className="absolute inset-x-4 bottom-[clamp(5.5rem,11.5vh,7.5rem)] z-30 flex flex-col items-center text-center">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                {sanityHero?.eyebrow || "Thrifted in India"}
              </p>
              <p className="mt-3 font-microgramma font-bold uppercase leading-none tracking-[-0.02em] text-white text-[clamp(1.35rem,4.5vw,2.1rem)] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
                {sanityHero?.headline || "Found for you."}
              </p>
              {sanityHero?.subline ? (
                <p className="mt-2 max-w-[300px] sm:max-w-none text-[13px] sm:text-sm text-white/80">
                  {sanityHero.subline}
                </p>
              ) : null}
              <Link
                href={sanityHero?.ctaHref || "/new-arrivals"}
                className="editorial-cta group mt-4"
              >
                {sanityHero?.ctaLabel || "Shop now"}
                <ArrowRight className="editorial-cta-arrow" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>

            {/* Progressive image blur and fade, with no separate transition strip. */}
             <div className="hero-image-dissolve absolute bottom-0 inset-x-0" aria-label="New piece announcements">
              <div className="hero-transition-marquee">
                <div className="marquee-track flex w-max whitespace-nowrap">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex shrink-0 items-center gap-7 px-4 text-[11px] md:text-sm" aria-hidden={i !== 0}>
                      {(sanityTicker?.phrases?.length ? sanityTicker.phrases : [
                        "FW26 small-run pieces",
                        "10% off your first order",
                        "New pieces are live",
                        "Made to be worn hard",
                      ]).map((phrase) => (
                        <span key={phrase} className="flex shrink-0 items-center gap-7">
                          <span>{phrase}</span>
                          <Asterisk strokeWidth={2.2} className="h-4 w-4 shrink-0 text-white/50" />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5. Editorial Dark Manifesto with Live Style Switcher */}
      <EditorialManifesto
        imageSrc={sanityImageUrl(sanityManifesto?.image, 1600) ?? "/editorial-manifesto.webp"}
        imageAlt={sanityManifesto?.alt || "BAGIFYYYY editorial manifesto FW26"}
        headingLine1={sanityManifesto?.headingLine1 || "Clothes For"}
        headingLine2={sanityManifesto?.headingLine2 || "The Offbeat"}
        intro={
          sanityManifesto?.intro ||
          "We grew up on early-2000s streetwear and club nights. We make the kind of clothes that look better at wear one hundred."
        }
        statementA={sanityManifesto?.statementA || "Wear It, Don't Chase It"}
        statementB={sanityManifesto?.statementB || "Weight Over Hype"}
        closingA={sanityManifesto?.closingA || "Wear History"}
        closingB={sanityManifesto?.closingB || "Make It Yours"}
      />

      {/* 1.6. Next-drop countdown (studio-set; hidden until scheduled) */}
      <DropCountdown />

      {/* 2. New In — compact 2-up grid on phones (easy to scan, obvious
          there's more), liquid-glass carousel on larger screens.
          Hidden entirely when nothing is flagged new. */}
      {newArrivalsFlagged.length > 0 && (
      <section id="showcase" className="w-full bg-white px-3 pt-24 pb-16 sm:px-6 sm:py-24 md:py-32 lg:px-10 scroll-mt-20 overflow-hidden">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="mb-6 flex items-end justify-between px-2 sm:px-4 md:px-6">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[11px] sm:text-[12px] tracking-[0.14em] font-medium text-black/50">
                JUST IN
              </span>
              <h2 className="font-display uppercase text-[20px] sm:text-[26px] md:text-[32px] font-bold tracking-[-0.03em] leading-none text-[#111111]">
                New In
              </h2>
            </div>
            <Link
              href="/new-arrivals"
              className="h-9 sm:h-10 hidden sm:inline-flex items-center gap-2 rounded-[15px] px-4 sm:px-5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap bg-[#111111] text-white hover:bg-black/80"
            >
              <span>See all pieces</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          <NewInRail
            items={newArrivalsFlagged.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.images[0]?.url || '/placeholder.jpg',
              isNew: p.isNew,
              isSoldOut: p.isSoldOut,
              reserved: p.reserved,
              sizes: Array.from(new Set(p.variants.map((v) => v.size))),
              colors: Array.from(new Set(p.variants.map((v) => v.color))),
            }))}
          />
          <Link
            href="/new-arrivals"
            className="mt-4 mx-1 h-12 sm:hidden flex items-center justify-center gap-2 rounded-[15px] text-[12px] font-semibold uppercase tracking-[0.12em] bg-[#111111] text-white active:bg-black/80"
          >
            <span>Shop all new pieces</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
      )}

      {/* 3. Asymmetric editorial category index */}
      <section className="w-full bg-white px-4 py-16 text-[#0a0a0a] sm:px-7 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="category-heading">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="flex items-start gap-6">
            <h2 id="category-heading" className="font-microgramma uppercase text-[clamp(1.2rem,2vw,2.1rem)] font-bold leading-none tracking-tight">
               Shop the categories
            </h2>
          </div>

          {/* Mobile: compact category rows (image + label) so all three
              fit on one screen with no long scroll. */}
          <div className="mx-auto mt-6 flex w-full flex-col gap-3 sm:hidden">
            {[
              { href: "/topwears", label: "Topwears", src: "/assets/ai/prod_model_1_hoodie_1786659181183.jpg", pos: "object-[50%_20%]" },
              { href: "/bottomwears", label: "Bottomwears", src: "/assets/ai/prod_model_2_cargo_1786659253971.jpg", pos: "object-[50%_48%]" },
              { href: "/accessories", label: "Accessories", src: "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg", pos: "object-[50%_45%]" },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex h-[92px] items-center justify-between overflow-hidden rounded-2xl bg-[#e7e7e9] pl-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3 active:bg-[#dedee0]"
              >
                <span className="font-microgramma font-bold uppercase text-[19px] leading-none tracking-tight text-[#0a0a0a]">
                  {c.label}
                </span>
                <span className="relative h-full w-[128px] shrink-0 overflow-hidden">
                  <Image
                    src={c.src}
                    alt={`Shop BAGIFYYYY ${c.label.toLowerCase()}`}
                    fill
                    draggable={false}
                    sizes="128px"
                    className={`object-cover ${c.pos} transition-transform duration-500 group-hover:scale-[1.04] group-active:scale-[1.04]`}
                  />
                </span>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-8 hidden w-full max-w-[1400px] grid-cols-1 gap-5 sm:mt-11 sm:grid sm:grid-cols-3 sm:items-center sm:gap-6 lg:gap-10">
            <Link
              href="/topwears"
              className="group relative aspect-[0.82] overflow-hidden rounded-xl bg-[#e7e7e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3 sm:rounded-2xl"
            >
              <Image
                src="/assets/ai/prod_model_1_hoodie_1786659181183.jpg"
                alt="Shop BAGIFYYYY topwears"
                fill
                draggable={false}
                sizes="(max-width: 639px) 100vw, 30vw"
                className="object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-[1.025]"
              />
              <span className="absolute bottom-4 left-4 font-microgramma font-bold uppercase text-[clamp(1.1rem,1.8vw,1.9rem)] leading-none tracking-tight sm:bottom-5 sm:left-5 text-[#0a0a0a]">Topwears</span>
            </Link>

            <Link
              href="/bottomwears"
              className="group relative aspect-[0.72] overflow-hidden rounded-xl bg-[#e7e7e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3 sm:rounded-2xl"
            >
              <Image
                src="/assets/ai/prod_model_2_cargo_1786659253971.jpg"
                alt="Shop BAGIFYYYY bottomwears"
                fill
                draggable={false}
                sizes="(max-width: 639px) 100vw, 30vw"
                className="object-cover object-[50%_48%] transition-transform duration-700 group-hover:scale-[1.025]"
              />
              <span className="absolute bottom-4 left-4 font-microgramma font-bold uppercase text-[clamp(1.1rem,1.8vw,1.9rem)] leading-none tracking-tight sm:bottom-5 sm:left-5 text-[#0a0a0a]">Bottomwears</span>
            </Link>

            <Link
              href="/accessories"
              className="group relative aspect-[0.82] overflow-hidden rounded-xl bg-[#e7e7e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3 sm:rounded-2xl"
            >
              <Image
                src="/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg"
                alt="Shop BAGIFYYYY accessories"
                fill
                draggable={false}
                sizes="(max-width: 639px) 100vw, 30vw"
                className="object-cover object-[50%_45%] transition-transform duration-700 group-hover:scale-[1.025]"
              />
              <span className="absolute bottom-4 left-4 font-microgramma font-bold uppercase text-[clamp(1.1rem,1.8vw,1.9rem)] leading-none tracking-tight sm:bottom-5 sm:left-5 text-[#0a0a0a]">Accessories</span>
            </Link>
          </div>
        </div>
      </section>

       {/* 3. Hard-to-find pieces */}
      <VintageArchiveSection
        items={vintageArchiveFlagged.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || "/placeholder.jpg",
          isSoldOut: product.isSoldOut,
          reserved: product.reserved,
          sizes: Array.from(new Set(product.variants.map((v) => v.size))),
          colors: Array.from(new Set(product.variants.map((v) => v.color))),
        }))}
      />

       {/* 3.5. Bundles, when available */}
      <HomeBundlesSection bundles={formattedBundles} />

      {/* 4. Editorial Instagram Lookbook Feed */}
      <InstagramFeed />

      {/* Footer lives only on the landing page — all other pages end clean. */}
      <Footer />
    </div>
  );
}
