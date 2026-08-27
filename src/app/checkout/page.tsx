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

type AddressForm = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
};

/** The order the fields appear in, so focus lands on the first bad one. */
const FIELD_ORDER = ["fullName", "phone", "email", "street", "pincode", "city"] as const;

/**
 * Mirrors assertValidShippingAddress and assertValidContact in src/lib/cart.ts.
 * The shopper is told which field is wrong before the request is sent, instead
 * of getting one generic sentence back from the server with no field named.
 */
function validateAddress(data: AddressForm): Partial<Record<keyof AddressForm, string>> {
  const errors: Partial<Record<keyof AddressForm, string>> = {};

  if (!data.fullName.trim()) errors.fullName = "Enter the name for this delivery.";

  const phone = data.phone.trim();
  if (!phone) errors.phone = "Enter a number the courier can call.";
  else if (!/^[+\d][\d\s-]{7,15}$/.test(phone)) errors.phone = "That does not look like a valid phone number.";

  const email = data.email.trim();
  if (!email) errors.email = "Enter an email so we can send the receipt.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That does not look like a valid email address.";

  if (!data.street.trim()) errors.street = "Enter the house, flat and street.";

  const pincode = data.pincode.trim();
  if (!pincode) errors.pincode = "Enter your 6-digit PIN code.";
  else if (!/^\d{6}$/.test(pincode)) errors.pincode = "A PIN code is exactly 6 digits.";

  if (!data.city.trim()) errors.city = "Enter the city.";

  return errors;
}

