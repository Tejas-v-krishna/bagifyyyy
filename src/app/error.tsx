"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="bg-y2k-ice min-h-[75vh] flex items-center justify-center px-4 py-16 text-y2k-gunmetal font-sans">
       <div className="editorial-panel w-full max-w-md bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-y2k-ice border border-y2k-gunmetal/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-5 h-5 text-y2k-gunmetal" />
        </div>

        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
           SOMETHING WENT WRONG
        </span>

        <h1 className="font-display font-medium text-2xl uppercase tracking-[-0.03em] mb-2 text-y2k-gunmetal">
           THIS PAGE BROKE
        </h1>

        <p className="text-xs text-y2k-gunmetal/70 leading-relaxed mb-6">
           We hit a temporary problem loading this page. Try again or head back to the shop.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="btn-bagify w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
             <span>TRY AGAIN</span>
          </button>

          <Link
            href="/"
            className="w-full py-3 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal/80 hover:text-black bg-y2k-ice border border-y2k-gunmetal/15 transition-colors text-center"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
