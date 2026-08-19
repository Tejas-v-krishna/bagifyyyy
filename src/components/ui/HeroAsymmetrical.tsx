"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function HeroAsymmetrical() {
  return (
    <div className="w-full relative flex-1 flex overflow-hidden border-t border-y2k-gunmetal/15 bg-y2k-ice">
      
      {/* Container to restrict max width if needed, but hero often goes full width */}
      <div className="w-full h-full relative group/hero">
        
        {/* Main Massive Image (Left/Background) */}
        <div className="absolute top-0 left-0 w-full md:w-[75%] h-full">
          <Link href="/topwears" className="relative w-full h-full block group/link overflow-hidden cursor-pointer">
            <div className="absolute inset-0 bg-[url('/hero-1-new.jpg')] bg-cover bg-center transition-transform duration-1000 group-hover/link:scale-105" />
            <div className="absolute inset-0 bg-y2k-gunmetal/5 transition-colors duration-500 group-hover/link:bg-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
            
            {/* Action Text */}
            <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80 mb-2 drop-shadow-md">
                DROP 09
              </p>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-white drop-shadow-lg leading-[0.9]">
                ARCHIVE <br /> COLLECTION
              </h2>
            </div>
            
            {/* Button */}
            <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 z-20">
              <div className="btn-bagify inline-flex items-center justify-center text-white rounded-none font-bold text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.15em] px-6 py-4 shadow-md backdrop-blur-md hover:scale-105 transition-transform">
                <span>SHOP MENS</span>
                <ArrowUpRight className="ml-2 w-3.5 h-3.5 group-hover/link:rotate-45 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Floating/Overlapping Secondary Image (Right/Foreground) */}
        <div className="absolute bottom-0 right-0 w-[45%] md:w-[35%] h-[60%] md:h-[75%] border-l-4 border-t-4 border-y2k-ice shadow-2xl z-30">
          <Link href="/bottomwears" className="relative w-full h-full block group/link overflow-hidden cursor-pointer bg-black">
            <div className="absolute inset-0 bg-[url('/hero-2.jpg')] bg-cover bg-center transition-transform duration-1000 group-hover/link:scale-105" />
            <div className="absolute inset-0 bg-y2k-gunmetal/10 transition-colors duration-500 group-hover/link:bg-transparent" />
            
            {/* Small Action Badge */}
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-white text-y2k-gunmetal inline-flex items-center justify-center font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] px-3 py-2 shadow-sm">
                <span>WOMENS</span>
                <ArrowUpRight className="ml-1.5 w-3 h-3 group-hover/link:rotate-45 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
