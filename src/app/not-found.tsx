import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-y2k-ice min-h-[75vh] flex items-center justify-center px-4 py-16 text-y2k-gunmetal font-sans">
       <div className="editorial-panel w-full max-w-md bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-y2k-ice border border-y2k-gunmetal/10 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-5 h-5 text-y2k-gunmetal" />
        </div>

        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
           ERROR 404 · NOT HERE
        </span>

        <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] mb-2 text-y2k-gunmetal">
          PIECE NOT FOUND
        </h1>

        <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-6">
           That page or piece does not exist. It may have sold out or moved.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/products"
            className="btn-bagify w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
          >
             <span>SHOP ALL PIECES</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/"
            className="w-full py-3 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-black bg-y2k-ice border border-y2k-gunmetal/15 transition-colors text-center"
          >
            Return to Homepage
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-y2k-gunmetal/10 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70">
          <Link href="/topwears" className="hover:text-black">Shirts &amp; Tees</Link>
          <Link href="/bottomwears" className="hover:text-black">Pants</Link>
          <Link href="/bundles" className="hover:text-black">Bundles</Link>
        </div>
      </div>
    </div>
  );
}
