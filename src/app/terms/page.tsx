import Link from "next/link";
import { Scale, ArrowLeft, Shield, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 border-b border-y2k-gunmetal/15">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-y2k-slate mb-1">
          LEGAL TERMS &amp; CONDITIONS OF SALE
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-4">
          TERMS OF SERVICE
        </h1>
        <p className="text-xs md:text-sm text-y2k-gunmetal/80 max-w-xl leading-relaxed">
          Last updated: August 2026. Please review these Terms of Service carefully before purchasing or accessing our drop platforms.
        </p>
      </section>

      {/* ── Terms Content ────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 md:p-12 shadow-sm flex flex-col gap-8 text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
          
          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              1. OVERVIEW &amp; APPLICABILITY
            </h2>
            <p>
              This website is operated by <strong>BAGIFYYYY ARCHIVE Ltd.</strong> (&quot;BAGIFYYYY&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By visiting our site and/or purchasing garments from our drops, you engage in our &quot;Service&quot; and agree to be bound by the following terms and conditions (&quot;Terms of Service&quot;, &quot;Terms&quot;).
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              2. DROP CULTURE &amp; ORDER ACCEPTANCE
            </h2>
            <p>
              Due to the limited micro-batch nature of our archive and drop culture, placing an item in your bag does not reserve the stock until payment authorization is complete. We reserve the right to limit the order quantity of any product per customer, IP address, or payment instrument to prevent automated bot purchasing.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              3. PRICING &amp; PAYMENT SECURITY
            </h2>
            <p>
              Prices for our products are subject to change without notice. All online transactions are encrypted via industry-standard SSL and processed securely through Razorpay, Stripe, or authorized regional payment gateways. We do not store raw card credentials on our servers.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              4. ACCURACY OF BILLING &amp; ACCOUNT INFORMATION
            </h2>
            <p>
              You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. You agree to promptly update your account and other information, including your email address and payment details, so that we can complete your transactions and contact you as needed.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              5. RETURNS, CANCELLATIONS &amp; WITHDRAWAL
            </h2>
            <p>
              Our complete return and cancellation guidelines are governed by our <Link href="/shipping" className="font-bold underline text-black">Shipping &amp; Returns Policy</Link> and statutory <Link href="/right-of-withdrawal" className="font-bold underline text-black">Right of Withdrawal</Link>.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              6. INTELLECTUAL PROPERTY RIGHTS
            </h2>
            <p>
              All trademarks, product designs, lookbook imagery, custom graphics, typography, and website codebase are the exclusive intellectual property of BAGIFYYYY ARCHIVE Ltd. Any reproduction, distribution, or unauthorized commercial exploitation is strictly prohibited without written consent.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              7. GOVERNING LAW &amp; DISPUTE RESOLUTION
            </h2>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the applicable laws of India and international consumer protection standards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
