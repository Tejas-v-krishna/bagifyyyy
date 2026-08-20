import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative w-full h-[90vh] flex items-end justify-start overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1512413914594-e88914619a9e?q=80&w=1972"
          alt="About Bagifyyyy"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative z-10 px-8 md:px-16 pb-16 md:pb-24 flex flex-col">
          <p className="section-label text-white/50 mb-5">BAGIFYYYY — EST. 2024</p>
          <h1 className="font-display text-white text-4xl sm:text-6xl md:text-7xl lg:text-[84px] uppercase tracking-[-0.05em] leading-[0.92] max-w-4xl">
            "STYLE ISN'T LOUD.<br />IT'S CHROME."
          </h1>
        </div>
      </section>

      {/* Founder Story */}
      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-16 py-28 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div>
            <span className="section-label text-y2k-gunmetal/45 block mb-5">OUR STORY</span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-[52px] uppercase tracking-[-0.05em] leading-[0.95]">
              WE BUILD FOR THE FREE THINKERS.
            </h2>
          </div>
          <div className="space-y-6 pt-4 md:pt-14">
            <p className="text-sm text-y2k-gunmetal/75 leading-loose">
              Born in 2024, Bagifyyyy emerged from the desire to resurrect the fearless, metallic optimism of the early 2000s and crash it into modern streetwear. We aren't just making bags; we're crafting artifacts for the digital age.
            </p>
            <p className="text-sm text-y2k-gunmetal/75 leading-loose">
              Our unisex streetwear aesthetic refuses to be boxed in. Drawing inspiration from cyber-culture, retro-futurism, and industrial design, Bagifyyyy serves as the ultimate companion for those who navigate the concrete jungle with unapologetic style.
            </p>
          </div>
        </div>
      </section>

      {/* Thin Divider */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-16">
        <div className="divider" />
      </div>

      {/* Our Vision / Our Process */}
      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-16 py-28 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          <div>
            <span className="section-label text-y2k-gunmetal/45 block mb-6">DIRECTION</span>
            <h3 className="font-display text-3xl md:text-4xl uppercase tracking-[-0.04em] mb-6 leading-none">
              OUR VISION
            </h3>
            <p className="text-sm text-y2k-gunmetal/70 leading-loose">
              We view fashion as a primary medium for cultural expression. Bagifyyyy is a canvas where nostalgia meets the future. We believe that what you carry should amplify your identity, breaking away from the mundane and embracing the bold, the shiny, and the unconventional.
            </p>
          </div>
          <div>
            <span className="section-label text-y2k-gunmetal/45 block mb-6">CRAFT</span>
            <h3 className="font-display text-3xl md:text-4xl uppercase tracking-[-0.04em] mb-6 leading-none">
              OUR PROCESS
            </h3>
            <p className="text-sm text-y2k-gunmetal/70 leading-loose">
              Every Bagifyyyy piece is a result of meticulous engineering and ethical sourcing. We use premium, high-durability materials designed to withstand the fast-paced modern lifestyle. From conceptual sketches to the final chrome finish, our process is transparent, sustainable, and obsessively detail-oriented.
            </p>
          </div>
        </div>
      </section>

      {/* Archive Lookbook Strip */}
      <section className="py-20 overflow-hidden bg-y2k-pale/20">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-16 mb-10">
          <span className="section-label text-y2k-gunmetal/45 block mb-4">LOOKBOOK</span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-[-0.05em] leading-none">
            THE ARCHIVE
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-6 px-6 sm:px-8 lg:px-16 pb-8 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
          {[
            { id: "001", src: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600" },
            { id: "002", src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600" },
            { id: "003", src: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=600" },
            { id: "004", src: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=600" },
          ].map((drop, i) => (
            <div key={i} className="flex-none w-[280px] md:w-[380px] snap-center group">
              <div className="relative h-[380px] md:h-[500px] w-full mb-5 overflow-hidden bg-y2k-pale/30">
                <Image
                  src={drop.src}
                  alt={`Drop ${drop.id}`}
                  fill
                  sizes="(max-width: 768px) 280px, 380px"
                  className="object-cover transition-transform duration-600 group-hover:scale-[1.04]"
                />
              </div>
              <p className="section-label text-y2k-gunmetal/45 mb-1">ARCHIVE</p>
              <h3 className="font-display text-2xl uppercase tracking-[-0.04em] leading-none">
                DROP {drop.id}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-16 py-28 md:py-40 text-center">
        <div className="w-px h-16 bg-y2k-gunmetal/15 mx-auto mb-12" />
        <span className="section-label text-y2k-gunmetal/40 block mb-5">THE DROPS</span>
        <h3 className="font-display text-3xl md:text-4xl uppercase tracking-[-0.04em] mb-10">
          Ready to Wear History?
        </h3>
        <Link href="/products" className="btn-bagify inline-block text-[10px] uppercase tracking-[0.2em] px-12 py-5">
          SHOP THE LATEST DROP
        </Link>
      </section>
    </div>
  );
}
