import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Globe, Barcode, Heart, ShoppingBag, MessageCircle, Send, MoreHorizontal } from "lucide-react";
import WishlistButton from "@/components/ui/WishlistButton";
import HeroText from "@/components/ui/HeroText";
import { prisma } from "@/lib/prisma";
import NewsletterForm from "@/components/ui/NewsletterForm";
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

  return (
    <div className="flex flex-col min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans w-full mx-auto overflow-x-clip">
      
      {/* 1. Hero Section */}
      <section className="w-full flex flex-col items-center h-[calc(100vh-64px)]">
        {/* Massive Headline (GSAP Animated in Instrument Sans Medium) */}
        <HeroText />
        
        {/* Gradient Line under Text */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-y2k-gunmetal/20 to-transparent" />

        {/* Hero Photo Container (Flex-1 to fill remaining viewport height) */}
        <div className="w-full relative flex-1 flex flex-col md:flex-row overflow-hidden group/hero">
          
          {/* Main Model Shot */}
          <div className="relative w-full h-[50vh] md:h-full md:flex-[7] hover:md:flex-[8.2] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] border-b md:border-b-0 md:border-r border-y2k-gunmetal/10 bg-transparent p-2 md:p-3">
            <Link href="/topwears" className="relative w-full h-full overflow-hidden block group/link cursor-pointer">
              <div className="absolute inset-0 bg-[url('/hero-1-new.jpg')] bg-cover bg-center" data-parallax-bg data-parallax-speed="0.15" />
              <div className="absolute inset-0 bg-y2k-gunmetal/5 group-hover/link:bg-transparent transition-colors duration-700" />

              {/* Button (Right aligned on Left Image) */}
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20" data-animate="button">
                <div 
                  className="inline-flex items-center justify-center btn-bagify text-white rounded-none font-bold text-[11px] md:text-xs uppercase tracking-[0.14em] px-6 py-3 shadow-md"
                >
                  <span>SHIRTS &amp; TEES</span>
                  <ArrowUpRight className="ml-2 w-3.5 h-3.5 group-hover/link:rotate-45 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* Product Close-Up */}
          <div className="relative w-full h-[40vh] md:h-full md:flex-[3] hover:md:flex-[4.2] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] bg-transparent p-2 md:p-3">
            <Link href="/bottomwears" className="relative w-full h-full overflow-hidden block group/link cursor-pointer">
              <div className="absolute inset-0 bg-[url('/fit.jpg')] bg-cover bg-center" data-parallax-bg data-parallax-speed="0.15" />
              <div className="absolute inset-0 bg-y2k-gunmetal/5 group-hover/link:bg-transparent transition-colors duration-700" />

              {/* Button (Left aligned on Right Image) */}
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20" data-animate="button">
                <div 
                  className="inline-flex items-center justify-center btn-bagify text-white rounded-none font-bold text-[11px] md:text-xs uppercase tracking-[0.14em] px-6 py-3 shadow-md"
                >
                  <span>PANTS &amp; CARGOS</span>
                  <ArrowUpRight className="ml-2 w-3.5 h-3.5 group-hover/link:rotate-45 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Ticker Strip */}
        <div className="w-full bg-[#232D3B] text-[#E8EDF2] border-y border-[#232D3B] overflow-hidden h-[44px] md:h-[48px] flex items-center shadow-inner">
          <div className="flex w-full whitespace-nowrap group">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-marquee group-hover:[animation-play-state:paused] flex gap-8 items-center text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.18em] px-4 shrink-0">
                <span>JOIN THE BAGIFYYYY COMMUNITY</span>
                <Globe strokeWidth={1.5} className="w-3.5 h-3.5 text-y2k-soft" />
                <span>10% OFF YOUR FIRST ORDER WITH CODE BAGIFY10</span>
                <Barcode strokeWidth={1.5} className="w-3.5 h-3.5 text-y2k-soft" />
                <span>JOIN THE BAGIFYYYY COMMUNITY</span>
                <Globe strokeWidth={1.5} className="w-3.5 h-3.5 text-y2k-soft" />
                <span>10% OFF YOUR FIRST ORDER WITH CODE BAGIFY10</span>
                <Barcode strokeWidth={1.5} className="w-3.5 h-3.5 text-y2k-soft" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1.5. Anti-Fast Fashion Manifesto - Typography Mask Layout */}
      <section className="relative w-full py-28 md:py-36 flex flex-col items-center justify-center border-b border-y2k-gunmetal/10 bg-y2k-ice overflow-hidden px-4 md:px-12">
        <div className="w-full max-w-[1800px] mx-auto flex flex-col">
          {/* Massive Masked Text Layout */}
          <div className="w-full">
            <h2 
              className="w-full flex flex-col font-display uppercase m-0 font-medium text-[14vw] lg:text-[11vw] tracking-[-0.04em] leading-[0.92] py-2 text-transparent bg-clip-text bg-[url('/rebel-bg.jpg')] bg-cover bg-center bg-no-repeat"
            >
              <div className="self-start text-left">
                F*CK FAST<br/>
                FASHION.
              </div>
              <div className="self-end text-right mt-6 md:-mt-4 lg:-mt-10">
                WEAR<br/>
                HISTORY.
              </div>
            </h2>
          </div>

          {/* Subtext */}
          <div className="w-full flex justify-end mt-12 md:mt-16" data-animate="text-up">
            <p className="text-y2k-gunmetal/80 text-xs md:text-sm font-normal uppercase tracking-wider leading-relaxed max-w-md text-right border-r border-y2k-gunmetal/30 pr-5">
              We build pieces that outlive trends. Stop buying disposable garbage. Invest in the archive. 
              Our garments are curated to age, to wear, and to carry history.
            </p>
          </div>
        </div>
      </section>

      {/* 2. New Arrivals & Curated Grails Showcase Section */}
      <section className="w-full bg-y2k-ice pt-24 pb-14 px-4 sm:px-6 lg:px-12 max-w-[1800px] mx-auto">
        <InteractiveShowcase products={newArrivals} topPicks={curatedGrails} />
      </section>

      {/* 2.5 Continuous Marquee Tape */}
      <GsapMarquee />

      {/* 3.5. Explore Categories Section — Symmetric Split Layout */}
      <section className="w-full mt-10 md:mt-16 mb-12">
        <div className="w-full grid grid-cols-1 md:grid-cols-2">
          {/* Top Left: TOPS */}
          <div className="relative w-full aspect-square overflow-hidden group">
            <Image
              src="/assets/ai/prod_model_6_denimjacket_1786660137724.jpg"
              alt="TOPS"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
              <h3 className="font-display font-medium text-white text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em] leading-none mb-5 drop-shadow-md uppercase py-1">
                SHIRTS &amp; TEES
              </h3>
              <Link href="/topwears" className="pointer-events-auto bg-white text-black text-[11px] font-bold tracking-[0.16em] uppercase px-8 py-3.5 hover:bg-[#232D3B] hover:text-white transition-colors duration-300 shadow-sm">
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
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
              <h3 className="font-display font-medium text-white text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em] leading-none mb-5 drop-shadow-md uppercase py-1">
                ACCESSORIES
              </h3>
              <Link href="/accessories" className="pointer-events-auto bg-white text-black text-[11px] font-bold tracking-[0.16em] uppercase px-8 py-3.5 hover:bg-[#232D3B] hover:text-white transition-colors duration-300 shadow-sm">
                SHOP NOW
              </Link>
            </div>
          </div>

          {/* Bottom Full Width: SS'23 DELIVERY 1 */}
          <div className="relative w-full md:col-span-2 aspect-square md:aspect-[2.2/1] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1587&auto=format&fit=crop"
              alt="SS'23 DELIVERY 1"
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
              <h3 className="font-display font-medium text-white text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em] leading-none mb-5 drop-shadow-md uppercase py-1">
                PANTS &amp; CARGOS
              </h3>
              <Link href="/bottomwears" className="pointer-events-auto bg-white text-black text-[11px] font-bold tracking-[0.16em] uppercase px-8 py-3.5 hover:bg-[#232D3B] hover:text-white transition-colors duration-300 shadow-sm">
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Vintage Archive Section — Minimalist Editorial Layout */}
      <section className="w-full bg-y2k-ice pt-24 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1800px] mx-auto">
        {/* Minimalist Header with Right-Side Product Numbering */}
        <div className="flex flex-row items-end justify-between gap-4 mb-12 border-b border-y2k-gunmetal/10 pb-6">
          <div className="flex flex-col">
            <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[46px] uppercase tracking-[-0.03em] leading-none text-y2k-gunmetal py-1">
              Vintage Archive
            </h2>
          </div>

          <div className="flex items-baseline gap-1.5 shrink-0 select-none pb-0.5">
            <span className="font-display font-medium text-3xl sm:text-4xl md:text-5xl text-y2k-gunmetal leading-none tracking-tight">
              06
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-y2k-gunmetal/60 font-sans">
              PIECES
            </span>
          </div>
        </div>

        {/* Product Grid — Borderless, Spacious 6-Column Minimalist Layout */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {(await prisma.product.findMany({ take: 6, orderBy: { createdAt: 'asc' }, include: { images: true } })).map((product) => (
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
      </section>

      {/* 3.5. Curated Archive Bundles Section (if bundles exist) */}
      <HomeBundlesSection bundles={formattedBundles} />

      {/* 4. Editorial Instagram Lookbook Feed */}
      <InstagramFeed />
    </div>
  );
}