const fieldClass = (hasError: boolean) =>
  `w-full border px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? "border-red-500 focus:border-red-600"
      : "border-y2k-gunmetal/25 focus:border-y2k-gunmetal"
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[11px] text-red-600 mt-1.5">
      {message}
    </p>
  );
}

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
  const { items, cartSubtotal, bundleDiscount, cartTotal, promoCode, promoDiscount, promoAmount, applyPromo, clearPromo, updateQuantity, removeItem, clearCart } = useCartStore();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const searchParams = useSearchParams();
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'guest' | 'account'>(isAuthenticated ? 'account' : 'select');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Promo code — single source in useCartStore
  const [promoInput, setPromoInput] = useState(promoCode || "");
  const appliedPromo = promoCode ? { code: promoCode, discount: promoDiscount } : null;
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = () => {
    const res = applyPromo(promoInput);
    if (res.ok) setPromoError("");
    else setPromoError(res.error || "Invalid promo code.");
  };

  // Address Form State
  const [formData, setFormData] = useState<AddressForm>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  // Shipping & Payment Options
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  // Auto-apply promo from cart URL param (back-compat) or store
  useEffect(() => {
    const promoFromCart = searchParams.get("promo");
    if (promoFromCart) {
      const res = applyPromo(promoFromCart);
      if (res.ok) setPromoInput(promoFromCart.toUpperCase());
    } else if (promoCode) {
      setPromoInput(promoCode);
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

  // Mirrors priceCart() in src/lib/cart.ts exactly: set discounts come off
  // first, then the promo code applies to what's left, and free shipping is
  // judged on that same post-discount figure. The server re-derives all of it.
  const subtotal = cartSubtotal();
  const setDiscount = bundleDiscount();
  const total = cartTotal();
  const shipping = shippingMethod === 'express' ? 99 : (total >= 2000 ? 0 : 49);
  // COD fee is handled server-side via includeCodFee, show upfront to avoid surprise
  const codFee = paymentMethod === 'cod' ? 49 : 0;
  const discountAmount = promoAmount();
  const finalTotal = total - discountAmount + shipping + codFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field's complaint as soon as the shopper starts fixing it.
    setFieldErrors((prev) => (prev[name as keyof AddressForm] ? { ...prev, [name]: undefined } : prev));
  };

  /** Puts the caret on the first field that failed, so nothing is hunted for. */
  const focusFirstError = (errors: Partial<Record<keyof AddressForm, string>>) => {
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) document.getElementById(`checkout-${first}`)?.focus();
  };

  const handleAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateAddress(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("");
      focusFirstError(errors);
      return;
    }
    setError("");
    setActiveStep(2);
  };

  const handlePaymentSuccess = async (orderId: string, response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    try {
      setLoading(true);
      setError("");
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
      if (verifyRes.ok && verifyData.success) {
        clearCart();
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        const msg = verifyData.error || 'Payment verification failed. Please contact support.';
        setError(msg);
        alert(msg);
      }
    } catch (err: any) {
      console.error('Verify error:', err);
      const msg = err.message || 'Payment verification failed';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    setError("");

    // Same validator the address step uses, so a shopper who edited a field
    // after passing step 1 is sent back to the exact field that broke.
    const errors = validateAddress(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setActiveStep(1);
      setError("Some delivery details need fixing before we can take payment.");
      requestAnimationFrame(() => focusFirstError(errors));
      return;
    }
    setFieldErrors({});

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

      // Handle Official Razorpay Standard Web Checkout
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

      const razorpayKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay Key is not configured.');
      }

      // Configure official Razorpay Standard Checkout Options
      const options = {
        key: razorpayKey,
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
        const failureReason = resp.error?.description || resp.error?.reason || 'Payment failed';
        setError(`Payment failed: ${failureReason}`);
        alert(`Payment failed: ${failureReason}`);
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
        <Link href="/products" className="btn-bagify px-8 py-4 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity">
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
          <div className="flex items-center gap-2 text-xs font-bold text-y2k-gunmetal/80">
            <ShieldCheck className="w-4 h-4 text-y2k-gunmetal" /> 256-Bit Encrypted (Razorpay)
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
          
          {/* Left Column: Form Stepper */}
          {checkoutMode === 'select' ? (
            <div className="flex flex-col items-center pt-8 bg-white border border-y2k-gunmetal/15 p-8 sm:p-12">
              <div className="max-w-lg mx-auto w-full text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-8">HOW WOULD YOU LIKE TO CONTINUE?</h2>
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {/* Option 1: Guest */}
                  <div className="flex-1 flex flex-col items-center p-6 border border-y2k-gunmetal/10 hover:border-y2k-gunmetal transition-colors">
                    <ArrowRight className="w-5 h-5 mb-4 text-y2k-gunmetal" />
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2">GUEST CHECKOUT</h3>
                    <p className="text-[11px] text-y2k-gunmetal/60 mb-6 h-8">Fast checkout with email & phone.</p>
                    <button 
                      onClick={() => setCheckoutMode('guest')}
                      className="w-full btn-bagify text-white px-4 py-3.5 text-xs font-bold uppercase tracking-wider hover:opacity-90"
                    >
                      CONTINUE →
                    </button>
                  </div>
                  {/* Option 2: Sign In */}
                  <div className="flex-1 flex flex-col items-center p-6 border border-y2k-gunmetal/10 hover:border-y2k-gunmetal transition-colors">
                    <User className="w-5 h-5 mb-4 text-y2k-gunmetal" />
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2">GOOGLE / SIGN IN</h3>
                    <p className="text-[11px] text-y2k-gunmetal/60 mb-6 h-8">Earn Chrome Points & auto-fill details.</p>
                    <Link 
                      href="/login?from=/checkout"
                      className="w-full border border-y2k-gunmetal text-y2k-gunmetal px-4 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-y2k-gunmetal hover:text-white transition-colors text-center inline-block"
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
                  /* A real form, so Enter submits, the browser runs its own
                     required and pattern checks, and address autofill
                     recognises the fields. These inputs used to sit in a bare
                     div, which made every required and pattern attribute on
                     them inert. */
                  <form onSubmit={handleAddressSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkout-fullName" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">Full Name *</label>
                        <input
                          id="checkout-fullName"
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. Rahul Sharma"
                          autoComplete="name"
                          required
                          aria-invalid={Boolean(fieldErrors.fullName)}
                          aria-describedby={fieldErrors.fullName ? "checkout-fullName-error" : undefined}
                          className={fieldClass(Boolean(fieldErrors.fullName))}
                        />
                        <FieldError id="checkout-fullName-error" message={fieldErrors.fullName} />
                      </div>
                      <div>
                        <label htmlFor="checkout-phone" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">Phone Number (+91) *</label>
                        <input
                          id="checkout-phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="9876543210"
                          autoComplete="tel"
                          inputMode="tel"
                          pattern="[+\d][\d\s-]{7,15}"
                          title="8 to 16 digits, optionally starting with a plus"
                          required
                          aria-invalid={Boolean(fieldErrors.phone)}
                          aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                          className={fieldClass(Boolean(fieldErrors.phone))}
                        />
                        <FieldError id="checkout-phone-error" message={fieldErrors.phone} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-email" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">Email Address (for Receipt &amp; Tracking) *</label>
                      <input
                        id="checkout-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@email.com"
                        autoComplete="email"
                        inputMode="email"
                        required
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                        className={fieldClass(Boolean(fieldErrors.email))}
                      />
                      <FieldError id="checkout-email-error" message={fieldErrors.email} />
                    </div>

                    <div>
                      <label htmlFor="checkout-street" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">House / Flat / Street Address *</label>
                      <input
                        id="checkout-street"
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="Flat 402, Lotus Heights, MG Road"
                        autoComplete="street-address"
                        required
                        aria-invalid={Boolean(fieldErrors.street)}
                        aria-describedby={fieldErrors.street ? "checkout-street-error" : undefined}
                        className={fieldClass(Boolean(fieldErrors.street))}
                      />
                      <FieldError id="checkout-street-error" message={fieldErrors.street} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="checkout-pincode" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">PIN Code *</label>
                        <input
                          id="checkout-pincode"
                          type="text"
                          name="pincode"
                          maxLength={6}
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="400001"
                          autoComplete="postal-code"
                          inputMode="numeric"
                          pattern="\d{6}"
                          title="Exactly 6 digits"
                          required
                          aria-invalid={Boolean(fieldErrors.pincode)}
                          aria-describedby={fieldErrors.pincode ? "checkout-pincode-error" : undefined}
                          className={fieldClass(Boolean(fieldErrors.pincode))}
                        />
                        <FieldError id="checkout-pincode-error" message={fieldErrors.pincode} />
                      </div>
                      <div>
                        <label htmlFor="checkout-city" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">City *</label>
                        <input
                          id="checkout-city"
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Mumbai"
                          autoComplete="address-level2"
                          required
                          aria-invalid={Boolean(fieldErrors.city)}
                          aria-describedby={fieldErrors.city ? "checkout-city-error" : undefined}
                          className={fieldClass(Boolean(fieldErrors.city))}
                        />
                        <FieldError id="checkout-city-error" message={fieldErrors.city} />
                      </div>
                      <div>
                        <label htmlFor="checkout-state" className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">State *</label>
                        <select
                          id="checkout-state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          autoComplete="address-level1"
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
                        type="submit"
                        className="btn-bagify text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90"
                      >
                        CONTINUE TO SHIPPING &rsaquo;
                      </button>
                    </div>
                  </form>
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
                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/10'}`}>
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
                      <span className="text-xs font-bold uppercase">{total >= 2000 ? 'FREE' : '₹49'}</span>
                    </label>

                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${shippingMethod === 'express' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/10'}`}>
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
                        className="btn-bagify text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90"
                      >
                        CONTINUE TO PAYMENT ›
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="font-bold text-xs text-y2k-gunmetal/80">
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
                    <label className={`flex items-start justify-between p-4 border cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/10'}`}>
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
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/10 px-2 py-0.5 rounded-xs font-bold">UPI</span>
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/10 px-2 py-0.5 rounded-xs font-bold">GPAY</span>
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/10 px-2 py-0.5 rounded-xs font-bold">PHONEPE</span>
                            <span className="text-[9px] bg-white border border-y2k-gunmetal/10 px-2 py-0.5 rounded-xs font-bold">CARDS</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Option B: Cash on Delivery */}
                    <label className={`flex items-start justify-between p-4 border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-y2k-gunmetal bg-y2k-ice/40' : 'border-y2k-gunmetal/10'}`}>
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
                          <p className="font-bold text-[11px] text-y2k-gunmetal/60 mt-1">
                            Pay in cash upon doorstep delivery (+₹49 handling fee).
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase">+₹49</span>
                    </label>

                    <div className="mt-8 pt-6 border-t border-y2k-gunmetal/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-y2k-gunmetal/70">
                        Total Payable: <b className="font-bold text-base text-y2k-gunmetal">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                      </p>
                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        disabled={loading}
                        className="w-full sm:w-auto btn-bagify text-white px-10 py-4 text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
                        <p className="text-[10px] text-y2k-gunmetal/60 uppercase tracking-wider mt-0.5">
                          {item.color} | Size: {item.size}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <button aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => updateQuantity(key, Math.max(1, item.quantity - 1))} className="w-5 h-5 border border-y2k-gunmetal/10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">-</button>
                          <span aria-live="polite">{item.quantity}{item.quantity >= 10 ? " (max)" : ""}</span>
                          <button aria-label="Increase quantity" disabled={item.quantity >= 10} onClick={() => updateQuantity(key, item.quantity + 1)} className="w-5 h-5 border border-y2k-gunmetal/10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
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
                <div className="flex items-center justify-between bg-y2k-ice border border-y2k-gunmetal/10 px-3 py-2">
                  <span className="text-[10px] font-bold text-y2k-gunmetal uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {appliedPromo.code} — {(appliedPromo.discount * 100).toFixed(0)}% OFF
                  </span>
                  <button
                    onClick={() => { clearPromo(); setPromoInput(""); }}
                    className="text-[10px] font-bold text-y2k-slate hover:text-black underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border border-y2k-gunmetal/10 px-3 py-2">
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
                    className="px-3 py-2 bg-y2k-gunmetal text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
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
                <span className="font-bold font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {setDiscount > 0 && (
                <div className="flex justify-between items-center text-y2k-gunmetal font-bold">
                  <span>Curated Set Discount:</span>
                  <span>−₹{setDiscount.toFixed(2)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-y2k-gunmetal font-bold">
                  <span>Promo ({appliedPromo!.code}):</span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-y2k-gunmetal/70">
                <span>Shipping ({shippingMethod === 'express' ? 'Express' : 'Standard'}):</span>
                <span className="font-bold font-semibold">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between items-center text-y2k-gunmetal/70">
                  <span>COD Handling:</span>
                  <span className="font-bold font-semibold">₹{codFee.toFixed(2)}</span>
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
        <div className="min-h-screen bg-y2k-ice flex items-center justify-center text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
