import Link from "next/link";
import { AlertCircle } from "lucide-react";
import EditorialPageShell, { EditorialPanel } from "@/components/layout/EditorialPageShell";

export const dynamic = "force-dynamic";

export default function CheckoutCancelPage() {
  return (
    <EditorialPageShell
      eyebrow="CHECKOUT // PAYMENT STATUS"
      title="PAYMENT CANCELLED"
       description="Payment was not completed. Nothing was charged, and the items in your bag are still there."
      backHref="/checkout"
      backLabel="Back to checkout"
    >
      <EditorialPanel className="mx-auto max-w-lg text-center p-8 sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-black/15 bg-[#f5f5f2]">
          <AlertCircle className="w-8 h-8 text-black" aria-hidden="true" />
        </div>

        <h2 className="font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black mb-3">
           Payment not completed
        </h2>
        <p className="text-xs sm:text-sm text-black/60 leading-relaxed mb-8 max-w-sm mx-auto">
           Go back to checkout to try another payment method or review your order.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/checkout"
            className="flex-1 bg-black text-white px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors text-center cursor-pointer shadow-xs"
          >
            Return to Checkout →
          </Link>
          <Link
            href="/"
            className="flex-1 border border-black/15 bg-white text-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] hover:border-black hover:bg-black/[0.02] transition-colors text-center cursor-pointer"
          >
            Return to Home
          </Link>
        </div>

        <p className="text-[11px] text-black/40 mt-8">
          Need help? Reach out at{" "}
          <a href="mailto:support@bagifyyyy.com" className="underline font-medium text-black">
            support@bagifyyyy.com
          </a>
        </p>
      </EditorialPanel>
    </EditorialPageShell>
  );
}
