import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          PRIVACY &amp; DATA PROTECTION COMPLIANCE
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-4">
          PRIVACY POLICY
        </h1>
        <p className="text-xs md:text-sm text-y2k-gunmetal/80 max-w-xl leading-relaxed">
          Last updated: August 2026. How BAGIFYYYY protects, processes, and respects your personal data under GDPR and Digital Personal Data Protection laws.
        </p>
      </section>

      {/* ── Privacy Policy Content ────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 md:p-12 shadow-sm flex flex-col gap-8 text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
          
          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              1. INFORMATION WE COLLECT
            </h2>
            <p>
              When you visit the site, we collect certain information about your device, your interaction with the site, and information necessary to process your drop purchases. We may also collect additional information if you contact us for customer support.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-y2k-gunmetal/80">
              <li><strong>Order Data:</strong> Name, shipping address, billing address, payment confirmation, email address, phone number.</li>
              <li><strong>Account Credentials:</strong> Hashed password or OAuth token for Google Sign-In authentication.</li>
              <li><strong>Technical Data:</strong> Browser version, IP address, time zone, cookie session data.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              2. HOW WE USE YOUR PERSONAL DATA
            </h2>
            <p>
              We use your personal information to provide our services to you, which includes: offering products for sale, processing payments, shipping and fulfillment of your order, and keeping you up to date on new drops, services, and policies with your explicit consent.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              3. NO DATA SELLING POLICY
            </h2>
            <p>
              We do not sell, rent, or trade your personal information to third-party data brokers or advertisers under any circumstances. Data is only shared with verified service providers (courier partners, secure payment processors) strictly to fulfill your purchases.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              4. YOUR RIGHTS UNDER GDPR &amp; DPDP
            </h2>
            <p>
              You have the right to access personal information we hold about you, to port it to a new service, and to ask that your personal information be corrected, updated, or erased at any time by emailing <strong>privacy@bagifyyyy.com</strong>.
            </p>
          </div>

          <div>
            <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-2">
              5. CONTACT DATA PROTECTION OFFICER
            </h2>
            <p>
              For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact our Data Protection Officer by email at <strong>privacy@bagifyyyy.com</strong> or via our <Link href="/customer-service" className="font-bold underline text-black">Customer Service Concierge</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
