import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | BAGIFYYYY",
  description: "Data protection guidelines and privacy policies.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">PRIVACY POLICY</span>
        </div>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            DATA PROTECTION &amp; PRIVACY
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            PRIVACY POLICY
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            Last updated: August 2026 · How BAGIFYYYY protects, processes, and respects your personal data.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-8 shadow-xs divide-y divide-y2k-gunmetal/10 space-y-6 text-xs text-y2k-gunmetal/80 leading-relaxed">
          <div>
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              1. DATA WE COLLECT
            </h2>
            <p>
              When you purchase or create an account, we collect necessary fulfillment details: name, shipping address, contact phone, and email address. Authentication via Google OAuth uses encrypted tokens and does not expose your raw passwords.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              2. HOW WE USE YOUR INFORMATION
            </h2>
            <p>
              Your data is utilized strictly to fulfill drop shipments, generate shipping airway bills, send tracking alerts, and manage VIP Chrome Club points balance.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              3. NO DATA BROKERING OR SELLING
            </h2>
            <p>
              We never sell, rent, or monetize your personal information to third-party data brokers. Data is only shared with verified logistics partners (couriers) and payment gateways (Razorpay) to execute order delivery.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              4. SECURITY &amp; ENCRYPTION
            </h2>
            <p>
              All traffic and data transactions are secured using 256-bit SSL encryption. Payment card numbers are processed directly by PCI-DSS certified gateways and never touch our servers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
