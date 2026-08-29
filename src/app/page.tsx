import Image from "next/image";
import Link from "next/link";
import { Asterisk, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import GsapMarquee from "@/components/ui/GsapMarquee";
import InteractiveShowcase from "@/components/ui/InteractiveShowcase";
import ProductCard from "@/components/product/ProductCard";
import InstagramFeed from "@/components/ui/InstagramFeed";
import HomeBundlesSection from "@/components/ui/HomeBundlesSection";
import VintageArchiveSection from "@/components/ui/VintageArchiveSection";

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
      <section className="flex h-[calc(100svh-60px)] w-full flex-col overflow-hidden bg-[#f5f5f2] pt-3 md:h-[calc(100svh-106px)] md:pt-4">
        <h1 className="sr-only">
          BAGIFYYYY (Bagify) - Premium Y2K Streetwear, Archive Fashion, and Exclusive Drops
        </h1>

        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="shrink-0 overflow-hidden px-3 pb-1 sm:px-5 md:px-7">
            <p className="w-full text-center font-sans text-[clamp(3.1rem,14.15vw,18rem)] font-medium leading-[0.77] tracking-[-0.055em] text-[#0a0a0a] select-none whitespace-nowrap">
              Archive Season
            </p>
          </div>

          <div className="mx-3 mt-3 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-5 pb-4 text-[9px] text-black/65 sm:mx-5 md:mx-7 md:mt-4 md:gap-7 md:text-[10px]">
            <span>Embrace what lasts</span>
            <span className="h-px w-full bg-black/15" aria-hidden="true" />
            <a href="#showcase" className="flex items-center gap-2 hover:text-black">
              <span>Scroll for more</span>
              <ArrowRight className="h-3 w-3 rotate-90" strokeWidth={1.4} />
            </a>
          </div>

          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#1a1a1a]">
            <Image
              src="/hero-2-editorial.jpg"
              alt="BAGIFYYYY Archive Season editorial"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center grayscale contrast-[1.08]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

            <div className="absolute inset-x-4 bottom-6 flex flex-col items-center text-center text-white md:bottom-10">
              <span className="rounded-full border border-white/65 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] md:px-5 md:py-2 md:text-xs">
                Style your season
              </span>
              <p className="mt-4 max-w-xl text-xs leading-5 text-white/95 sm:text-sm sm:leading-6 md:mt-5 md:text-base md:leading-7">
                Curated archive pieces made to outlive the moment.
              </p>
            </div>
          </div>
        </div>

        {/* Attached campaign ticker */}
        <div className="flex h-[38px] w-full shrink-0 items-center overflow-hidden border-t border-white/25 bg-[#111111] text-white md:h-[42px]">
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
      <section className="relative w-full pb-20 pt-12 md:pb-28 md:pt-16 flex flex-col items-center justify-center border-b border-y2k-gunmetal/[0.07] bg-y2k-ice overflow-hidden px-6 md:px-16">
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
      <VintageArchiveSection
        items={vintageArchive.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || "/placeholder.jpg",
          isSoldOut: product.isSoldOut,
        }))}
      />

      {/* 3.5. Curated Archive Bundles Section (if bundles exist) */}
      <HomeBundlesSection bundles={formattedBundles} />

      {/* 4. Editorial Instagram Lookbook Feed */}
      <InstagramFeed />
    </div>
  );
}
