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
      <section className="flex h-[calc(100svh-60px)] w-full flex-col overflow-hidden bg-[#f5f5f2] pt-3 md:h-[calc(100svh-72px)] md:pt-4">
        <h1 className="sr-only">
          BAGIFYYYY (Bagify) - Premium Y2K Streetwear, Archive Fashion, and Exclusive Drops
        </h1>

        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="relative z-10 shrink-0 overflow-hidden px-2 pb-2 pt-1 sm:px-4 md:px-6 md:pb-3">
            <p className="w-full whitespace-nowrap text-center font-sans text-[clamp(3.75rem,13.4vw,16rem)] font-medium uppercase leading-[0.78] tracking-[-0.07em] text-[#050505] select-none">
              Wear History
            </p>
          </div>

          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#1a1a1a]">
            <Image
              src="/hero-main.png"
              alt="BAGIFYYYY Archive Season editorial"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center contrast-[1.08]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />

            <div className="absolute inset-x-5 top-3 z-10 flex justify-center text-center text-white md:top-4">
              <p className="max-w-[28rem] text-[9px] font-semibold uppercase leading-[1.15] tracking-[-0.02em] drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] sm:text-[10px] md:text-[11px]">
                Discover archive pieces made to outlive the moment,<br className="hidden sm:block" /> curated for the present and worn into history.
              </p>
            </div>

            <div className="absolute inset-x-4 bottom-5 z-10 flex justify-center md:bottom-7">
              <Link
                href="/new-arrivals"
                className="group inline-flex min-h-11 min-w-[180px] items-center justify-center gap-2 border border-black bg-white px-8 py-3 text-[11px] font-bold uppercase tracking-[-0.02em] text-black shadow-[0_3px_18px_rgba(0,0,0,0.24)] transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-3 md:min-w-[210px] md:text-xs"
              >
                Shop now
                <ArrowRight className="h-3.5 w-3.5 -rotate-45 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Attached campaign ticker - continuous seamless loop */}
        <div className="flex h-[38px] w-full shrink-0 items-center overflow-hidden border-t border-white/25 bg-[#111111] text-white md:h-[42px]">
          <div className="marquee-track flex w-max whitespace-nowrap" aria-hidden="true">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-7 items-center text-[11px] md:text-sm px-4 shrink-0" aria-hidden={i !== 0}>
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
      <section
        className="group/manifesto relative flex min-h-[660px] w-full items-center justify-center overflow-hidden border-b border-y2k-gunmetal/[0.1] bg-y2k-ice px-6 py-20 md:min-h-[800px] md:px-16 md:py-28"
        aria-labelledby="manifesto-heading"
      >
        {/* Quiet editorial frame */}
        <div className="pointer-events-none absolute inset-4 border border-y2k-gunmetal/[0.08] md:inset-7" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-y2k-gunmetal/[0.045]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-7 top-1/2 h-px bg-y2k-gunmetal/[0.045]" aria-hidden="true" />

        <div className="relative z-10 flex w-full max-w-[1800px] flex-col">
          <div className="mb-8 flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-y2k-gunmetal/45 md:mb-12 md:px-2">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-y2k-gunmetal" aria-hidden="true" />
              Manifesto / 001
            </span>
            <span className="hidden sm:block">The anti-trend archive</span>
            <span>SS26</span>
          </div>

          <div className="relative">
            <h2
              id="manifesto-heading"
              className="flex w-full flex-col py-2 font-display text-[14vw] uppercase leading-[0.86] tracking-[-0.07em] text-transparent bg-[url('/rebel-bg.jpg')] bg-cover bg-center bg-clip-text bg-no-repeat sm:text-[13vw] lg:text-[11vw]"
            >
              <span className="self-start text-left">F*CK FAST<br />FASHION.</span>
              <span className="mt-10 self-end text-right md:-mt-4 lg:-mt-12">WEAR<br />HISTORY.</span>
            </h2>

            {/* Rotating archive seal adds motion without competing with the message. */}
            <div className="absolute left-1/2 top-1/2 hidden h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-y2k-gunmetal/25 bg-y2k-ice/80 backdrop-blur-sm transition-transform duration-700 group-hover/manifesto:rotate-12 md:flex">
              <span className="absolute inset-2 rounded-full border border-dashed border-y2k-gunmetal/25" aria-hidden="true" />
              <span className="text-center text-[8px] font-bold uppercase leading-[1.45] tracking-[0.16em] text-y2k-gunmetal/65">No trends<br />Just taste<br /><span className="text-lg leading-none">*</span></span>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-8 border-t border-y2k-gunmetal/[0.12] pt-5 sm:flex-row sm:items-end md:mt-16 md:px-2" data-animate="text-up">
            <p className="max-w-xs text-[10.5px] uppercase leading-[1.8] tracking-[0.16em] text-y2k-gunmetal/60 md:max-w-sm md:text-xs">
              Curated 1-of-1 vintage garments built to outlive fast fashion trends.
            </p>
            <Link
              href="#showcase"
              className="group/cta inline-flex min-h-11 items-center gap-4 border-b border-y2k-gunmetal/35 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-y2k-gunmetal transition-colors hover:border-y2k-gunmetal hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-4"
            >
              Explore the archive
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-1" strokeWidth={1.7} aria-hidden="true" />
            </Link>
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
