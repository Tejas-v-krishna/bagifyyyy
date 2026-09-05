import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export const metadata = {
  title: "Sale Policy Notice | BAGIFYYYY",
  description: "Terms for one-off vintage and small-run items.",
};

export default function RightOfWithdrawalPage() {
  return (
    <EditorialPageShell
      eyebrow="Orders / Final sale"
      title="One-off item terms"
      description="One-off vintage, deadstock, and small-run items are final sale once an order is confirmed."
    >
      <div className="rounded-2xl border border-black/10 bg-white p-8 sm:p-12 text-center shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
        <div className="w-14 h-14 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-6 text-black">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="font-sans font-bold text-2xl uppercase tracking-tight text-black mb-3">
          WHY THESE TERMS APPLY
        </h3>
        <p className="text-xs sm:text-sm text-black/65 max-w-md mx-auto leading-relaxed mb-8">
          One-off pieces cannot be restocked or replaced after they ship.
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
            Return to Catalog
          </Link>
        </div>
      </div>
    </EditorialPageShell>
  );
}
