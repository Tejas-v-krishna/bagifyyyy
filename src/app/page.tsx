import Image from "next/image";
import Link from "next/link";
import { Asterisk, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import GsapMarquee from "@/components/ui/GsapMarquee";
import InteractiveShowcase from "@/components/ui/InteractiveShowcase";
import ProductCard from "@/components/product/ProductCard";
import InstagramFeed from "@/components/ui/InstagramFeed";
import HomeBundlesSection from "@/components/ui/HomeBundlesSection";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch New Arrivals (isNew = true, fallback to latest)
  let newArrivals = await prisma.product.findMany({
    where: { isNew: true },
    orderBy: { createdAt: 'desc' },
    include: { images: true }
  });

  if (newArrivals.length < 4) {
    newArrivals = await prisma.product.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { images: true }
    });
  }

  // Fetch Curated Grails (Rare high-provenance archive pieces)
  const curatedGrails = await prisma.product.findMany({
    take: 20,
    orderBy: { price: 'desc' },
    include: { images: true }
  });

  // Fetch Active Bundles (if any)
  const rawBundles = await prisma.bundle.findMany({
    include: {
      products: {
        include: {
          product: {
            include: { images: { take: 1 } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const formattedBundles = rawBundles.map((b) => {
    const items = b.products.map((bp) => ({
      id: bp.product.id,
      name: bp.product.name,
      price: bp.product.price,
      image: bp.product.images[0]?.url || '/placeholder.jpg',
      isSoldOut: bp.product.isSoldOut,
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

  // Fetch Vintage Archive once at top to avoid render-time query
  const vintageArchive = await prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: 'asc' },
    include: { images: true },
  });

  return (
    <div className="flex flex-col min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans w-full mx-auto overflow-x-clip">
      
      {/* 1. Editorial seasonal hero */}
      <section className="flex h-[calc(100svh-60px)] w-full flex-col overflow-hidden bg-y2k-ice px-2 pt-3 sm:px-4 md:h-[calc(100svh-106px)] md:pt-5">
        <h1 className="sr-only">
          BAGIFYYYY (Bagify) - Premium Y2K Streetwear, Archive Fashion, and Exclusive Drops
        </h1>

        <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col">
          <div className="shrink-0 overflow-hidden pb-1">
            <p className="font-sans text-[clamp(3.15rem,min(11.5vw,17svh),13rem)] font-medium leading-[0.76] tracking-[-0.075em] text-y2k-gunmetal select-none whitespace-nowrap">
              Archive Season
            </p>
          </div>

          <div className="mt-2 flex shrink-0 items-center justify-between border-b border-y2k-gunmetal/15 pb-2 text-[9px] text-y2k-gunmetal/70 md:mt-3 md:text-[10px]">
            <span>Embrace what lasts</span>
            <a href="#showcase" className="flex items-center gap-2 hover:text-black">
              <span>Scroll for more</span>
              <ArrowRight className="h-3 w-3 rotate-90" strokeWidth={1.4} />
            </a>
          </div>

          <div className="relative mt-3 min-h-0 flex-1 overflow-hidden bg-[#202a27]">
            <Image
              src="/hero-2-editorial.jpg"
              alt="BAGIFYYYY Archive Season editorial"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

            <div className="absolute inset-x-4 bottom-5 flex flex-col items-center text-center text-white md:bottom-8">
              <span className="rounded-full border border-white/65 px-3 py-1 text-[8px] uppercase tracking-[0.18em] md:text-[9px]">
                Style your season
              </span>
              <p className="mt-3 max-w-xl text-[10px] leading-4 text-white/90 sm:text-[11px] sm:leading-5 md:text-sm md:leading-6">
                A considered collection of archive pieces designed to carry character, confidence, and history into every day.
              </p>
              <Link href="/new-arrivals" className="mt-3 border-b border-white pb-1 text-[8px] uppercase tracking-[0.18em] transition-opacity hover:opacity-60 md:mt-4 md:text-[9px]">
                Explore the edit
              </Link>
            </div>
          </div>
        </div>

        {/* Attached campaign ticker */}
        <div className="mx-auto flex h-[38px] w-full max-w-[1800px] shrink-0 items-center overflow-hidden bg-y2k-gunmetal text-y2k-ice md:h-[42px]">
          <div className="flex w-full whitespace-nowrap group">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-marquee group-hover:[animation-play-state:paused] flex gap-7 items-center text-[11px] md:text-sm px-4 shrink-0">
                <span>2026 archive collection</span>
                <Asterisk strokeWidth={2.2} className="h-5 w-5 shrink-0" />
                <span>10% off your first order</span>
                <Asterisk strokeWidth={2.2} className="h-5 w-5 shrink-0" />
                <span>Latest pieces drop now</span>
                <Asterisk strokeWidth={2.2} className="h-5 w-5 shrink-0" />
                <span>Curated for longevity</span>
                <Asterisk strokeWidth={2.2} className="h-5 w-5 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1.5. Anti-Fast Fashion Manifesto */}
      <section className="relative w-full py-40 md:py-56 flex flex-col items-center justify-center border-b border-y2k-gunmetal/[0.07] bg-y2k-ice overflow-hidden px-6 md:px-16">
        <div className="w-full max-w-[1800px] mx-auto flex flex-col">
          {/* Massive Masked Text Layout */}
          <div className="w-full">
            <h2 
              className="w-full flex flex-col font-display uppercase m-0 text-[14vw] lg:text-[11vw] tracking-[-0.05em] leading-[0.9] py-2 text-transparent bg-clip-text bg-[url('/rebel-bg.jpg')] bg-cover bg-center bg-no-repeat"
            >
              <div className="self-start text-left">
                F*CK FAST<br/>
                FASHION.
              </div>
              <div className="self-end text-right mt-8 md:-mt-4 lg:-mt-12">
                WEAR<br/>
                HISTORY.
              </div>
            </h2>
          </div>

          {/* Subtext */}
          <div className="w-full flex justify-end mt-14 md:mt-20" data-animate="text-up">
            <p className="text-y2k-gunmetal/60 text-[10.5px] md:text-xs uppercase tracking-[0.18em] leading-loose max-w-xs text-right border-r border-y2k-gunmetal/[0.12] pr-6">
              Curated 1-of-1 vintage garments built to outlive fast fashion trends.
            </p>
          </div>
        </div>
      </section>

      {/* 2. New Arrivals & Curated Grails Showcase Section */}
      <section id="showcase" className="w-full bg-y2k-ice py-32 md:py-44 px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto scroll-mt-20">
        <InteractiveShowcase products={newArrivals} topPicks={curatedGrails} />
      </section>

      {/* 2.5 Continuous Marquee Tape */}
      <GsapMarquee />

      {/* 3.5. Explore Categories Section */}
      <section className="w-full mt-32 md:mt-44 mb-0">
        <div className="w-full grid grid-cols-1 md:grid-cols-2">
          {/* Top Left: TOPS */}
          <div className="relative w-full aspect-square overflow-hidden group">
            <Image
              src="/assets/ai/prod_model_6_denimjacket_1786660137724.jpg"
              alt="TOPS"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-700" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
              <p className="section-label text-white/60 mb-4">COLLECTION</p>
              <h3 className="font-display text-white text-4xl md:text-5xl lg:text-6xl tracking-[-0.04em] leading-none mb-7 uppercase">
                SHIRTS &amp; TEES
              </h3>
              <Link href="/topwears" className="pointer-events-auto bg-white text-y2k-gunmetal text-[9.5px] uppercase tracking-[0.2em] px-9 py-3.5 hover:bg-y2k-gunmetal hover:text-white transition-colors duration-400">
                SHOP NOW
              </Link>
            </div>
          </div>

          {/* Top Right: ACCESSORIES */}
          <div className="relative w-full aspect-square overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop"
              alt="ACCESSORIES"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-700" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
              <p className="section-label text-white/60 mb-4">COLLECTION</p>
              <h3 className="font-display text-white text-4xl md:text-5xl lg:text-6xl tracking-[-0.04em] leading-none mb-7 uppercase">
                ACCESSORIES
              </h3>
              <Link href="/accessories" className="pointer-events-auto bg-white text-y2k-gunmetal text-[9.5px] uppercase tracking-[0.2em] px-9 py-3.5 hover:bg-y2k-gunmetal hover:text-white transition-colors duration-400">
                SHOP NOW
              </Link>
            </div>
          </div>

          {/* Bottom Full Width: PANTS */}
          <div className="relative w-full md:col-span-2 aspect-square md:aspect-[2.2/1] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1587&auto=format&fit=crop"
              alt="PANTS & CARGOS"
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-700" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
              <p className="section-label text-white/60 mb-4">COLLECTION</p>
              <h3 className="font-display text-white text-4xl md:text-5xl lg:text-6xl tracking-[-0.04em] leading-none mb-7 uppercase">
                PANTS &amp; CARGOS
              </h3>
              <Link href="/bottomwears" className="pointer-events-auto bg-white text-y2k-gunmetal text-[9.5px] uppercase tracking-[0.2em] px-9 py-3.5 hover:bg-y2k-gunmetal hover:text-white transition-colors duration-400">
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Vintage Archive Section */}
      <section className="w-full bg-y2k-ice py-32 md:py-44 px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-row items-end justify-between gap-4 mb-16 border-b border-y2k-gunmetal/[0.07] pb-8">
          <div className="flex flex-col">
            <span className="section-label text-y2k-gunmetal/45 mb-3">CURATED SELECTION</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[52px] uppercase tracking-[-0.04em] leading-none text-y2k-gunmetal">
              Vintage Archive
            </h2>
          </div>

          <div className="flex items-baseline gap-1.5 shrink-0 select-none pb-0.5">
            <span className="font-display text-4xl sm:text-5xl text-y2k-gunmetal leading-none tracking-tight">
              06
            </span>
            <span className="section-label text-y2k-gunmetal/45">
              PIECES
            </span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-16">
          {vintageArchive.map((product) => (
            <div key={product.id} className="w-full">
              <ProductCard product={{
                id: product.id,
                name: product.name,
                price: product.price,
                brand: product.brand || "ARCHIVE VINTAGE",
                image: product.images[0]?.url || '/placeholder.jpg',
                hoverImage: product.images[1]?.url,
                category: product.category,
                isSoldOut: product.isSoldOut,
                isNew: product.isNew
              }} />
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="flex justify-center mt-20">
          <Link
            href="/products"
            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors group"
          >
            <span>View all archive pieces</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
      </section>

      {/* 3.5. Curated Archive Bundles Section (if bundles exist) */}
      <HomeBundlesSection bundles={formattedBundles} />

      {/* 4. Editorial Instagram Lookbook Feed */}
      <InstagramFeed />
    </div>
  );
}
