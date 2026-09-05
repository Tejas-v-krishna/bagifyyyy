"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, QrCode, CreditCard, Landmark, Wallet, CheckCircle2, Loader2 } from "lucide-react";

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
  onPaymentSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

export default function RazorpayModal({
  isOpen,
  onClose,
  orderData,
  onPaymentSuccess,
}: RazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [upiId, setUpiId] = useState("user@okaxis");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("888");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  
  // Processing stages: 'form' | 'processing' | 'otp' | 'success' | 'failed'
  const [stage, setStage] = useState<"form" | "processing" | "otp" | "success">("form");
  const [otp, setOtp] = useState("123456");

  if (!isOpen) return null;

  const handleStartPayment = () => {
    setStage("processing");
    setTimeout(() => {
      setStage("otp");
    }, 1000);
  };

  const handleAuthorizeOtp = () => {
    setStage("processing");
    setTimeout(() => {
      setStage("success");
      setTimeout(() => {
        onPaymentSuccess({
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 14)}`,
          razorpay_order_id: orderData.razorpayOrderId,
          razorpay_signature: `sig_test_${Date.now()}`,
        });
      }, 1000);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="mono-payment fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
           className="relative w-full max-w-[680px] bg-white overflow-hidden border border-black/15"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="bg-black text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-cta)] bg-white/10 flex items-center justify-center text-white font-bold text-xl border border-white/20">
                ✦
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base tracking-wide">BAGIFYYYY</h3>
                  <span className="border border-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
                    SECURE CHECKOUT
                  </span>
                </div>
                <p className="text-xs text-gray-300">Order #{orderData.orderNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">AMOUNT PAYABLE</p>
                <p className="font-bold text-lg text-white">₹{orderData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader banner */}
          <div className="flex items-center justify-between border-b border-black/10 bg-[var(--surface-panel)] px-5 py-2 text-[11px] text-black/60">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-black" /> Razorpay Trusted Business Gateway
            </div>
            <div className="text-gray-500">
              {orderData.customer.email} • +91 {orderData.customer.phone}
            </div>
          </div>

          {/* Main Body */}
          {stage === "form" && (
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] min-h-[360px]">
              {/* Payment Methods Sidebar */}
              <div className="flex flex-col gap-1 border-r border-black/10 bg-[var(--surface-paper)] p-2">
                <button
                  onClick={() => setSelectedMethod("upi")}
                  className={`flex items-center gap-3 w-full p-3 rounded-md text-left text-xs font-bold transition-all ${
                    selectedMethod === "upi"
                      ? "border border-black/15 bg-white text-black"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-black shrink-0" />
                  <span>UPI & QR</span>
                </button>

                <button
                  onClick={() => setSelectedMethod("card")}
                  className={`flex items-center gap-3 w-full p-3 rounded-md text-left text-xs font-bold transition-all ${
                    selectedMethod === "card"
                      ? "border border-black/15 bg-white text-black"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-black shrink-0" />
                  <span>Cards (Debit/Credit)</span>
                </button>

                <button
                  onClick={() => setSelectedMethod("netbanking")}
                  className={`flex items-center gap-3 w-full p-3 rounded-md text-left text-xs font-bold transition-all ${
                    selectedMethod === "netbanking"
                      ? "border border-black/15 bg-white text-black"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Landmark className="w-4 h-4 text-black shrink-0" />
                  <span>Netbanking</span>
                </button>

                <button
                  onClick={() => setSelectedMethod("wallet")}
                  className={`flex items-center gap-3 w-full p-3 rounded-md text-left text-xs font-bold transition-all ${
                    selectedMethod === "wallet"
                      ? "border border-black/15 bg-white text-black"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Wallet className="w-4 h-4 text-black shrink-0" />
                  <span>Wallets</span>
                </button>
              </div>

              {/* Method Panel Details */}
              <div className="p-6 flex flex-col justify-between">
                {/* UPI Panel */}
                {selectedMethod === "upi" && (
                  <div className="flex flex-col gap-4">
                    <h4 className="font-bold text-sm text-gray-800">Pay via UPI Apps / QR</h4>
                    
                    {/* Fast UPI Badges */}
                    <div className="grid grid-cols-3 gap-2">
                      {["Google Pay", "PhonePe", "Paytm"].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiId(`demo@${app.toLowerCase().replace(" ", "")}`)}
                          className="rounded-[var(--radius-cta)] border border-black/15 p-2.5 text-center text-xs font-semibold text-black transition-all hover:border-black hover:bg-[var(--surface-panel)] flex flex-col items-center gap-1"
                        >
                          <span className="text-sm">📱</span>
                          <span>{app}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-[1px] bg-gray-200"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Or enter VPA / UPI ID</span>
                      <div className="flex-1 h-[1px] bg-gray-200"></div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">UPI ID (VPA)</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. 9876543210@upi or yourname@oksbi"
                        className="field-line text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Card Panel */}
                {selectedMethod === "card" && (
                  <div className="flex flex-col gap-3.5">
                    <h4 className="font-bold text-sm text-gray-800">Enter Card Details (Demo Mode)</h4>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 1111 1111 1111"
                        className="field-line text-sm tracking-wider font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="field-line text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="888"
                          className="field-line text-sm font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* NetBanking Panel */}
                {selectedMethod === "netbanking" && (
                  <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-sm text-gray-800">Popular Indian Banks</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank", "Punjab National"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`p-2.5 text-xs font-semibold rounded-md border text-left transition-all ${
                            selectedBank === b
                              ? "border-blue-600 bg-blue-50/70 text-blue-900 font-bold"
                              : "border-black/15 hover:bg-[var(--surface-panel)] text-black/65"
                          }`}
                        >
                          🏦 {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet Panel */}
                {selectedMethod === "wallet" && (
                  <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-sm text-gray-800">Select Wallet</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["Amazon Pay", "Paytm Wallet", "MobiKwik", "Freecharge"].map((w) => (
                        <button
                          key={w}
                          type="button"
                          className="rounded-[var(--radius-cta)] border border-black/15 p-3 text-left text-xs font-semibold text-black hover:border-black hover:bg-[var(--surface-panel)]"
                        >
                          👛 {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Pay Button */}
                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">🔒 100% Safe & Encrypted</span>
                  <button
                    type="button"
                    onClick={handleStartPayment}
                    className="editorial-cta-dark gap-2 px-6 text-sm"
                  >
                    <span>Pay ₹{orderData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Processing / Handshake stage */}
          {stage === "processing" && (
            <div className="p-12 flex flex-col items-center justify-center text-center min-h-[340px]">
                <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
                <h4 className="font-bold text-base text-black mb-1">Contacting payment gateway…</h4>
                <p className="text-xs text-black/55">Please do not refresh or close this window.</p>
            </div>
          )}

          {/* Simulated Bank OTP Stage */}
          {stage === "otp" && (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[340px] max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-panel)] text-black flex items-center justify-center mb-4">
                <Landmark className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-gray-800 mb-1">Bank 2-Factor Authentication</h4>
              <p className="font-bold text-xs text-gray-500 mb-6">
                Enter simulated OTP sent to +91 {orderData.customer.phone || '9876543210'} for ₹{orderData.amount.toFixed(2)}
              </p>

              <div className="w-full mb-6">
                <label className="block text-[11px] font-bold text-gray-600 mb-1 text-left">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="field-line w-full text-center text-2xl font-mono tracking-wider"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Default test OTP: <b>123456</b></span>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStage("form")}
                  className="flex-1 border border-black/15 text-black py-3 rounded-[var(--radius-cta)] text-xs font-bold hover:bg-[var(--surface-panel)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizeOtp}
                  className="editorial-cta-dark flex-1 py-3 text-xs"
                >
                  Authorize Payment ✓
                </button>
              </div>
            </div>
          )}

          {/* Success stage */}
          {stage === "success" && (
            <div className="p-12 flex flex-col items-center justify-center text-center min-h-[340px]">
                <div className="w-14 h-14 rounded-full bg-[var(--surface-panel)] text-black flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
                <h4 className="font-bold text-lg text-black mb-1">Payment authorized</h4>
                <p className="text-xs text-black/55">Confirming your order with BAGIFYYYY…</p>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
