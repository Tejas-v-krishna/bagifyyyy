import Image from "next/image";
import Link from "next/link";
import { Asterisk, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import InteractiveShowcase from "@/components/ui/InteractiveShowcase";
import EditorialManifesto from "@/components/home/EditorialManifesto";
import InstagramFeed from "@/components/ui/InstagramFeed";
import HomeBundlesSection from "@/components/ui/HomeBundlesSection";
import VintageArchiveSection from "@/components/ui/VintageArchiveSection";
import Footer from "@/components/layout/Footer";
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch New Arrivals (isNew = true, fallback to latest)
  let newArrivals = await prisma.product.findMany({
    where: { isNew: true },
    orderBy: { createdAt: 'desc' },
    include: { images: true, variants: true }
  });

  if (newArrivals.length < 4) {
    newArrivals = await prisma.product.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { images: true, variants: true }
    });
  }

  // Fetch Curated Grails (Rare high-provenance archive pieces)
  const curatedGrails = await prisma.product.findMany({
    take: 20,
    orderBy: { price: 'desc' },
    include: { images: true, variants: true }
  });

  // Fetch Active Bundles (if any)
  const rawBundles = await prisma.bundle.findMany({
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
  });

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

  // Curated grails are a distinct premium edit rather than another arrivals repeat.
  let vintageArchive = await prisma.product.findMany({
    where: { isBestSeller: true },
    take: 20,
    orderBy: { price: 'desc' },
    include: { images: true, variants: true },
  });

  if (vintageArchive.length < 4) {
    vintageArchive = await prisma.product.findMany({
      take: 20,
      orderBy: { price: 'desc' },
      include: { images: true, variants: true },
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans w-full mx-auto overflow-x-clip">
      
      {/* 1. Editorial seasonal hero */}
      <section className="flex h-[calc(100svh-60px)] w-full flex-col overflow-hidden bg-[#f5f5f2] pt-3 md:h-[calc(100svh-72px)] md:pt-4">
        <h1 className="sr-only">
           BAGIFYYYY (Bagify) - Y2K streetwear and one-off vintage pieces
        </h1>

        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="relative z-10 shrink-0 pt-1 sm:pt-2 pb-2 sm:pb-3.5">
            {/* textLength + spacing-only adjust = first glyph flush left,
                last glyph flush right, at every viewport width, no distortion */}
            <svg
              viewBox="0 0 1000 128"
              preserveAspectRatio="xMidYMid meet"
              className="block h-auto w-full select-none"
              aria-hidden="true"
              focusable="false"
            >
              <text
                x="0"
                y="100"
                textLength="1000"
                lengthAdjust="spacing"
                className="font-microgramma font-bold uppercase"
                fontSize="124"
                fill="#050505"
              >
                Wear History
              </text>
            </svg>
          </div>

          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-black" data-nav-theme="dark">
            <Image
               src="/hero-main.png"
               alt="BAGIFYYYY FW26 campaign"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center contrast-[1.08]"
            />
            {/* Soft atmospheric gradient fading down towards ticker */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute inset-x-5 top-4 sm:top-5 md:top-6 z-10 flex justify-center text-center">
              <p className="font-mono text-[9px] sm:text-[10px] md:text-[10.5px] uppercase tracking-[0.2em] font-medium text-white/90 select-none">
                 FW26 <span className="text-white/35 mx-2">/</span> Small-run streetwear
              </p>
            </div>

            {/* Clearly visible Shop Now CTA positioned just above the marquee with a generous gap */}
            <div className="absolute inset-x-4 bottom-[clamp(5.5rem,11.5vh,7.5rem)] z-30 flex justify-center">
              <Link
                href="/new-arrivals"
                className="editorial-cta group"
              >
                Shop now
                <ArrowRight className="editorial-cta-arrow" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>

            {/* Progressive image blur and fade, with no separate transition strip. */}
             <div className="hero-image-dissolve absolute bottom-0 inset-x-0" aria-label="New piece announcements">
              <div className="hero-transition-marquee">
                <div className="marquee-track flex w-max whitespace-nowrap">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex shrink-0 items-center gap-7 px-4 text-[11px] md:text-sm" aria-hidden={i !== 0}>
                       <span>FW26 small-run pieces</span>
                      <Asterisk strokeWidth={2.2} className="h-4 w-4 shrink-0 text-white/50" />
                       <span>10% off your first order</span>
                      <Asterisk strokeWidth={2.2} className="h-4 w-4 shrink-0 text-white/50" />
                       <span>New pieces are live</span>
                      <Asterisk strokeWidth={2.2} className="h-4 w-4 shrink-0 text-white/50" />
                       <span>Made to be worn hard</span>
                      <Asterisk strokeWidth={2.2} className="h-4 w-4 shrink-0 text-white/50" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5. Editorial Dark Manifesto with Live Style Switcher */}
      <EditorialManifesto />

      {/* 2. New Arrivals & Curated Grails Showcase Section */}
      <section id="showcase" className="w-full bg-white px-3 pt-24 pb-16 sm:px-6 sm:py-24 md:py-32 lg:px-10 scroll-mt-20 overflow-hidden">
        <InteractiveShowcase
          products={newArrivals.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            isSoldOut: p.isSoldOut,
            isNew: p.isNew,
            category: p.category,
            brand: p.brand,
            images: p.images,
            sizes: Array.from(new Set(p.variants.map((v) => v.size))),
            colors: Array.from(new Set(p.variants.map((v) => v.color))),
          }))}
          topPicks={curatedGrails.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            isSoldOut: p.isSoldOut,
            isNew: p.isNew,
            category: p.category,
            brand: p.brand,
            images: p.images,
            sizes: Array.from(new Set(p.variants.map((v) => v.size))),
            colors: Array.from(new Set(p.variants.map((v) => v.color))),
          }))}
        />
      </section>

      {/* 3. Asymmetric editorial category index */}
      <section className="w-full bg-white px-4 py-16 text-[#0a0a0a] sm:px-7 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="category-heading">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="flex items-start gap-6">
            <h2 id="category-heading" className="font-microgramma uppercase text-[clamp(1.2rem,2vw,2.1rem)] font-bold leading-none tracking-tight">
               Shop the categories
            </h2>
          </div>

          <div className="mx-auto mt-8 grid w-full max-w-[1400px] grid-cols-1 gap-5 sm:mt-11 sm:grid-cols-3 sm:items-center sm:gap-6 lg:gap-10">
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
        items={vintageArchive.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || "/placeholder.jpg",
          isSoldOut: product.isSoldOut,
          sizes: Array.from(new Set(product.variants.map((v) => v.size))),
          colors: Array.from(new Set(product.variants.map((v) => v.color))),
        }))}
      />

       {/* 3.5. Bundles, when available */}
      <HomeBundlesSection bundles={formattedBundles} />

      {/* 4. Editorial Instagram Lookbook Feed */}
      <InstagramFeed />

      {/* The newsletter/footer is intentionally reserved for the landing page. */}
      <Footer />
    </div>
  );
}
