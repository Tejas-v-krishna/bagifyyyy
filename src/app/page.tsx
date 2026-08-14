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

  // Fetch Exclusive / Featured Products
  const exclusiveProducts = await prisma.product.findMany({
    take: 4,
    where: { category: 'accessories' }, 
    include: { images: true }
  });

  // Fallback if no accessories found
  const featured = exclusiveProducts.length >= 4 ? exclusiveProducts : newArrivals.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans w-full mx-auto overflow-x-clip">
      
      {/* 1. Hero Section */}
      <section className="w-full flex flex-col items-center h-[calc(100vh-72px)]">
        {/* Massive Headline (GSAP Animated in Instrument Sans Medium) */}
        <HeroText />
        
        {/* Gradient Line under Text */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-y2k-slate/40 to-transparent" />

        {/* Hero Photo Container (Flex-1 to fill remaining viewport height) */}
        <div className="w-full relative flex-1 flex flex-col md:flex-row overflow-hidden group/hero">
          
          {/* Main Model Shot */}
          <div className="relative w-full h-[50vh] md:h-full md:flex-[7] hover:md:flex-[8.5] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] border-b md:border-b-0 md:border-r border-y2k-slate/40 bg-transparent p-2 md:p-3 lg:p-4">
            <Link href="/products" className="relative w-full h-full overflow-hidden block group/link cursor-pointer">
              <div className="absolute inset-0 bg-[url('/hero-1-new.jpg')] bg-cover bg-center" data-parallax-bg data-parallax-speed="0.15" />
              <div className="absolute inset-0 bg-y2k-gunmetal/10 group-hover/link:bg-transparent transition-colors duration-700" />

              {/* Button (Right aligned on Left Image) */}
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20" data-animate="button">
                <div 
                  className="inline-flex items-center justify-center btn-bagify rounded-none font-bold text-xs md:text-sm tracking-wider shadow-lg"
                  style={{ padding: '14px 24px' }}
                >
                  <span className="uppercase">SHOP FW24</span>
                  <ArrowUpRight className="ml-2 w-4 h-4 group-hover/link:rotate-45 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* Product Close-Up */}
          <div className="relative w-full h-[40vh] md:h-full md:flex-[3] hover:md:flex-[4.5] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] bg-transparent p-2 md:p-3 lg:p-4">
            <Link href="/products" className="relative w-full h-full overflow-hidden block group/link cursor-pointer">
              <div className="absolute inset-0 bg-[url('/fit.jpg')] bg-cover bg-center" data-parallax-bg data-parallax-speed="0.15" />
              <div className="absolute inset-0 bg-y2k-gunmetal/10 group-hover/link:bg-transparent transition-colors duration-700" />

              {/* Button (Left aligned on Right Image) */}
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20" data-animate="button">
                <div 
                  className="inline-flex items-center justify-center btn-bagify rounded-none font-bold text-xs md:text-sm tracking-wider shadow-lg"
                  style={{ padding: '14px 24px' }}
                >
                  <span className="uppercase">ESSENTIALS</span>
                  <ArrowUpRight className="ml-2 w-4 h-4 group-hover/link:rotate-45 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Ticker Strip */}
        <div className="w-full bg-y2k-gunmetal border-y border-y2k-slate overflow-hidden text-y2k-ice h-[44px] md:h-[56px] flex items-center shadow-inner">
          <div className="flex w-full whitespace-nowrap group">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-marquee group-hover:[animation-play-state:paused] flex gap-8 items-center text-xs md:text-sm font-semibold uppercase tracking-wider px-4 shrink-0">
                <span>JOIN THE BAGIFYYYY COMMUNITY</span>
                <Globe strokeWidth={1.5} className="w-4 h-4 text-y2k-soft" />
                <span>10% OFF YOUR FIRST ORDER ON FULL PRICE ITEMS</span>
                <Barcode strokeWidth={1.5} className="w-4 h-4 text-y2k-soft" />
                <span>JOIN THE BAGIFYYYY COMMUNITY</span>
                <Globe strokeWidth={1.5} className="w-4 h-4 text-y2k-soft" />
                <span>10% OFF YOUR FIRST ORDER ON FULL PRICE ITEMS</span>
                <Barcode strokeWidth={1.5} className="w-4 h-4 text-y2k-soft" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1.5. Anti-Fast Fashion Manifesto - Typography Mask Layout */}
      <section className="relative w-full py-24 md:py-40 flex flex-col items-center justify-center border-b border-y2k-gunmetal/10 bg-y2k-ice overflow-hidden px-4 md:px-12">
        <div className="w-full max-w-[1800px] mx-auto flex flex-col">
          {/* Massive Masked Text Layout */}
          <div className="w-full">
            <h2 
              className="w-full flex flex-col font-display uppercase m-0 font-medium text-[15vw] lg:text-[12vw] tracking-[-0.08em] leading-[0.8] text-transparent bg-clip-text bg-[url('/rebel-bg.jpg')] bg-cover bg-center bg-no-repeat"
            >
              <div className="self-start text-left">
                F*CK FAST<br/>
                FASHION.
              </div>
              <div className="self-end text-right mt-6 md:-mt-4 lg:-mt-12">
                WEAR<br/>
                HISTORY.
              </div>
            </h2>
          </div>

          {/* Subtext */}
          <div className="w-full flex justify-end mt-12 md:mt-20" data-animate="text-up">
            <p className="text-y2k-gunmetal text-xs md:text-sm font-semibold uppercase tracking-wider leading-relaxed max-w-lg text-right border-r-2 border-y2k-gunmetal pr-6">
              We build pieces that outlive trends. Stop buying garbage. Invest in the archive. 
              Our garments are designed to age, to wear, and to carry history.
            </p>
          </div>
        </div>
      </section>

      {/* 2. New Collection Section */}
      <section className="w-full bg-y2k-ice pt-24 pb-12 px-4 sm:px-6 lg:px-12 max-w-[1800px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-[64px] uppercase tracking-[-0.06em] text-y2k-gunmetal m-0 leading-[0.85]" data-animate="text-up">
              DAILY DROPS
            </h2>
            <p className="text-xs md:text-sm text-y2k-slate font-semibold uppercase tracking-wider leading-relaxed" data-animate="text-up">
              fresh out the archive. no restocks, no replicas.
            </p>
          </div>
          <div className="shrink-0 flex items-center group cursor-pointer border-b border-y2k-gunmetal pb-1" data-animate="button">
            <Link href="/products" className="font-sans text-xs md:text-sm font-bold uppercase tracking-wider text-y2k-gunmetal flex items-center gap-2 group-hover:opacity-70 transition-opacity">
              <span>DISCOVER ALL</span>
              <ArrowRight strokeWidth={1.5} className="w-4 h-4 text-y2k-gunmetal" />
            </Link>
          </div>
        </div>

        {/* Interactive Showcase Grid */}
        <InteractiveShowcase products={newArrivals} />
      </section>

      {/* 2.5 Continuous Marquee Tape */}
      <GsapMarquee />

      {/* 3.5. Explore Categories Section — Symmetric Split Layout */}
      <section className="w-full mt-12 md:mt-20 mb-12">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
              <h3 className="font-display font-medium text-white text-3xl md:text-4xl lg:text-5xl tracking-[-0.05em] leading-[0.85] mb-4 drop-shadow-lg uppercase">
                TOPS
              </h3>
              <Link href="/topwears" className="pointer-events-auto bg-white text-black text-xs md:text-sm font-bold tracking-wider px-8 py-3.5 hover:bg-y2k-gunmetal hover:text-white transition-colors duration-300 shadow-sm">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
              <h3 className="font-display font-medium text-white text-3xl md:text-4xl lg:text-5xl tracking-[-0.05em] leading-[0.85] mb-4 drop-shadow-lg uppercase">
                ACCESSORIES
              </h3>
              <Link href="/accessories" className="pointer-events-auto bg-white text-black text-xs md:text-sm font-bold tracking-wider px-8 py-3.5 hover:bg-y2k-gunmetal hover:text-white transition-colors duration-300 shadow-sm">
                SHOP NOW
              </Link>
            </div>
          </div>

          {/* Bottom Full Width: SS'23 DELIVERY 1 */}
          <div className="relative w-full md:col-span-2 aspect-square md:aspect-[2/1] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1587&auto=format&fit=crop"
              alt="SS'23 DELIVERY 1"
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
              <h3 className="font-display font-medium text-white text-3xl md:text-4xl lg:text-5xl tracking-[-0.05em] leading-[0.85] mb-4 drop-shadow-lg uppercase">
                SS'23 DELIVERY 1
              </h3>
              <Link href="/products" className="pointer-events-auto bg-white text-black text-xs md:text-sm font-bold tracking-wider px-8 py-3.5 hover:bg-y2k-gunmetal hover:text-white transition-colors duration-300 shadow-sm">
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. One Of One — rare unique finds section */}
      <section className="w-full bg-y2k-ice pt-24 mb-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-16 text-center gap-3 px-4 sm:px-6 lg:px-12">
          <p className="text-xs md:text-sm text-y2k-slate font-bold uppercase tracking-wider">BAGIFYYYY ARCHIVE</p>
          <h2 className="font-display font-medium text-4xl md:text-6xl lg:text-[80px] uppercase tracking-[-0.06em] text-y2k-gunmetal m-0 leading-[0.85]">
            ONE OF ONE
          </h2>
          <p className="text-xs md:text-sm text-y2k-slate font-semibold uppercase tracking-wider leading-relaxed">
            no restocks. no replicas. if u slept, u lost.
          </p>
        </div>

        {/* Product Grid - Full Bleed, no gap, with inner borders */}
        <div className="w-full border-t border-l border-y2k-gunmetal/15 grid grid-cols-2 md:grid-cols-5">
          {(await prisma.product.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { images: true } })).map((product) => (
            <div key={product.id} className="w-full bg-[#f4f4f4] border-r border-b border-y2k-gunmetal/15">
              <ProductCard product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0]?.url || '/placeholder.jpg',
                category: product.category,
                isSoldOut: product.isSoldOut
              }} />
            </div>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center px-4 sm:px-6">
          <Link href="/products" className="font-sans text-xs md:text-sm font-bold uppercase tracking-wider text-y2k-gunmetal flex items-center gap-2 hover:opacity-70 transition-opacity border-b border-y2k-gunmetal pb-1">
            <span>EXPLORE THE ARCHIVE</span>
            <ArrowRight strokeWidth={1.5} className="w-4 h-4 text-y2k-gunmetal" />
          </Link>
        </div>
      </section>

      {/* 4. Fit Checks (UGC Lookbook) - Brutalist Instagram Grid */}
      <section className="w-full bg-y2k-ice py-24 md:py-32 flex flex-col border-t border-y2k-gunmetal/10">
        {/* Header */}
        <div className="flex flex-col items-center justify-center px-4 max-w-[1800px] mx-auto w-full mb-16 text-center gap-3">
          <p className="text-y2k-slate text-xs md:text-sm font-bold uppercase tracking-wider" data-animate="text-down">COMMUNITY ARCHIVE</p>
          <h2 className="font-display font-medium text-4xl md:text-6xl lg:text-[80px] uppercase tracking-[-0.06em] text-y2k-gunmetal m-0 leading-[0.85]" data-animate="text-down">
            STREET VISION
          </h2>
          <p className="text-y2k-gunmetal text-xs md:text-sm font-semibold uppercase tracking-wider max-w-sm mt-3" data-animate="text-up">
            Tag @bagifyyyy on instagram to get archived.
          </p>
        </div>

        {/* IG Grid Layout */}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {[
            { url: "/assets/ai/prod_model_1_hoodie_1786659181183.jpg", handle: "@chrome.drip", caption: "archive delivery 1. heavy." },
            { url: "/assets/ai/prod_model_2_cargo_1786659253971.jpg", handle: "@bagify.fits", caption: "acid wash rotation" },
            { url: "/assets/ai/prod_model_3_babytee_1786659519157.jpg", handle: "@yzrk.fits", caption: "y2k uniform" },
            { url: "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg", handle: "@vibe.check", caption: "hardware" },
            { url: "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg", handle: "@aesthetic.y2k", caption: "essentials only" },
            { url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg", handle: "@drip.lord", caption: "vintage sourcing" }
          ].map((post, i) => (
            <div key={i} className="flex flex-col bg-white border border-y2k-gunmetal/20 shadow-sm overflow-hidden group">
              {/* IG Header */}
              <div className="flex items-center justify-between p-3 border-b border-y2k-gunmetal/10">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-y2k-ice border border-y2k-gunmetal/20 overflow-hidden relative">
                    <Image src={post.url} alt="Profile" fill sizes="28px" className="object-cover grayscale" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-y2k-gunmetal lowercase">{post.handle}</span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-y2k-gunmetal/50 hover:text-y2k-gunmetal cursor-pointer transition-colors" />
              </div>

              {/* IG Image */}
              <div className="relative w-full aspect-square bg-y2k-pale overflow-hidden">
                <Image 
                  src={post.url} 
                  alt={`Post by ${post.handle}`} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                  className="object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0" 
                />
              </div>

              {/* IG Footer */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Heart className="w-5 h-5 text-y2k-gunmetal hover:fill-y2k-gunmetal cursor-pointer transition-all" />
                  <MessageCircle className="w-5 h-5 text-y2k-gunmetal hover:text-y2k-slate cursor-pointer transition-all" />
                  <Send className="w-5 h-5 text-y2k-gunmetal hover:text-y2k-slate cursor-pointer transition-all" />
                </div>
                <div className="text-xs leading-relaxed">
                  <span className="font-bold mr-2 text-y2k-gunmetal lowercase">{post.handle}</span>
                  <span className="text-y2k-slate font-medium">{post.caption}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="flex flex-col items-center mt-16">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="group flex items-center gap-3 text-y2k-gunmetal hover:text-y2k-slate transition-colors font-bold text-xs md:text-sm tracking-wider uppercase border-b-2 border-y2k-gunmetal pb-2">
            OPEN APP <ArrowRight strokeWidth={2} className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </a>
        </div>
      </section>
    </div>
  );
}
