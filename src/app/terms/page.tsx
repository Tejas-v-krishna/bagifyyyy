import EditorialPageShell, { EditorialPanel } from "@/components/layout/EditorialPageShell";

export const metadata = {
  title: "Terms of Service | BAGIFYYYY",
  description: "Terms and conditions governing drop purchases and website usage.",
};

export default function TermsPage() {
  return (
    <EditorialPageShell
      eyebrow="Legal / Conditions of sale"
      title="Terms of service"
      description="Last updated: August 2026. These terms cover purchases, payments, and orders."
    >
        <EditorialPanel className="divide-y divide-y2k-gunmetal/10 space-y-6 text-xs leading-relaxed text-y2k-gunmetal/80">
          <div>
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              1. OVERVIEW &amp; APPLICABILITY
            </h2>
            <p>
              This website is operated by <strong>BAGIFYYYY ARCHIVE Ltd.</strong> By using the site or buying from us, you agree to these Terms of Service.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              2. ORDERS &amp; AVAILABILITY
            </h2>
            <p>
              Items in your bag are not reserved until payment is confirmed. We may limit quantities to keep one-off and small-run pieces available to individual customers.
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
              4. FINAL SALE POLICY
            </h2>
            <p>
              One-off vintage and small-run pieces are final sale. Check the measurements, condition notes, and photos before ordering.
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

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              6. ORDERS, CANCELLATIONS &amp; SERVICE
            </h2>
            <p>
              An order is accepted only after payment confirmation or COD approval. Items are limited and may become unavailable before payment is completed. For order questions, contact support@bagifyyyy.com with your order number. Any cancellation, refund, or exception is handled according to the applicable policy shown at checkout and on the relevant policy page.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              7. LIABILITY &amp; GOVERNING TERMS
            </h2>
            <p>
              We work to keep product information, availability, pricing, and delivery estimates accurate, but minor errors or service interruptions may occur. These terms are subject to applicable Indian law. Any mandatory consumer rights remain unaffected by these terms.
            </p>
          </div>
        </EditorialPanel>
    </EditorialPageShell>
  );
}
