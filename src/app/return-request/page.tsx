import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export const metadata = {
  title: "Return Policy | BAGIFYYYY",
  description: "BAGIFYYYY final sale policy for one-off vintage and small-run pieces.",
};

export default function ReturnRequestPage() {
  return (
    <EditorialPageShell
      eyebrow="Returns / Final sale"
      title="All sales are final"
      description="Many BAGIFYYYY pieces are one-off vintage or made in small runs. We do not accept returns, exchanges, or cancellations after an order is confirmed."
    >
      <div className="rounded-2xl border border-black/10 bg-white p-8 sm:p-12 text-center shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div className="w-14 h-14 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-black">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="font-sans font-bold text-2xl uppercase tracking-tight text-black mb-3">
          WHY SALES ARE FINAL
        </h3>
        <p className="text-xs sm:text-sm text-black/65 max-w-md mx-auto leading-relaxed mb-8">
          We photograph, measure, clean, and check each piece before shipping. Review the listing carefully before you order.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shipping"
            className="btn-bagify btn-bagify-dark text-xs font-bold uppercase tracking-[0.16em] px-8 py-3.5"
          >
            View Shipping Policy
          </Link>
          <Link
            href="/products"
            className="btn-bagify bg-white text-black border border-black/15 text-xs font-bold uppercase tracking-[0.16em] px-8 py-3.5 hover:bg-black/5 transition-colors"
          >
            Shop All Pieces
          </Link>
        </div>
      </div>
    </EditorialPageShell>
  );
}
