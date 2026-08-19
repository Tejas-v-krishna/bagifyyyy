import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Return Policy | BAGIFYYYY",
  description: "Bagify final sale policy notice for 1-of-1 archive and vintage pieces.",
};

export default function ReturnRequestPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      <section className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
        </Link>
        <div className="w-14 h-14 bg-y2k-gunmetal/5 border border-y2k-gunmetal/20 rounded-full flex items-center justify-center mx-auto mb-6 text-y2k-gunmetal">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-tight font-medium text-y2k-gunmetal mb-4">
          ALL SALES ARE FINAL
        </h1>
        <p className="text-xs sm:text-sm text-y2k-gunmetal/80 max-w-lg mx-auto leading-relaxed mb-8">
          BAGIFYYYY specializes exclusively in authenticated, single-quantity (1-of-1) vintage and archive pieces. Because each item cannot be replicated or replaced, we do not accept returns, exchanges, or order cancellations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shipping"
            className="btn-bagify text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 shadow-sm"
          >
            VIEW SHIPPING POLICY
          </Link>
          <Link
            href="/"
            className="bg-white border border-y2k-gunmetal/20 text-y2k-gunmetal text-xs font-bold uppercase tracking-widest px-8 py-3.5 hover:bg-gray-50 transition-colors"
          >
            EXPLORE THE DROPS
          </Link>
        </div>
      </section>
    </div>
  );
}
