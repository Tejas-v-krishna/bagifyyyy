import EditorialPageShell, { EditorialPanel } from "@/components/layout/EditorialPageShell";

export const metadata = {
  title: "Privacy Policy | BAGIFYYYY",
  description: "Data protection guidelines and privacy policies.",
};

export default function PrivacyPolicyPage() {
  return (
    <EditorialPageShell
      eyebrow="Data protection / Privacy"
      title="Privacy policy"
      description="Last updated: August 2026. How BAGIFYYYY protects, processes, and respects personal data."
    >
        <EditorialPanel className="divide-y divide-y2k-gunmetal/10 space-y-6 text-xs leading-relaxed text-y2k-gunmetal/80">
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
              We use your data to process orders, create shipping labels, send tracking updates, and manage your points.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              3. NO DATA BROKERING OR SELLING
            </h2>
            <p>
              We do not sell or rent your personal information. We share only what is needed with couriers, Razorpay, and other providers that help us complete your order.
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

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              5. COOKIES, SESSIONS &amp; THIRD PARTIES
            </h2>
            <p>
              We use essential browser storage for your bag, wishlist, sign-in session, and checkout continuity. Google authentication, Razorpay payments, reCAPTCHA, courier services, and email providers may process the information required to provide those services under their own policies.
            </p>
          </div>

          <div className="pt-6">
            <h2 className="font-display font-medium text-base uppercase tracking-tight text-y2k-gunmetal mb-1.5">
              6. YOUR CONTROLS &amp; RETENTION
            </h2>
            <p>
              We keep account, order, support, and tax records for as long as needed to provide service, meet legal obligations, and resolve disputes. To request access, correction, deletion where legally available, or clarification about your data, contact support@bagifyyyy.com.
            </p>
          </div>
        </EditorialPanel>
    </EditorialPageShell>
  );
}
