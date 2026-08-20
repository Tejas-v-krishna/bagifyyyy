import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | BAGIFYYYY",
  description: "Terms and conditions governing drop purchases and website usage.",
};

export default function TermsPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">TERMS OF SERVICE</span>
        </div>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            LEGAL &amp; CONDITIONS OF SALE
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            TERMS OF SERVICE
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            Last updated: August 2026 · Governing drop purchases, payment processing, and vault orders.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-8 shadow-xs divide-y divide-y2k-gunmetal/10 space-y-6 text-xs text-y2k-gunmetal/80 leading-relaxed">
          <div>
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              1. OVERVIEW &amp; APPLICABILITY
            </h2>
            <p>
              This website is operated by <strong>BAGIFYYYY ARCHIVE Ltd.</strong> By accessing our platform and acquiring garments from our drops, you agree to be bound by these Terms of Service.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              2. DROP CULTURE &amp; ORDER ALLOCATION
            </h2>
            <p>
              Due to the limited 1-of-1 archive nature of our pieces, items in your bag are not reserved until checkout payment is confirmed. We reserve the right to limit order quantities to prevent automated bot abuse.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              3. PRICING &amp; PAYMENT SECURITY
            </h2>
            <p>
              Prices are listed in INR (₹) inclusive of applicable taxes. Transactions are encrypted via SSL and processed securely via Razorpay and authorized regional payment gateways.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              4. ARCHIVE POLICY (FINAL SALE)
            </h2>
            <p>
              Because every piece is an authenticated 1-of-1 vintage or archive artifact, all sales are strictly final. Please inspect sizing measurements and photography before purchase.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              5. INTELLECTUAL PROPERTY
            </h2>
            <p>
              All branding, typography, photography, and digital visual assets are the exclusive property of BAGIFYYYY ARCHIVE Ltd.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
