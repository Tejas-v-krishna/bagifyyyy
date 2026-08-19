"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useCartStore, getItemKey } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, ArrowRight, User, ShieldCheck, Truck, CreditCard, Banknote, Tag, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh"
];

// Helper to ensure Razorpay script is loaded
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function CheckoutContent() {
  const router = useRouter();
  const { items, cartTotal, updateQuantity, removeItem, clearCart } = useCartStore();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const searchParams = useSearchParams();
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'guest' | 'account'>(isAuthenticated ? 'account' : 'select');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Promo code state (pre-filled from cart URL param)
  const VALID_PROMOS: Record<string, number> = { BAGIFY10: 0.10 };
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = () => {
    const upper = promoInput.trim().toUpperCase();
    if (VALID_PROMOS[upper]) {
      setAppliedPromo({ code: upper, discount: VALID_PROMOS[upper] });
      setPromoError("");
    } else {
      setPromoError("Invalid promo code.");
      setAppliedPromo(null);
    }
  };

  // Address Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });

  // Shipping & Payment Options
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  // Auto-apply promo from cart URL param
  useEffect(() => {
    const promoFromCart = searchParams.get("promo");
    if (promoFromCart && VALID_PROMOS[promoFromCart.toUpperCase()]) {
      const upper = promoFromCart.toUpperCase();
      setAppliedPromo({ code: upper, discount: VALID_PROMOS[upper] });
      setPromoInput(upper);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user details if authenticated
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
      }));
      setCheckoutMode('account');
    }
  }, [user]);

  // Preload Razorpay Script
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const total = cartTotal();
  const shipping = shippingMethod === 'express' ? 99 : (total >= 299 ? 0 : 49);
  const codFee = paymentMethod === 'cod' ? 49 : 0;
  const discountAmount = appliedPromo ? Math.round(total * appliedPromo.discount * 100) / 100 : 0;
  const finalTotal = total - discountAmount + shipping + codFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentSuccess = async (orderId: string, response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    try {
      setLoading(true);
      const verifyRes = await fetch('/api/payment/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok) {
        clearCart();
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        alert(verifyData.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verify error:', err);
      alert('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    setError("");

    if (!formData.fullName || !formData.email || !formData.phone || !formData.street || !formData.pincode || !formData.city) {
      setActiveStep(1);
      setError("Please fill out all required delivery fields.");
      return;
    }

    try {
      setLoading(true);

      // Handle Cash on Delivery
      if (paymentMethod === 'cod') {
        const res = await fetch('/api/payment/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            shippingAddress: formData,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            shippingMethod,
            promoCode: appliedPromo?.code || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to place COD order');

        clearCart();
        router.push(`/checkout/success?order_id=${data.orderId}`);
        return;
      }

      // Handle Official Razorpay Checkout
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Unable to load Razorpay SDK. Please check your internet connection.');
      }

      const res = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingAddress: formData,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingMethod,
          promoCode: appliedPromo?.code || null,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      // Configure official Razorpay Standard Checkout Options
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || "INR",
        name: "BAGIFYYYY",
        description: `Order #${orderData.orderNumber}`,
        image: "https://i.ibb.co/vzrBsmS/logo.png",
        order_id: orderData.razorpayOrderId,
        handler: function (response: any) {
          handlePaymentSuccess(orderData.orderId, response);
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: `${formData.street}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        },
        theme: {
          color: "#232D3B",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        alert(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-y2k-ice flex flex-col items-center justify-center pt-20 px-4 text-y2k-gunmetal">
        <h1 className="font-display text-4xl uppercase tracking-tighter mb-4">Your Bag is Empty</h1>
        <p className="text-sm text-y2k-gunmetal/70 mb-8">Discover our latest streetwear archive and top drops.</p>
        <Link href="/products" className="btn-bagify px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity">
          SHOP THE DROP →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans pt-12 pb-24">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Top Title */}
        <div className="mb-8 border-b border-y2k-gunmetal/15 pb-4 flex items-center justify-between">
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight">SECURE CHECKOUT</h1>
          <div className="flex items-center gap-2 text-xs font-bold text-green-700">
            <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted (Razorpay)
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
          
          {/* Left Column: Form Stepper */}
          {checkoutMode === 'select' ? (
            <div className="flex flex-col items-center pt-8 bg-white border border-y2k-gunmetal/15 p-8 sm:p-12">
              <div className="max-w-lg mx-auto w-full text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-8">HOW WOULD YOU LIKE TO CONTINUE?</h2>
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {/* Option 1: Guest */}
                  <div className="flex-1 flex flex-col items-center p-6 border border-y2k-gunmetal/20 hover:border-y2k-gunmetal transition-colors">
                    <ArrowRight className="w-5 h-5 mb-4 text-y2k-gunmetal" />
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-2">GUEST CHECKOUT</h3>
                    <p className="text-[11px] text-y2k-gunmetal/60 mb-6 h-8">Fast checkout with email & phone.</p>
                    <button 
                      onClick={() => setCheckoutMode('guest')}
                      className="w-full btn-bagify text-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                    >
                      CONTINUE →
                    </button>
                  </div>
                  {/* Option 2: Sign In */}
                  <div className="flex-1 flex flex-col items-center p-6 border border-y2k-gunmetal/20 hover:border-y2k-gunmetal transition-colors">
                    <User className="w-5 h-5 mb-4 text-y2k-gunmetal" />
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-2">GOOGLE / SIGN IN</h3>
                    <p className="text-[11px] text-y2k-gunmetal/60 mb-6 h-8">Earn Chrome Points & auto-fill details.</p>
                    <Link 
                      href="/login?from=/checkout"
                      className="w-full border border-y2k-gunmetal text-y2k-gunmetal px-4 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-y2k-gunmetal hover:text-white transition-colors text-center inline-block"
                    >
                      SIGN IN →
                    </Link>
                  </div>
                </div>
                <p className="text-[10px] text-y2k-gunmetal/60 uppercase tracking-wider">🔒 All transactions are secured via Razorpay India.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setCheckoutMode('select')} className="text-xs font-bold text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors">
                  ← Change checkout mode
                </button>
                {user && (
                  <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                    Logged in as <b>{user.email}</b>
                  </span>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              {/* Step 1: Shipping & Delivery Address */}
              <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-xs font-bold">01</span>
                    <h2 className="font-display text-xl uppercase tracking-tight">Delivery Address</h2>
                  </div>
                  {activeStep > 1 && (
                    <button onClick={() => setActiveStep(1)} className="text-xs font-bold text-blue-600 hover:underline">
                      Edit
                    </button>
                  )}
                </div>

                {activeStep === 1 ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">Phone Number (+91) *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="9876543210"
                          className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">Email Address (for Receipt & Tracking) *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@email.com"
                        className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">House / Flat / Street Address *</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="Flat 402, Lotus Heights, MG Road"
                        className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">PIN Code *</label>
                        <input
                          type="text"
                          name="pincode"
                          maxLength={6}
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="400001"
                          className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Mumbai"
                          className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 mb-1 block">State *</label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full border border-y2k-gunmetal/25 px-4 py-3 text-sm focus:border-y2k-gunmetal outline-none bg-white"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.fullName || !formData.phone || !formData.street || !formData.pincode || !formData.city) {
                            setError("Please complete all address fields.");
                            return;
                          }
                          setError("");
                          setActiveStep(2);
                        }}
                        className="btn-bagify text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                      >
                        CONTINUE TO SHIPPING ›
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-y2k-gunmetal/80">
                    <p className="font-bold">{formData.fullName} ({formData.phone})</p>
                    <p>{formData.street}, {formData.city}, {formData.state} - {formData.pincode}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Shipping Method */}
              <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-xs font-bold">02</span>
                    <h2 className="font-display text-xl uppercase tracking-tight">Shipping Method</h2>
                  </div>
                  {activeStep > 2 && (
                    <button onClick={() => setActiveStep(2)} className="text-xs font-bold text-blue-600 hover:underline">
                      Edit
                    </button>
                  )}
                </div>

                {activeStep === 2 ? (
                  <div className="flex flex-col gap-4">
                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/20'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'standard'}
                          onChange={() => setShippingMethod('standard')}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Truck className="w-4 h-4" /> India Post Standard Speed Delivery
                          </p>
                          <p className="text-[11px] text-y2k-gunmetal/60">Estimated 4-6 business days</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase">{total >= 299 ? 'FREE' : '₹49'}</span>
                    </label>

                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${shippingMethod === 'express' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/20'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'express'}
                          onChange={() => setShippingMethod('express')}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-600" /> India Post Air Express (Priority)
                          </p>
                          <p className="text-[11px] text-y2k-gunmetal/60">Estimated 2-3 business days</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase">₹99</span>
                    </label>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="btn-bagify text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                      >
                        CONTINUE TO PAYMENT ›
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-y2k-gunmetal/80">
                    <p className="font-bold uppercase">
                      {shippingMethod === 'express' ? 'India Post Air Express (₹99)' : 'India Post Standard Delivery (Free / ₹49)'}
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-6 h-6 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-xs font-bold">03</span>
                  <h2 className="font-display text-xl uppercase tracking-tight">Payment Method</h2>
                </div>

                {activeStep === 3 && (
                  <div className="flex flex-col gap-4">
                    {/* Option A: Razorpay */}
                    <label className={`flex items-start justify-between p-4 border cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/20'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                          className="accent-black mt-1"
                        />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600" /> UPI / Cards / NetBanking (Official Razorpay Gateway)
                          </p>
                          <p className="text-[11px] text-y2k-gunmetal/60 mt-1">
                            Secure payment with Google Pay, PhonePe, Paytm, RuPay cards, and NetBanking.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/20 px-2 py-0.5 rounded-xs font-bold">UPI</span>
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/20 px-2 py-0.5 rounded-xs font-bold">GPAY</span>
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/20 px-2 py-0.5 rounded-xs font-bold">PHONEPE</span>
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/20 px-2 py-0.5 rounded-xs font-bold">CARDS</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Option B: Cash on Delivery */}
                    <label className={`flex items-start justify-between p-4 border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/20'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-black mt-1"
                        />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-green-700" /> Cash on Delivery (COD)
                          </p>
                          <p className="text-[11px] text-y2k-gunmetal/60 mt-1">
                            Pay in cash upon doorstep delivery (+₹49 handling fee).
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase">+₹49</span>
                    </label>

                    <div className="mt-8 pt-6 border-t border-y2k-gunmetal/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-y2k-gunmetal/70">
                        Total Payable: <b className="text-base text-y2k-gunmetal">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                      </p>
                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        disabled={loading}
                        className="w-full sm:w-auto btn-bagify text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'OPENING RAZORPAY…' : paymentMethod === 'cod' ? 'PLACE COD ORDER →' : 'PAY WITH RAZORPAY →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Right Column: Order Summary */}
          <div className="flex flex-col sticky top-24 h-fit bg-white border border-y2k-gunmetal/15 p-6 sm:p-8">
            <h3 className="font-display text-xl uppercase tracking-tight mb-6 pb-4 border-b border-y2k-gunmetal/15">
              ORDER SUMMARY ({items.length})
            </h3>
            
            <div className="flex flex-col gap-5 mb-8 max-h-[380px] overflow-y-auto pr-1">
              {items.map(item => {
                const key = getItemKey(item);
                return (
                  <div key={key} className="flex gap-4 group border-b border-y2k-gunmetal/10 pb-4 last:border-b-0">
                    <div className="relative w-[64px] h-[78px] bg-gray-100 shrink-0">
                      <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">{item.name}</h4>
                        <p className="text-[10px] text-y2k-gunmetal/60 uppercase tracking-widest mt-0.5">
                          {item.color} | Size: {item.size}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <button onClick={() => updateQuantity(key, Math.max(1, item.quantity - 1))} className="w-5 h-5 border border-y2k-gunmetal/20 flex items-center justify-center hover:bg-gray-100">-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(key, item.quantity + 1)} className="w-5 h-5 border border-y2k-gunmetal/20 flex items-center justify-center hover:bg-gray-100">+</button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(key)} className="text-y2k-gunmetal/40 hover:text-red-600 text-xs">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code */}
            <div className="border-t border-y2k-gunmetal/10 pt-4 pb-2">
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {appliedPromo.code} — {(appliedPromo.discount * 100).toFixed(0)}% OFF
                  </span>
                  <button
                    onClick={() => { setAppliedPromo(null); setPromoInput(""); }}
                    className="text-[10px] font-bold text-green-700 hover:text-red-600 underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border border-y2k-gunmetal/20 px-3 py-2">
                    <Tag className="w-3.5 h-3.5 text-y2k-gunmetal/40 shrink-0" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Promo code"
                      className="w-full text-xs font-medium uppercase outline-none bg-transparent tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-y2k-gunmetal/40"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="px-3 py-2 bg-y2k-gunmetal text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1.5">{promoError}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col gap-2.5 text-xs border-t border-y2k-gunmetal/15 pt-4">
              <div className="flex justify-between items-center text-y2k-gunmetal/70">
                <span>Items Subtotal:</span>
                <span className="font-semibold">₹{total.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-bold">
                  <span>Promo ({appliedPromo!.code}):</span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-y2k-gunmetal/70">
                <span>Shipping ({shippingMethod === 'express' ? 'Express' : 'Standard'}):</span>
                <span className="font-semibold">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between items-center text-y2k-gunmetal/70">
                  <span>COD Handling:</span>
                  <span className="font-semibold">₹{codFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-sm border-t border-y2k-gunmetal/15 pt-3 mt-1 text-y2k-gunmetal">
                <span>Total Amount:</span>
                <span>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <p className="text-[10px] text-y2k-gunmetal/60 text-center mt-6">
              ✦ +{Math.floor(finalTotal / 10)} Chrome Points will be earned with this order!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-y2k-ice flex items-center justify-center text-xs font-bold uppercase tracking-widest text-y2k-gunmetal">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
