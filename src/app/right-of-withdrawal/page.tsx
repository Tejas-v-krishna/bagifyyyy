import Link from "next/link";
import { Scale, ArrowLeft, ShieldCheck, FileText, AlertCircle, Clock } from "lucide-react";

export default function RightOfWithdrawalPage() {
  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 border-b border-y2k-gunmetal/15">
        <Link
          href="/shipping"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Help Center
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-y2k-slate mb-1">
          LEGAL NOTICE &amp; STATUTORY CONSUMER RIGHTS
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-4">
          RIGHT OF WITHDRAWAL
        </h1>
        <p className="text-xs md:text-sm text-y2k-gunmetal/80 max-w-2xl leading-relaxed">
          Information concerning the exercise of the right of withdrawal in accordance with Directive 2011/83/EU and global consumer protection standards.
        </p>
      </section>

      {/* ── Main Legal Clauses ────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 md:p-12 shadow-sm flex flex-col gap-10">
          
          {/* Clause 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-y2k-gunmetal" />
              <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                1. RIGHT OF WITHDRAWAL PERIOD
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
              You have the right to withdraw from this contract within <strong>30 calendar days</strong> without giving any reason (extending the statutory 14-day minimum period).
            </p>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed mt-2.5">
              The withdrawal period will expire 30 days from the day on which you acquire, or a third party other than the carrier and indicated by you acquires, physical possession of the last item of your order.
            </p>
          </div>

          {/* Clause 2 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-y2k-gunmetal" />
              <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                2. EXERCISING THE RIGHT OF WITHDRAWAL
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
              To exercise the right of withdrawal, you must inform us (<strong>BAGIFYYYY ARCHIVE Ltd.</strong>, Email: <strong>legal@bagifyyyy.com</strong> or <strong>support@bagifyyyy.com</strong>) of your decision to withdraw from this contract by an unequivocal statement (e.g. via our online <Link href="/return-request" className="font-bold underline text-black">Return Request Portal</Link>, or by email).
            </p>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed mt-2.5">
              You may use the attached Model Withdrawal Form below, but it is not obligatory. To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.
            </p>
          </div>

          {/* Clause 3 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-y2k-gunmetal" />
              <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                3. EFFECTS OF WITHDRAWAL &amp; REIMBURSEMENT
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
              If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery (with the exception of supplementary costs resulting from your choice of a type of delivery other than the least expensive type of standard delivery offered by us), without undue delay and in any event not later than <strong>14 days</strong> from the day on which we are informed about your decision to withdraw from this contract.
            </p>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed mt-2.5">
              We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement. We may withhold reimbursement until we have received the goods back or you have supplied evidence of having sent back the goods, whichever is the earliest.
            </p>
          </div>

          {/* Clause 4 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-y2k-gunmetal" />
              <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                4. RETURNING THE GOODS &amp; CONSUMER OBLIGATIONS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
              You shall send back the goods or hand them over to us without undue delay and in any event not later than 14 days from the day on which you communicate your withdrawal from this contract to us. The deadline is met if you send back the goods before the period of 14 days has expired.
            </p>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed mt-2.5">
              You are only liable for any diminished value of the goods resulting from the handling other than what is necessary to establish the nature, characteristics, and functioning of the garments. Garments must be unwashed, clean, and returned with original archive hangtags attached.
            </p>
          </div>

          {/* Clause 5 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-y2k-gunmetal" />
              <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                5. EXCEPTIONS TO THE RIGHT OF WITHDRAWAL
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-y2k-gunmetal/85 leading-relaxed">
              The right of withdrawal does not apply to contracts for:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-y2k-gunmetal/85 mt-2 space-y-1.5 pl-2">
              <li>The supply of goods made to the consumer&apos;s personalized specifications or clearly tailored (custom bespoke pieces).</li>
              <li>The supply of sealed goods which are not suitable for return due to health protection or hygiene reasons and were unsealed after delivery (e.g. specific intimate garments, undergarments, or earrings).</li>
            </ul>
          </div>

          {/* Model Form Box */}
          <div className="p-6 bg-y2k-ice border border-y2k-gunmetal/20">
            <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-3">
              MODEL WITHDRAWAL FORM TEMPLATE
            </h3>
            <p className="text-[11px] text-y2k-gunmetal/75 mb-4">
              (Complete and return this form only if you wish to withdraw from the contract via written notice)
            </p>
            <div className="bg-white p-4 border border-y2k-gunmetal/15 font-mono text-[11px] text-y2k-gunmetal leading-relaxed space-y-2">
              <p>To: BAGIFYYYY ARCHIVE Support Desk</p>
              <p>Email: legal@bagifyyyy.com / support@bagifyyyy.com</p>
              <p>— I/We [*] hereby give notice that I/We [*] withdraw from my/our [*] contract of sale of the following goods [*]:</p>
              <p>— Ordered on [*] / Received on [*]:</p>
              <p>— Name of consumer(s):</p>
              <p>— Address of consumer(s):</p>
              <p>— Signature of consumer(s) (only if this form is notified on paper):</p>
              <p>— Date:</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-y2k-gunmetal/15">
            <Link
              href="/return-request"
              className="btn-bagify text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 text-center w-full sm:w-auto"
            >
              USE DIGITAL RETURN PORTAL →
            </Link>
            <Link
              href="/customer-service"
              className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:underline"
            >
              Contact Legal &amp; Compliance Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
