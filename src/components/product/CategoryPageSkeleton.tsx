export default function CategoryPageSkeleton({ title }: { title?: string }) {
  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Back to store rail */}
        <div className="mb-8 flex items-center justify-start border-b border-black/10 pb-3">
          <span className="h-3 w-32 rounded-sm bg-black/10" />
        </div>

        {/* Monumental title */}
        <header className="mb-8 border-b border-black/10 pb-6 sm:mb-12 sm:pb-8">
          <h1 className="max-w-[16ch] font-microgramma text-[clamp(2rem,5.5vw,5.2rem)] font-bold uppercase leading-[0.88] tracking-tight text-[#050505]">
            {title ? title.toUpperCase() : " "}
          </h1>
        </header>

        {/* Product grid placeholder */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] w-full bg-black/[0.06]" />
              <div className="mt-3 h-3 w-2/3 bg-black/10" />
              <div className="mt-1.5 h-3 w-1/3 bg-black/[0.07]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
