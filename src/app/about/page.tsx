import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1512413914594-e88914619a9e?q=80&w=1972"
          alt="About Bagifyyyy"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4 flex flex-col items-center">
          <h1 className="font-display text-[#F8F5E9] text-5xl md:text-7xl uppercase tracking-tighter font-black max-w-4xl leading-tight">
            "STYLE ISN'T LOUD. IT'S CHROME."
          </h1>
          <p className="mt-6 text-[#F8F5E9] text-xl font-bold tracking-widest uppercase">
            BAGIFYYYY — EST. 2024
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter font-black leading-none">
              WE BUILD FOR THE FREE THINKERS.
            </h2>
          </div>
          <div className="space-y-6 text-lg">
            <p>
              Born in 2024, Bagifyyyy emerged from the desire to resurrect the fearless, metallic optimism of the early 2000s and crash it into modern streetwear. We aren't just making bags; we're crafting artifacts for the digital age.
            </p>
            <p>
              Our unisex streetwear aesthetic refuses to be boxed in. Drawing inspiration from cyber-culture, retro-futurism, and industrial design, Bagifyyyy serves as the ultimate companion for those who navigate the concrete jungle with unapologetic style.
            </p>
          </div>
        </div>
      </section>

      {/* Our Vision / Our Process */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-24 border-t border-y2k-gunmetal/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-display text-3xl uppercase tracking-tighter font-black mb-4">
              OUR VISION
            </h3>
            <p className="text-lg">
              We view fashion as a primary medium for cultural expression. Bagifyyyy is a canvas where nostalgia meets the future. We believe that what you carry should amplify your identity, breaking away from the mundane and embracing the bold, the shiny, and the unconventional.
            </p>
          </div>
          <div>
            <h3 className="font-display text-3xl uppercase tracking-tighter font-black mb-4">
              OUR PROCESS
            </h3>
            <p className="text-lg">
              Every Bagifyyyy piece is a result of meticulous engineering and ethical sourcing. We use premium, high-durability materials designed to withstand the fast-paced modern lifestyle. From conceptual sketches to the final chrome finish, our process is transparent, sustainable, and obsessively detail-oriented.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline / Lookbook strip */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 mb-12">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter font-black text-center">
            THE ARCHIVE
          </h2>
        </div>
        <div className="flex overflow-x-auto space-x-6 px-4 sm:px-6 lg:px-12 pb-8 snap-x snap-mandatory hide-scrollbar">
          {[
            { id: "001", src: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600" },
            { id: "002", src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600" },
            { id: "003", src: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=600" },
            { id: "004", src: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=600" },
          ].map((drop, i) => (
            <div key={i} className="flex-none w-[300px] md:w-[400px] snap-center group">
              <div className="relative h-[400px] md:h-[500px] w-full mb-4 overflow-hidden bg-gray-200">
                <Image
                  src={drop.src}
                  alt={`Drop ${drop.id}`}
                  fill
                  sizes="(max-width: 768px) 300px, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="font-display text-2xl uppercase tracking-tighter font-black">
                DROP {drop.id}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-24 text-center">
        <Link href="/products" className="inline-block bg-[#232D3B] text-[#F8F5E9] rounded-none font-bold uppercase tracking-widest px-8 py-4 hover:bg-black transition-colors">
          SHOP THE LATEST DROP →
        </Link>
      </section>
    </div>
  );
}
