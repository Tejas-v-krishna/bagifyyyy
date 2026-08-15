"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, PackageCheck, AlertCircle, FileText, CheckCircle2, Truck } from "lucide-react";

export default function ReturnRequestPage() {
  const [step, setStep] = useState<"lookup" | "items" | "success">("lookup");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("SIZE_FIT");
  const [resolution, setResolution] = useState<"REFUND" | "EXCHANGE" | "STORE_CREDIT">("EXCHANGE");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !email) {
      setError("Please input both your Order Number and Email Address.");
      return;
    }
    setError("");
    setStep("items");
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
  };

  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 border-b border-y2k-gunmetal/15">
        <Link
          href="/shipping"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shipping &amp; Deliveries
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-y2k-slate mb-1">
          SELF-SERVICE PORTAL
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-3">
          RETURN REQUEST
        </h1>
        <p className="text-xs md:text-sm text-y2k-gunmetal/80 max-w-xl leading-relaxed">
          Submit your return or exchange request within 30 days of receiving your package. Fast turnaround, transparent tracking, and automated prepaid return manifests.
        </p>
      </section>

      {/* ── Main Form Container ────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {step === "lookup" && (
          <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-y2k-gunmetal/10">
              <RotateCcw className="w-5 h-5 text-y2k-gunmetal" />
              <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                STEP 1: IDENTIFY YOUR ARCHIVE ORDER
              </h2>
            </div>

            <form onSubmit={handleLookup} className="flex flex-col gap-5 max-w-lg">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  ORDER NUMBER*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BGF-83921 or ORD-1029"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
                <span className="text-[10px] text-y2k-slate mt-1">Found in your order confirmation email and SMS.</span>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  EMAIL ADDRESS USED AT CHECKOUT*
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
              </div>

              {error && (
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn-bagify text-white text-xs font-bold uppercase tracking-widest py-3.5 px-8 hover:opacity-90 transition-opacity mt-2"
              >
                LOCATE ORDER DETAILS →
              </button>
            </form>
          </div>
        )}

        {step === "items" && (
          <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-y2k-gunmetal/10">
              <div className="flex items-center gap-3">
                <PackageCheck className="w-5 h-5 text-y2k-gunmetal" />
                <h2 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
                  STEP 2: SELECT ITEMS &amp; REASON
                </h2>
              </div>
              <button
                onClick={() => setStep("lookup")}
                className="text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal underline"
              >
                Change Order
              </button>
            </div>

            <div className="mb-6 p-4 bg-y2k-ice border border-y2k-gunmetal/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate block">ORDER FOUND</span>
                <span className="text-sm font-bold text-y2k-gunmetal uppercase">{orderNumber}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 uppercase tracking-wider">
                Eligible for 30-Day Return
              </span>
            </div>

            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  PRIMARY REASON FOR RETURN / EXCHANGE*
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                >
                  <option value="SIZE_FIT">Size / Fit issue (Too tight / Too loose)</option>
                  <option value="EXCHANGE_DIFF">Exchange for a different model or color</option>
                  <option value="NOT_AS_PICTURED">Did not match expectations / aesthetic</option>
                  <option value="DEFECT">Defect or stitching issue</option>
                  <option value="WRONG_ITEM">Received incorrect garment</option>
                  <option value="WITHDRAWAL">Statutory Right of Withdrawal</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-2">
                  DESIRED RESOLUTION*
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-4 border cursor-pointer flex flex-col justify-between transition-all ${
                    resolution === "EXCHANGE" ? "border-y2k-gunmetal bg-y2k-ice/70" : "border-gray-200 bg-white"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">Exchange Size</span>
                      <input
                        type="radio"
                        name="resolution"
                        checked={resolution === "EXCHANGE"}
                        onChange={() => setResolution("EXCHANGE")}
                        className="accent-black"
                      />
                    </div>
                    <p className="text-[10px] text-y2k-slate">Fastest option. We ship the new size upon carrier scan.</p>
                  </label>

                  <label className={`p-4 border cursor-pointer flex flex-col justify-between transition-all ${
                    resolution === "STORE_CREDIT" ? "border-y2k-gunmetal bg-y2k-ice/70" : "border-gray-200 bg-white"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">Store Credit + 10%</span>
                      <input
                        type="radio"
                        name="resolution"
                        checked={resolution === "STORE_CREDIT"}
                        onChange={() => setResolution("STORE_CREDIT")}
                        className="accent-black"
                      />
                    </div>
                    <p className="text-[10px] text-y2k-slate">Instant digital voucher with a 10% bonus added.</p>
                  </label>

                  <label className={`p-4 border cursor-pointer flex flex-col justify-between transition-all ${
                    resolution === "REFUND" ? "border-y2k-gunmetal bg-y2k-ice/70" : "border-gray-200 bg-white"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">Original Payment</span>
                      <input
                        type="radio"
                        name="resolution"
                        checked={resolution === "REFUND"}
                        onChange={() => setResolution("REFUND")}
                        className="accent-black"
                      />
                    </div>
                    <p className="text-[10px] text-y2k-slate">Refund credited to original bank card within 3-5 days.</p>
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  ADDITIONAL COMMENTS (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify replacement size, details, or notes..."
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 p-3 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 text-xs text-y2k-gunmetal/80">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-y2k-gunmetal shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Please ensure items are in unworn condition, unwashed, and returned with all original tags intact. Vintage pieces are individually verified upon return.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="submit"
                  className="btn-bagify text-white text-xs font-bold uppercase tracking-widest py-3.5 px-8 hover:opacity-90 transition-opacity"
                >
                  GENERATE PREPAID RETURN LABEL →
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white border border-y2k-gunmetal/15 p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto">
            <CheckCircle2 className="w-16 h-16 text-y2k-gunmetal mx-auto mb-4" />
            <h2 className="font-display font-medium text-2xl md:text-3xl uppercase tracking-tight text-y2k-gunmetal mb-2">
              RETURN AUTHORIZED
            </h2>
            <p className="text-xs text-y2k-gunmetal/80 leading-relaxed mb-6">
              Your return RMA <strong>#RMA-{(Math.random() * 80000 + 20000).toFixed(0)}</strong> has been registered. Your prepaid shipping waybill and packing instructions have been dispatched to <strong>{email}</strong>.
            </p>

            <div className="bg-y2k-ice p-5 border border-y2k-gunmetal/15 text-left mb-6 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
                <Truck className="w-4 h-4" /> Next Steps:
              </div>
              <p className="text-[11px] text-y2k-gunmetal/85 leading-relaxed">
                1. Print the emailed shipping manifest and affix it to your return box.
              </p>
              <p className="text-[11px] text-y2k-gunmetal/85 leading-relaxed">
                2. Drop the parcel off at any local courier partner or schedule doorstep pickup.
              </p>
              <p className="text-[11px] text-y2k-gunmetal/85 leading-relaxed">
                3. Once scanned by the courier, your {resolution === "EXCHANGE" ? "exchange item" : resolution === "STORE_CREDIT" ? "store voucher" : "refund"} will be processed automatically.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                href="/products"
                className="btn-bagify text-white text-xs font-bold uppercase tracking-widest px-8 py-3"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
