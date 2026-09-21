import Image from "next/image";
import Link from "next/link";
import { getAboutContent, sanityImageUrl } from "@/lib/sanity";

// Brand copy comes from Sanity when configured; every field falls back to
// the current copy so the page is identical when it isn't.
export default async function AboutPage() {
  const about = await getAboutContent();

  const heroSrc = sanityImageUrl(about?.heroImage, 2000) ?? "/hero-main.webp";
  const pillars = about?.pillars?.length
    ? about.pillars
    : [
        { value: "480GSM", label: "Dense Cotton" },
        { value: "CHROME", label: "Metal Hardware" },
        { value: "1/1", label: "One-off Vintage" },
        { value: "ZERO", label: "No Replicas / Restocks" },
      ];
  const panels = about?.panels?.length
    ? about.panels
    : [
        {
          kicker: "THE POINT",
          title: "WEAR IT, DON'T CHASE IT",
          body: "Trends move fast. We don't. Our pieces are made with enough weight and shape to stay in your rotation after the feed has moved on.",
        },
        {
          kicker: "THE DETAILS",
          title: "FEEL IT IN THE FABRIC",
          body: "Heavy denim, dense cotton, and hardware that earns its place. The details should show up when you put the piece on, not in a paragraph of jargon.",
        },
      ];
  const ideaBody = about?.ideaBody?.length
    ? about.ideaBody
    : [
        "BAGIFYYYY started with the sharp shine of early-2000s streetwear, the fit of old club photos, and clothes that look better once they have a life.",
        "We make small runs and source one-off vintage pieces. No replicas, no endless restocks. We care about the fit, the fabric, and the details you notice after the first wear.",
      ];

  return (
    <div className="editorial-page bg-[#f5f5f2] text-black min-h-screen font-sans selection:bg-black selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative w-full h-[85vh] sm:h-[90vh] flex items-end justify-start overflow-hidden bg-black">
        <Image
          src={heroSrc}
          alt={about?.heroAlt || "About BAGIFYYYY Archive"}
          fill
          sizes="100vw"
          className="object-cover object-center contrast-[1.08] opacity-85"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-16 md:pb-24 max-w-[1520px] mx-auto w-full">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50 mb-4 font-mono">
            {about?.kicker || "BAGIFYYYY / ABOUT"}
          </p>
          <h1 className="font-sans text-white text-4xl sm:text-6xl md:text-7xl lg:text-[90px] font-medium uppercase tracking-[-0.07em] leading-[0.85] max-w-5xl">
            &quot;{about?.quoteLine1 || "STYLE ISN'T LOUD."}
            <br />
            {about?.quoteLine2 || "IT'S CHROME."}&quot;
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-white/70 mt-6 max-w-lg font-mono">
            {about?.tagline || "Y2K attitude. Heavy fabrics. No filler."}
          </p>
        </div>
      </section>

      {/* 2. Manifesto Split Section */}
      <section className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/50 block mb-4">
              THE IDEA
            </span>
            <h2 className="font-sans text-3xl sm:text-5xl md:text-[56px] font-medium uppercase tracking-[-0.06em] leading-[0.88] text-black">
              {about?.ideaTitle || (
                <>
                  CLOTHES FOR
                  <br />
                  THE OFFBEAT.
                </>
              )}
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 pt-2 lg:pt-8 text-black/75">
            {ideaBody.map((para, i) => (
              <p
                key={i}
                className={`text-sm sm:text-base leading-relaxed ${i === 0 ? "" : "text-black/65"}`}
              >
                {i === 0 && !about?.ideaBody?.length ? (
                  <>
                    <strong className="font-semibold text-black">BAGIFYYYY</strong>
                    {para.replace(/^BAGIFYYYY/, "")}
                  </>
                ) : (
                  para
                )}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Mid Banner Pillars */}
      <section className="w-full bg-black text-white py-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1520px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {pillars.map((pillar) => (
            <div key={`${pillar.value}-${pillar.label}`}>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight block">{pillar.value}</span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50 mt-1 block">{pillar.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Direction & Craft Panels */}
      <section className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 py-24 sm:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          {panels.map((panel) => (
            <div
              key={panel.title}
              className="rounded-2xl bg-white border border-black/10 p-8 sm:p-12 shadow-[0_2px_14px_rgba(0,0,0,0.02)]"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45 block mb-4">{panel.kicker}</span>
              <h3 className="font-sans text-2xl sm:text-3xl uppercase font-bold tracking-tight mb-4">
                {panel.title}
              </h3>
              <p className="text-xs sm:text-sm text-black/65 leading-relaxed">
                {panel.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Monumental Closing CTA */}
      <section className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 pb-28 sm:pb-36 text-center">
        <div className="border-t border-black/10 pt-16 sm:pt-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/45 block mb-4">
            {about?.closingKicker || "START HERE"}
          </span>
          <h2 className="font-sans text-4xl sm:text-6xl md:text-7xl font-medium uppercase tracking-[-0.06em] leading-none mb-8">
            {about?.closingTitle || "FIND YOUR PIECE"}
          </h2>
          <Link
            href="/products"
            className="btn-bagify btn-bagify-dark px-10 py-4 text-[10.5px] uppercase tracking-[0.2em]"
          >
            Shop All Pieces
          </Link>
        </div>
      </section>
    </div>
  );
}
