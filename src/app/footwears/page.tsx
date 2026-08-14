import CategoryPageClient from "@/components/product/CategoryPageClient";
import { Lock } from "lucide-react";

export default function FootwearsPage() {
  return (
    <div className="relative w-full min-h-[calc(100vh-72px)]">
      {/* Blurred background content */}
      <div className="blur-[8px] opacity-40 pointer-events-none select-none overflow-hidden h-[calc(100vh-72px)]">
        <CategoryPageClient category="footwears" title="Footwears" />
      </div>
      
      {/* Overlay with message */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-y2k-ice/10 backdrop-blur-[2px]">
        <Lock className="w-12 h-12 text-y2k-gunmetal mb-4" strokeWidth={1.5} />
        <h2 className="font-display text-3xl md:text-5xl uppercase tracking-tighter text-heading-gradient text-center px-4">
          Coming Soon to Serve You
        </h2>
      </div>
    </div>
  );
}
