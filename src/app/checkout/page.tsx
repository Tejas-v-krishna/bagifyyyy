"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useCartStore, getItemKey, VALID_PROMOS } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, ArrowRight, ArrowLeft, User, ShieldCheck, Truck, CreditCard, Banknote, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
  open: () => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

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
  `w-full border px-4 py-3 text-sm outline-none transition-colors rounded-sm ${
    hasError
      ? "border-red-500 focus:border-red-600 bg-red-50/20"
      : "border-black/15 focus:border-black bg-white"
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
  const { user, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const promoFromCart = searchParams.get("promo");
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'guest' | 'account'>(isAuthenticated ? 'account' : 'select');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentState, setPaymentState] = useState<'idle' | 'initiating' | 'verifying' | 'failed'>('idle');
  const [failureDetails, setFailureDetails] = useState<{ title: string; message: string } | null>(null);
  const paymentCompletedRef = useRef(false);
  const checkoutIdsRef = useRef<{ razorpay: string | null; cod: string | null }>({ razorpay: null, cod: null });

  const getCheckoutIdFor = (method: 'razorpay' | 'cod'): string => {
    const storageKey = `bagify-checkout-${method}`;
    const existing = checkoutIdsRef.current[method];
    if (existing) return existing;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored && /^[A-Za-z0-9_-]{16,100}$/.test(stored)) {
        checkoutIdsRef.current[method] = stored;
        return stored;
      }
    } catch {}
    const fresh = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    checkoutIdsRef.current[method] = fresh;
    try {
      window.sessionStorage.setItem(storageKey, fresh);
    } catch {}
    return fresh;
  };

  const rotateCheckoutId = (method: 'razorpay' | 'cod') => {
    checkoutIdsRef.current[method] = null;
    try {
      window.sessionStorage.removeItem(`bagify-checkout-${method}`);
    } catch {}
  };

  // Promo code — single source in useCartStore
  const [promoInput, setPromoInput] = useState<string | null>(null);
  const promoFromUrl = promoFromCart?.trim().toUpperCase();
  const promoInputValue = promoInput ?? (
    promoFromUrl && VALID_PROMOS[promoFromUrl] !== undefined
      ? promoFromUrl
      : promoCode || ""
  );
  const appliedPromo = promoCode ? { code: promoCode, discount: promoDiscount } : null;
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = () => {
    const res = applyPromo(promoInputValue);
    if (res.ok) {
      setPromoInput(promoInputValue.trim().toUpperCase());
      setPromoError("");
    }
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
    if (promoFromCart) {
      applyPromo(promoFromCart);
    }
  }, [applyPromo, promoFromCart]);

  // Load user details & saved addresses if authenticated
  useEffect(() => {
    if (user) {
      let cancelled = false;

      queueMicrotask(() => {
        if (cancelled) return;
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || user.name || "",
          email: prev.email || user.email || "",
        }));
        setCheckoutMode('account');
      });

      fetch('/api/account/addresses')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data?.addresses?.length > 0) {
            const latest = data.addresses[0];
            setFormData((prev) => ({
              ...prev,
              fullName: prev.fullName || latest.fullName || "",
              phone: prev.phone || latest.phone || "",
              street: prev.street || latest.street || "",
              city: prev.city || latest.city || "",
              state: prev.state || latest.state || "Maharashtra",
              pincode: prev.pincode || latest.pincode || "",
            }));
          }
        })
        .catch(() => {});

      return () => {
        cancelled = true;
      };
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

  const handlePaymentSuccess = async (orderId: string, response: RazorpayPaymentResponse) => {
    try {
      setLoading(true);
      setPaymentState('verifying');
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
        rotateCheckoutId('razorpay');
        clearCart();
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        const msg = verifyData.error || 'Payment verification failed. Please contact support.';
        setError(msg);
        setPaymentState('failed');
        setFailureDetails({
          title: 'Verification Failed',
          message: msg,
        });
      }
    } catch (err: unknown) {
      console.error('Verify error:', err);
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      setError(msg);
      setPaymentState('failed');
      setFailureDetails({
        title: 'Verification Error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    setError("");
    setFailureDetails(null);
    paymentCompletedRef.current = false;

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
        setPaymentState('initiating');
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
            checkoutId: getCheckoutIdFor('cod'),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to place COD order');
        }

        rotateCheckoutId('cod');
        clearCart();
        router.push(`/checkout/success?order_id=${data.orderId}`);
        return;
      }

      // Handle Official Razorpay Standard Web Checkout
      setPaymentState('initiating');
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
          checkoutId: getCheckoutIdFor('razorpay'),
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

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
        image: `${window.location.origin}/bagifyyyy-wordmark-black.png`,
        order_id: orderData.razorpayOrderId,
        handler: function (response: RazorpayPaymentResponse) {
          paymentCompletedRef.current = true;
          setPaymentState('verifying');
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
          color: "#050505",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (!paymentCompletedRef.current) {
              setPaymentState('failed');
              setFailureDetails({
                title: 'Payment Incomplete',
                message: 'The Razorpay payment window was closed before completing the transaction. No amount was debited, and your cart items remain saved.',
              });
            }
          },
        },
      };

      const rzp = new (window.Razorpay as unknown as RazorpayConstructor)(options);
      rzp.on('payment.failed', function (resp: RazorpayFailureResponse) {
        paymentCompletedRef.current = false;
        const failureReason = resp.error?.description || resp.error?.reason || 'Payment failed';
        setError(`Payment failed: ${failureReason}`);
        setPaymentState('failed');
        setFailureDetails({
          title: 'Payment Failed',
          message: `${failureReason}. Please check your payment details or try an alternative payment method.`,
        });
        setLoading(false);
      });
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setError(msg);
      setPaymentState('failed');
      setFailureDetails({
        title: 'Checkout Error',
        message: msg,
      });
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] bg-[#f5f5f2] flex flex-col items-center justify-center pt-20 px-4 text-black font-sans">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/45 mb-2">
          SHOPPING BAG // STATUS
        </p>
        <h1 className="font-sans text-3xl sm:text-4xl font-medium uppercase leading-tight tracking-[-0.05em] mb-3 text-black">
          Your Bag is Empty
        </h1>
        <p className="text-xs text-black/60 mb-8 max-w-sm text-center leading-relaxed">
           Browse the latest pieces, vintage finds, and small-run streetwear.
        </p>
        <Link
          href="/products"
          className="bg-black text-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors shadow-xs"
        >
          Shop The Drop →
        </Link>
      </div>
    );
  }

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] text-black font-sans px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <div className="max-w-[1300px] mx-auto">

        {/* Top Navigation Bar */}
        <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-3">
          <Link
            href="/"
            className="editorial-back inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black/35">
            BAGIFYYYY / ARCHIVE
          </span>
        </div>
        
        {/* Header */}
        <div className="mb-8 border-b border-black/10 pb-6 sm:mb-12 sm:pb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">
              CHECKOUT // FINAL STEP
            </p>
            <h1 className="font-microgramma text-[clamp(1.9rem,4.5vw,4.2rem)] font-bold uppercase leading-[0.88] tracking-tight text-black">
              Secure Checkout
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60">
            <ShieldCheck className="w-4 h-4 text-black" /> 256-Bit Encrypted (Razorpay)
          </div>
        </div>

        {/* Fullscreen Processing Overlay */}
        {(paymentState === 'initiating' || paymentState === 'verifying') && (
          <div className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl border border-black/15 bg-[#f5f5f2] p-8 sm:p-10 text-center shadow-[0_24px_55px_rgba(0,0,0,0.18)]">
              <div className="w-14 h-14 rounded-full border border-black/15 bg-white flex items-center justify-center mx-auto mb-5 text-black shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin text-black" aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/45 mb-2">
                {paymentState === 'initiating' ? "03 // RAZORPAY GATEWAY" : "03 // PAYMENT VERIFICATION"}
              </p>
              <h2 className="font-microgramma text-xl sm:text-2xl font-bold uppercase leading-tight tracking-tight text-black mb-3">
                 {paymentState === 'initiating' ? "Opening payment…" : "Processing payment…"}
              </h2>
              <p className="text-xs leading-relaxed text-black/60 mb-5 max-w-sm mx-auto">
                {paymentState === 'initiating'
                  ? "Opening encrypted 256-bit payment window. Please do not close or refresh this tab."
                   : "Checking your payment and preparing your receipt. Please wait."}
              </p>
              <div className="h-0.5 w-full bg-black/10 overflow-hidden rounded-full mt-4">
                <div className="h-full bg-black animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Failure Modal */}
        {paymentState === 'failed' && (
          <div className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl border border-black/15 bg-[#f5f5f2] p-8 sm:p-10 text-center shadow-[0_24px_55px_rgba(0,0,0,0.18)]">
              <div className="w-14 h-14 rounded-full border border-black/15 bg-white flex items-center justify-center mx-auto mb-5 text-black shadow-xs">
                <AlertCircle className="w-6 h-6 text-black" aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/45 mb-2">
                TRANSACTION STATUS // NOTICE
              </p>
              <h2 className="font-microgramma text-xl sm:text-2xl font-bold uppercase leading-tight tracking-tight text-black mb-3">
                {failureDetails?.title || "Payment Incomplete"}
              </h2>
              <p className="text-xs leading-relaxed text-black/60 mb-6 max-w-sm mx-auto">
                {failureDetails?.message || "Your transaction was not completed. No amount was debited, and your cart pieces remain safely saved."}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentState('idle');
                    setFailureDetails(null);
                    setLoading(false);
                  }}
                  className="w-full bg-black text-white px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer shadow-xs"
                >
                  Try Again / Back to Checkout →
                </button>
                <Link
                  href="/"
                  className="w-full border border-black/15 bg-white text-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] hover:border-black hover:bg-black/[0.02] transition-colors text-center cursor-pointer"
                >
                  Return to Home Screen
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
          
          {/* Left Column: Form Stepper */}
          {checkoutMode === 'select' ? (
            <div className="flex flex-col items-center pt-8 bg-white border border-black/10 rounded-2xl p-8 sm:p-12 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="max-w-lg mx-auto w-full text-center">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] mb-8 text-black">
                  HOW WOULD YOU LIKE TO CONTINUE?
                </h2>
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {/* Option 1: Guest */}
                  <div className="flex-1 flex flex-col items-center p-6 border border-black/10 rounded-xl hover:border-black transition-colors">
                    <ArrowRight className="w-5 h-5 mb-4 text-black" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] mb-2 text-black">
                      GUEST CHECKOUT
                    </h3>
                    <p className="text-[11px] text-black/60 mb-6 h-8">Fast checkout with email &amp; phone.</p>
                    <button 
                      onClick={() => setCheckoutMode('guest')}
                      className="w-full bg-black text-white px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer"
                    >
                      CONTINUE →
                    </button>
                  </div>
                  {/* Option 2: Sign In */}
                  <div className="flex-1 flex flex-col items-center p-6 border border-black/10 rounded-xl hover:border-black transition-colors">
                    <User className="w-5 h-5 mb-4 text-black" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] mb-2 text-black">
                      GOOGLE / SIGN IN
                    </h3>
                      <p className="text-[11px] text-black/60 mb-6 h-8">Save your details and earn points.</p>
                    <Link 
                      href="/login?from=/checkout"
                      className="w-full border border-black/15 text-black px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:border-black hover:bg-black/[0.02] transition-colors text-center inline-block cursor-pointer"
                    >
                      SIGN IN →
                    </Link>
                  </div>
                </div>
                <p className="text-[10px] text-black/45 uppercase tracking-wider">🔒 All transactions are secured via Razorpay India.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('select')}
                  className="text-xs font-semibold text-black/60 hover:text-black transition-colors cursor-pointer"
                >
                  ← Change checkout mode
                </button>
                {user && (
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                    Logged in as <b>{user.email}</b>
                  </span>
                )}
              </div>

              {error && (
                <div role="alert" className="border border-black/15 bg-white p-4 text-xs font-semibold uppercase tracking-[0.12em] text-black flex items-center gap-2 rounded-lg shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-black shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Shipping & Delivery Address */}
              <div className="bg-white border border-black/10 rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/10">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">01</span>
                    <h2 className="font-sans font-medium text-lg sm:text-xl uppercase tracking-tight text-black">Delivery Address</h2>
                  </div>
                  {activeStep > 1 && (
                    <button type="button" onClick={() => setActiveStep(1)} className="text-xs font-semibold text-black/50 hover:text-black hover:underline cursor-pointer">
                      Edit
                    </button>
                  )}
                </div>

                {activeStep === 1 ? (
                  <form onSubmit={handleAddressSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkout-fullName" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">Full Name *</label>
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
                        <label htmlFor="checkout-phone" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">Phone Number (+91) *</label>
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
                      <label htmlFor="checkout-email" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">Email Address (for Receipt &amp; Tracking) *</label>
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
                      <label htmlFor="checkout-street" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">House / Flat / Street Address *</label>
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
                        <label htmlFor="checkout-pincode" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">PIN Code *</label>
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
                        <label htmlFor="checkout-city" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">City *</label>
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
                        <label htmlFor="checkout-state" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">State *</label>
                        <select
                          id="checkout-state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          autoComplete="address-level1"
                          className="w-full border border-black/15 px-4 py-3 text-sm focus:border-black outline-none bg-white text-black rounded-sm"
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
                        className="bg-black text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer shadow-xs"
                      >
                        CONTINUE TO SHIPPING ›
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-xs text-black/80 leading-relaxed">
                    <p className="font-semibold text-black">{formData.fullName} ({formData.phone})</p>
                    <p>{formData.street}, {formData.city}, {formData.state} - {formData.pincode}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Shipping Method */}
              <div className="bg-white border border-black/10 rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/10">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">02</span>
                    <h2 className="font-sans font-medium text-lg sm:text-xl uppercase tracking-tight text-black">Shipping Method</h2>
                  </div>
                  {activeStep > 2 && (
                    <button type="button" onClick={() => setActiveStep(2)} className="text-xs font-semibold text-black/50 hover:text-black hover:underline cursor-pointer">
                      Edit
                    </button>
                  )}
                </div>

                {activeStep === 2 ? (
                  <div className="flex flex-col gap-4">
                    <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-black bg-black/[0.02] shadow-xs' : 'border-black/10 hover:border-black/30'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'standard'}
                          onChange={() => setShippingMethod('standard')}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-2 text-black">
                            <Truck className="w-4 h-4" /> India Post Standard Speed Delivery
                          </p>
                          <p className="text-[11px] text-black/60 mt-0.5">Estimated 4-6 business days</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase text-black">{total >= 2000 ? 'FREE' : '₹49'}</span>
                    </label>

                    <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${shippingMethod === 'express' ? 'border-black bg-black/[0.02] shadow-xs' : 'border-black/10 hover:border-black/30'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'express'}
                          onChange={() => setShippingMethod('express')}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-2 text-black">
                            <Truck className="w-4 h-4 text-amber-700" /> India Post Air Express (Priority)
                          </p>
                          <p className="text-[11px] text-black/60 mt-0.5">Estimated 2-3 business days</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase text-black">₹99</span>
                    </label>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="bg-black text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer shadow-xs"
                      >
                        CONTINUE TO PAYMENT ›
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-black/80 font-semibold">
                    <p className="uppercase">
                      {shippingMethod === 'express' ? 'India Post Air Express (₹99)' : 'India Post Standard Delivery (Free / ₹49)'}
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white border border-black/10 rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/10">
                  <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">03</span>
                  <h2 className="font-sans font-medium text-lg sm:text-xl uppercase tracking-tight text-black">Payment Method</h2>
                </div>

                {activeStep === 3 && (
                  <div className="flex flex-col gap-4">
                    {/* Option A: Razorpay */}
                    <label className={`flex items-start justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-black bg-black/[0.02] shadow-xs' : 'border-black/10 hover:border-black/30'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                          className="accent-black mt-1"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-2 text-black">
                            <CreditCard className="w-4 h-4 text-blue-600" /> UPI / Cards / NetBanking (Official Razorpay Gateway)
                          </p>
                          <p className="text-[11px] text-black/60 mt-1">
                            Secure payment with Google Pay, PhonePe, Paytm, RuPay cards, and NetBanking.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] bg-[#f5f5f2] border border-black/10 px-2 py-0.5 rounded-xs font-semibold text-black">UPI</span>
                            <span className="text-[9px] bg-[#f5f5f2] border border-black/10 px-2 py-0.5 rounded-xs font-semibold text-black">GPAY</span>
                            <span className="text-[9px] bg-[#f5f5f2] border border-black/10 px-2 py-0.5 rounded-xs font-semibold text-black">PHONEPE</span>
                            <span className="text-[9px] bg-[#f5f5f2] border border-black/10 px-2 py-0.5 rounded-xs font-semibold text-black">CARDS</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Option B: Cash on Delivery */}
                    <label className={`flex items-start justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-black bg-black/[0.02] shadow-xs' : 'border-black/10 hover:border-black/30'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-black mt-1"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-2 text-black">
                            <Banknote className="w-4 h-4 text-emerald-700" /> Cash on Delivery (COD)
                          </p>
                          <p className="text-[11px] text-black/60 mt-1">
                            Pay in cash upon doorstep delivery (+₹49 handling fee).
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase text-black">+₹49</span>
                    </label>

                    <div className="mt-8 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-black/70">
                        Total Payable: <b className="font-sans font-medium text-base text-black">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                      </p>
                      <Button
                        variant="dark"
                        onClick={handleProceedToPayment}
                        disabled={loading || paymentState === 'initiating' || paymentState === 'verifying'}
                        className="w-full px-10 py-4 text-xs font-semibold uppercase tracking-[0.14em] shadow-xs sm:w-auto"
                      >
                        {(loading || paymentState === 'initiating' || paymentState === 'verifying') && (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        )}
                        {paymentState === 'initiating'
                          ? 'Opening payment…'
                          : paymentState === 'verifying'
                          ? 'Verifying Payment…'
                          : paymentMethod === 'cod'
                          ? 'Place COD Order →'
                          : 'Pay with Razorpay →'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Right Column: Order Summary */}
          <div className="flex flex-col sticky top-24 h-fit bg-white border border-black/10 rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="font-sans font-medium text-lg uppercase tracking-tight mb-6 pb-4 border-b border-black/10 text-black">
              ORDER SUMMARY ({items.length})
            </h3>
            
            <div className="flex flex-col gap-5 mb-8 max-h-[380px] overflow-y-auto pr-1">
              {items.map(item => {
                const key = getItemKey(item);
                return (
                  <div key={key} className="flex gap-4 group border-b border-black/10 pb-4 last:border-b-0">
                    <div className="relative w-[64px] h-[78px] bg-[#f5f5f2] border border-black/10 rounded-xs shrink-0 overflow-hidden">
                      <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-tight text-black">{item.name}</h4>
                        <p className="text-[10px] text-black/50 uppercase tracking-wider mt-0.5">
                          {item.color} | Size: {item.size}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <button aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => updateQuantity(key, Math.max(1, item.quantity - 1))} className="w-5 h-5 border border-black/15 flex items-center justify-center hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed text-black cursor-pointer rounded-xs">-</button>
                          <span aria-live="polite" className="text-black">{item.quantity}{item.quantity >= 10 ? " (max)" : ""}</span>
                          <button aria-label="Increase quantity" disabled={item.quantity >= 10} onClick={() => updateQuantity(key, item.quantity + 1)} className="w-5 h-5 border border-black/15 flex items-center justify-center hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed text-black cursor-pointer rounded-xs">+</button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(key)} className="text-black/40 hover:text-black text-xs cursor-pointer">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code */}
            <div className="border-t border-black/10 pt-4 pb-2">
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-[#f5f5f2] border border-black/10 px-3 py-2 rounded-sm">
                  <span className="text-[10px] font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {appliedPromo.code} — {(appliedPromo.discount * 100).toFixed(0)}% OFF
                  </span>
                  <button
                    onClick={() => { clearPromo(); setPromoInput(""); }}
                    className="text-[10px] font-semibold text-black/60 hover:text-black underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border border-black/15 rounded-sm px-3 py-2">
                    <Tag className="w-3.5 h-3.5 text-black/40 shrink-0" />
                    <input
                      type="text"
                      value={promoInputValue}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Promo code"
                      className="w-full text-xs font-semibold uppercase outline-none bg-transparent tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-black/40 text-black"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-black text-white text-[10px] font-semibold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer rounded-sm"
                  >
                    Apply
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider mt-1.5">{promoError}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col gap-2.5 text-xs border-t border-black/10 pt-4">
              <div className="flex justify-between items-center text-black/65">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-black">₹{subtotal.toFixed(2)}</span>
              </div>
              {setDiscount > 0 && (
                <div className="flex justify-between items-center text-black font-semibold">
                   <span>Set discount:</span>
                  <span>−₹{setDiscount.toFixed(2)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-black font-semibold">
                  <span>Promo ({appliedPromo!.code}):</span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-black/65">
                <span>Shipping ({shippingMethod === 'express' ? 'Express' : 'Standard'}):</span>
                <span className="font-semibold text-black">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between items-center text-black/65">
                  <span>COD Handling:</span>
                  <span className="font-semibold text-black">₹{codFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-semibold text-sm border-t border-black/10 pt-3 mt-1 text-black">
                <span>Total Amount:</span>
                <span className="font-sans font-medium text-base">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <p className="text-[10px] text-black/50 text-center mt-6 tracking-[0.04em]">
               ✦ You will earn {Math.floor(finalTotal / 10)} points with this order.
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
        <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-black/50">
          Loading Checkout…
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
