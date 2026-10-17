"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense, useSyncExternalStore } from "react";
import { useCartStore, getItemKey, VALID_PROMOS } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, ArrowLeft, CreditCard, Tag, CheckCircle2, AlertCircle, Minus, Plus, Truck, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { triggerPromoSuccessBurst } from "@/lib/confetti";
import { createPortal } from "react-dom";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";
import AreaPicker from "@/components/checkout/AreaPicker";
import { type PickedSpot } from "@/components/checkout/ExactLocationMap";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import type { ParsedPlace } from "@/lib/googleMaps";
import { estimateDeliveryEta, formatEtaRange } from "@/lib/deliveryEta";
import {
  composeStreetAddress,
  dedupeSavedAddresses,
  splitStreetAddress,
  type SavedCheckoutAddress,
} from "@/lib/savedAddresses";
import { toRazorpayContact } from "@/lib/razorpayContact";
import { externalBrowserHref, isInAppBrowser } from "@/lib/inAppBrowser";
// Hold identity is a server-minted cookie now — the client no longer picks it.

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
  // In-modal retry keeps a failed UPI attempt inside the same checkout instead
  // of forcing a fresh order; timeout (seconds) is aligned with the 7-minute
  // stock hold so the sheet cannot outlive the reservation it is paying for.
  retry?: { enabled: boolean; max_count: number };
  timeout?: number;
  // Lets Checkout show only the UPI flows the network still supports — the
  // retired "collect" flow is hidden via this config (see options below).
  config?: {
    display?: {
      hide?: Array<{ method: string; flows?: string[] }>;
    };
  };
};

type RazorpayInstance = {
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
  open: () => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

/** Renders children straight into <body>. Payment overlays must not live under
 * the animated page wrapper — its transform/filter makes it a containing
 * block, which breaks `position: fixed` and makes pop-ups scroll with the page. */
function ViewportPortal({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready || typeof document === "undefined") return null;
  return createPortal(children, document.body);
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
  building: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
};

/** The order the fields appear in, so focus lands on the first bad one. */
const FIELD_ORDER = ["fullName", "phone", "email", "building", "pincode", "city"] as const;

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

  if (!data.building.trim()) errors.building = "Enter the building / floor and house number.";

  const pincode = data.pincode.trim();
  if (!pincode) errors.pincode = "Enter your 6-digit PIN code.";
  else if (!/^\d{6}$/.test(pincode)) errors.pincode = "A PIN code is exactly 6 digits.";

  if (!data.city.trim()) errors.city = "Enter the city.";

  return errors;
}

/** Boxed fields (reference style): the wrapper draws the rounded frame (black
 *  on focus-within), the control stays borderless — the monochrome theme
 *  forces borders and a white fill onto inputs, and `bg-transparent` opts the
 *  control out of it. */
const fieldClass = () =>
  "w-full bg-transparent px-0 py-3.5 text-sm text-black outline-none placeholder:text-black/35 rounded-none";

const fieldWrap = (hasError: boolean) =>
  `flex items-center rounded-xl border bg-white px-3.5 transition-colors ${
    hasError ? "border-red-400" : "border-black/10 focus-within:border-black"
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

// useSyncExternalStore needs stable, module-level functions. The user agent
// cannot change mid-session, so the subscription never fires; hydration renders
// the server snapshot ("") first and then swaps in the real UA.
const subscribeNever = () => () => {};
const getUaSnapshot = () => (typeof navigator === "undefined" ? "" : navigator.userAgent);
const getUaServerSnapshot = () => "";

/** In-app browsers often block the async Clipboard API; textarea + execCommand
 * still works there. */
function fallbackCopy(text: string, onDone: () => void) {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
    onDone();
  } catch {
    // The ⋮ / ⋯ menu path in the notice still works without the copy.
  }
}

function CheckoutContent() {
  const router = useRouter();
  const {
    items,
    cartSubtotal,
    bundleDiscount,
    cartTotal,
    mrpTotal,
    mrpDiscount,
    promoCode,
    promoDiscount,
    promoType,
    isFreeShipping,
    promoAmount,
    shippingFee,
    applyPromo,
    setPromo,
    clearPromo,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
  } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const promoFromCart = searchParams.get("promo");
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'guest' | 'account'>(isAuthenticated ? 'account' : 'select');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentState, setPaymentState] = useState<'idle' | 'initiating' | 'verifying' | 'failed'>('idle');
  const [failureDetails, setFailureDetails] = useState<{ title: string; message: string } | null>(null);
  const paymentCompletedRef = useRef(false);
  const checkoutIdsRef = useRef<{ razorpay: string | null }>({ razorpay: null });

  // In-app browsers (Instagram, Facebook, WhatsApp, TikTok …) block UPI app
  // hand-offs, so a payment started inside one strands at authentication and
  // times out ("payment_timed_out" with no Bank RRN in the Razorpay
  // dashboard). Detect it and offer a one-tap escape to the real browser
  // before taking payment.
  const inAppUa = useSyncExternalStore(subscribeNever, getUaSnapshot, getUaServerSnapshot);
  const isInApp = isInAppBrowser(inAppUa);
  const [showInAppPrompt, setShowInAppPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Set only by the prompt's "Continue anyway" button — one payment attempt
  // may proceed without the escape, then the guard arms again.
  const allowInAppPayRef = useRef(false);

  // The most recently created (or resumed) Razorpay order — the failure
  // dialog's "pay manually" fallback mints a payment link for it.
  const [activeOrder, setActiveOrder] = useState<{ id: string; number: string } | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  // One live link per order is enough; clicks reuse it instead of minting
  // (and texting/emailing) a new one until it expires.
  const paymentLinkRef = useRef<{ orderId: string; shortUrl: string; expiresAt: number } | null>(null);

  // Lock page scroll while a payment overlay is up — they are portalled to
  // <body> and the page behind them must not scroll on phones.
  const paymentOverlayOpen =
    paymentState === "initiating" || paymentState === "verifying" || paymentState === "failed" || showInAppPrompt;
  useEffect(() => {
    if (!paymentOverlayOpen) return;
    acquireScrollLock();
    return () => releaseScrollLock();
  }, [paymentOverlayOpen]);

  const getCheckoutIdFor = (method: 'razorpay'): string => {
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

  const rotateCheckoutId = (method: 'razorpay') => {
    checkoutIdsRef.current[method] = null;
    try {
      window.sessionStorage.removeItem(`bagify-checkout-${method}`);
    } catch {}
  };

  // Promo code — single source in useCartStore
  const [promoInput, setPromoInput] = useState<string | null>(null);
  const promoFromUrl = promoFromCart?.trim().toUpperCase();
  const promoInputValue = promoInput ?? (
    promoFromUrl && (VALID_PROMOS[promoFromUrl] !== undefined || promoFromUrl === 'FREESHIP')
      ? promoFromUrl
      : promoCode || ""
  );
  const appliedPromo = promoCode ? { code: promoCode, discount: promoDiscount } : null;
  const [promoError, setPromoError] = useState("");
  const [shakePromo, setShakePromo] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmRemoveKey) return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-remove-tooltip]")) return;
      setConfirmRemoveKey(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmRemoveKey(null);
    };
    window.addEventListener("click", handleDocClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleDocClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [confirmRemoveKey]);

  const triggerShake = () => {
    setShakePromo(true);
    setTimeout(() => setShakePromo(false), 500);
  };

  const handleApplyPromo = async (e?: React.MouseEvent) => {
    if (!promoInputValue.trim()) {
      triggerShake();
      return;
    }
    setPromoError("");

    const res = applyPromo(promoInputValue);
    if (res.ok) {
      setPromoInput(promoInputValue.trim().toUpperCase());
      setPromoError("");
      triggerPromoSuccessBurst(e);
      return;
    }

    try {
      const apiRes = await fetch(
        `/api/coupons?code=${encodeURIComponent(promoInputValue.trim())}&subtotal=${cartSubtotal()}`
      );
      const data = await apiRes.json();

      if (apiRes.ok && data.coupon) {
        setPromo(data.coupon);
        setPromoInput(data.coupon.code);
        setPromoError("");
        triggerPromoSuccessBurst(e);
      } else {
        setPromoError(data.error || "Invalid promo code.");
        triggerShake();
      }
    } catch {
      setPromoError("Unable to validate coupon.");
      triggerShake();
    }
  };

  // Address Form State
  const [formData, setFormData] = useState<AddressForm>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    building: "",
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  // Google-formatted "Area" line picked in the checkout picker (persisted).
  const [areaText, setAreaText] = useState("");
  const [areaHint, setAreaHint] = useState("");
  // Exact delivery pin picked on the map (optional). pinAtSet guards against
  // keeping coordinates after the shopper switches the PIN to another city.
  const [exactSpot, setExactSpot] = useState<{ lat: number; lng: number; pinAtSet: string } | null>(null);
  const [addressWarning, setAddressWarning] = useState("");
  const pincodeCache = useRef(new Map<string, { city: string; state: string }>());
  const locSeq = useRef(0);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  /** Map a reverse-geocoded subdivision name onto our state list. */
  const matchState = (name: string): string | null => {
    const clean = name.trim().toLowerCase();
    const aliases: Record<string, string> = {
      "national capital territory of delhi": "Delhi",
      "nct of delhi": "Delhi",
      "new delhi": "Delhi",
      "jammu and kashmir": "Jammu & Kashmir",
      "uttaranchal": "Uttarakhand",
      "orissa": "Odisha",
      "pondicherry": "Puducherry",
    };
    if (aliases[clean]) return aliases[clean] ?? null;
    const hit = INDIAN_STATES.find((st) => st.toLowerCase() === clean);
    return hit ?? null;
  };

  // Saved addresses (signed-in shoppers). Fetched once per checkout visit;
  // the form auto-fills with the most recent one, Amazon/Flipkart style.
  const [savedAddresses, setSavedAddresses] = useState<SavedCheckoutAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);

  // Order summary rail (collapsed by default) in the checkpoint layout.
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Read inside the fetch effect without making it re-run on every keystroke.
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  });

  /** Fill the form from a saved address (also restores its exact map pin). */
  const applySavedAddress = (address: SavedCheckoutAddress) => {
    // Rows store one combined street line; the form shows Building + Street.
    const parts = splitStreetAddress(address.street);
    setFormData((prev) => ({
      ...prev,
      fullName: address.fullName || prev.fullName,
      phone: address.phone || prev.phone,
      building: parts.building,
      street: parts.street,
      city: address.city,
      state: matchState(address.state) || prev.state,
      pincode: address.pincode,
    }));
    setAreaText(address.area || "");
    setExactSpot(
      typeof address.lat === "number" && typeof address.lng === "number"
        ? { lat: address.lat, lng: address.lng, pinAtSet: address.pincode }
        : null
    );
    setSelectedSavedAddressId(address.id);
    setFieldErrors({});
    setAddressWarning("");
  };

  const clearSavedAddressSelection = () => {
    setSelectedSavedAddressId(null);
    setFormData((prev) => ({ ...prev, building: "", street: "", city: "", pincode: "" }));
    setAreaText("");
    setExactSpot(null);
    setFieldErrors({});
    setAddressWarning("");
  };

  useEffect(() => {
    if (!isAuthenticated || !user || checkoutMode !== "account") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/addresses");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = dedupeSavedAddresses(
          Array.isArray(data?.addresses) ? data.addresses : []
        ).slice(0, 5);
        if (cancelled || list.length === 0) return;
        setSavedAddresses(list);
        // Pre-select the last used address unless the shopper already typed.
        const first = list[0];
        if (first && !formDataRef.current.building && !formDataRef.current.street && !formDataRef.current.pincode) {
          applySavedAddress(first);
        }
      } catch {
        // Offline or signed out mid-flight — the plain form still works.
      }
    })();
    return () => {
      cancelled = true;
    };
    // The fetch must run only when the signed-in shopper shows up, not on
    // every keystroke — the helpers it calls are stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, checkoutMode]);

  // "Arrives Mon, 19 Oct – Wed, 21 Oct" once a full PIN is entered.
  const etaLabel = /^\d{6}$/.test(formData.pincode.trim())
    ? formatEtaRange(estimateDeliveryEta(formData.state))
    : null;

  /** Free India PIN lookup (India Post data), cached for the visit. */
  const fetchPincodeInfo = async (pin: string): Promise<{ city: string; state: string } | null> => {
    const cached = pincodeCache.current.get(pin);
    if (cached) return cached;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      if (!res.ok) return null;
      const data = await res.json();
      const office = data?.[0]?.PostOffice?.[0];
      if (!office) return null;
      const city = String(office.District || office.Block || "").trim();
      const state = matchState(String(office.State || "")) || String(office.State || "").trim();
      if (!city || !state) return null;
      const info = { city, state };
      pincodeCache.current.set(pin, info);
      return info;
    } catch {
      return null; // Offline — the shopper types city manually.
    }
  };

  /** Typing 6 digits fills city + state, no dropdown hunt. */
  const lookupPincode = async (pin: string) => {
    const seq = ++locSeq.current;
    const info = await fetchPincodeInfo(pin);
    if (!info || seq !== locSeq.current) return;
    setFormData((prev) => ({ ...prev, city: info.city, state: info.state }));
    setFieldErrors((prev) => ({ ...prev, city: undefined }));
    setAreaHint(`Delivering to ${info.city}, ${info.state}`);
  };

  /**
   * Soft quality check before payment: does the PIN's official India Post
   * record agree with the chosen state? Never blocks checkout — just flags a
   * likely typo for one more look.
   */
  const verifyAddressPin = async (data: AddressForm) => {
    if (exactSpot) return; // A dropped pin outranks postal-record naming.
    const pin = data.pincode.trim();
    if (!/^\d{6}$/.test(pin)) return;
    const info = await fetchPincodeInfo(pin);
    if (!info) return;
    if (info.state && data.state && info.state !== data.state) {
      setAddressWarning(`PIN ${pin} belongs to ${info.city}, ${info.state} — please double-check the state.`);
    } else {
      setAddressWarning("");
    }
  };

  /** A Places suggestion was picked — fill the Area line + locality fields. */
  const handlePlaceSelected = (place: ParsedPlace) => {
    const mappedState = place.state ? matchState(place.state) : null;
    setAreaText(place.label || place.street || "");
    setFormData((prev) => ({
      ...prev,
      // Never stomp text the shopper already typed — only seed empty fields.
      street: prev.street.trim() ? prev.street : place.street || prev.street,
      city: place.city || prev.city,
      state: mappedState || prev.state,
      pincode: place.pincode.length === 6 ? place.pincode : prev.pincode,
    }));
    setFieldErrors((prev) => ({ ...prev, city: undefined, pincode: undefined }));
    setAddressWarning("");
    if (place.location) {
      setExactSpot({ lat: place.location.lat, lng: place.location.lng, pinAtSet: place.pincode });
      lastCoordsRef.current = { lat: place.location.lat, lng: place.location.lng };
    }
    if (place.pincode.length === 6) {
      // India Post district data is what the courier's address system uses.
      void lookupPincode(place.pincode);
    }
  };

  /** Exact spot chosen on the map — fill what the reverse lookup found. */
  const handleMapPicked = (spot: PickedSpot) => {
    const mappedState = spot.state ? matchState(spot.state) : null;
    if (spot.areaLabel) setAreaText(spot.areaLabel);
    setFormData((prev) => ({
      ...prev,
      ...(spot.pincode.length === 6 ? { pincode: spot.pincode } : {}),
      ...(spot.city ? { city: spot.city } : {}),
      ...(mappedState ? { state: mappedState } : {}),
    }));
    setExactSpot({
      lat: spot.lat,
      lng: spot.lng,
      pinAtSet: spot.pincode.length === 6 ? spot.pincode : formData.pincode,
    });
    lastCoordsRef.current = { lat: spot.lat, lng: spot.lng };
    setAddressWarning("");
    setAreaHint('Exact spot pinned — the courier will see it.');
  };

  const handleMapCleared = () => {
    setExactSpot(null);
    setAreaHint('');
  };

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
  // first, then the promo code applies to what's left.
  const subtotal = cartSubtotal();
  const setDiscount = bundleDiscount();
  // Studio MRP rows. Display only — they never change what is charged.
  const mrpTotalValue = mrpTotal();
  const mrpDiscountValue = mrpDiscount();
  const total = cartTotal();
  const isFree = isFreeShipping || promoType === "FREE_SHIPPING";
  const deliveryCost = shippingFee();
  const discountAmount = promoAmount();
  const finalTotal = Math.max(0, Math.round((total - discountAmount + deliveryCost) * 100) / 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Mobile numbers are 10 digits (optionally with +91); never let the field
    // grow past that while typing or pasting.
    if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      // If someone pastes a 12-digit "+91 9XXXXXXXXX" number, keep the
      // trailing 10 digits (the actual mobile number).
      const normalized = digits.length > 10 ? digits.slice(-10) : digits;
      setFormData((prev) => ({ ...prev, phone: normalized }));
      setFieldErrors((prev) => (prev.phone ? { ...prev, phone: undefined } : prev));
      return;
    }
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, pincode: digits }));
      setFieldErrors((prev) => (prev.pincode ? { ...prev, pincode: undefined } : prev));
      // A pin dropped for another PIN city no longer applies to this address.
      setExactSpot((prev) => (prev && prev.pinAtSet && digits !== prev.pinAtSet ? null : prev));
      setAddressWarning("");
      if (digits.length === 6) void lookupPincode(digits);
      else setAreaHint("");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field's complaint as soon as the shopper starts fixing it.
    setFieldErrors((prev) => (prev[name as keyof AddressForm] ? { ...prev, [name]: undefined } : prev));
    if (name === "city" || name === "state") setAddressWarning("");
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
    // Non-blocking India Post sanity check — a warning may appear under the form.
    void verifyAddressPin(formData);
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
        const msg = verifyData.error || "Your transaction didn't go through, please try again.";
        setError(msg);
        setPaymentState('idle');
        setTimeout(() => {
          setPaymentState('failed');
          setFailureDetails({
            title: "Transaction Didn't Go Through",
            message: "Your transaction didn't go through, please try again.",
          });
        }, 800);
      }
    } catch (err: unknown) {
      console.error('Verify error:', err);
      const msg = err instanceof Error ? err.message : "Your transaction didn't go through, please try again.";
      setError(msg);
      setPaymentState('idle');
      setTimeout(() => {
        setPaymentState('failed');
        setFailureDetails({
          title: "Transaction Didn't Go Through",
          message: "Your transaction didn't go through, please try again.",
        });
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  /** Hands the current checkout URL to the phone's real browser. Android
   * honours the intent: hand-off; iOS 17+ the x-safari-https form. */
  const openInRealBrowser = () => {
    if (typeof window === "undefined") return;
    window.location.href = externalBrowserHref(window.location.href, inAppUa);
  };

  const copyCheckoutLink = () => {
    if (typeof window === "undefined") return;
    const link = window.location.href;
    const done = () => {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(() => fallbackCopy(link, done));
    } else {
      fallbackCopy(link, done);
    }
  };

  /** Hand a Razorpay payment link to the shopper — via the phone's real
   * browser when they're stuck in an in-app WebView, which would otherwise
   * block the hosted page's UPI hand-off the same way it blocks Checkout. */
  const openPaymentLink = (shortUrl: string) => {
    if (typeof window === "undefined") return;
    window.location.href = isInApp ? externalBrowserHref(shortUrl, inAppUa) : shortUrl;
  };

  /** Failure-dialog escape hatch: mint (or reuse) a Razorpay Payment Link for
   * the order that just failed and send the shopper to it. The link carries
   * the exact total and a bagifyOrderId note, so paying it finalizes this
   * same order through the normal webhook pipeline. Razorpay also texts and
   * emails the link, so the payment survives a closed tab. */
  const handlePayViaLink = async () => {
    if (!activeOrder || creatingLink) return;
    setLinkError("");

    const cached = paymentLinkRef.current;
    if (cached && cached.orderId === activeOrder.id && Date.now() < cached.expiresAt - 30_000) {
      openPaymentLink(cached.shortUrl);
      return;
    }

    try {
      setCreatingLink(true);
      const res = await fetch("/api/payment/razorpay/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          checkoutId: getCheckoutIdFor("razorpay"),
          customerEmail: formData.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Could not create the payment link. Please try again.");
      }
      if (data.alreadyPaid) {
        router.push(`/checkout/success?order_id=${activeOrder.id}`);
        return;
      }
      if (typeof data.shortUrl !== "string" || !data.shortUrl) {
        throw new Error("Could not create the payment link. Please try again.");
      }
      paymentLinkRef.current = {
        orderId: activeOrder.id,
        shortUrl: data.shortUrl,
        expiresAt: typeof data.expiresAt === "number" ? data.expiresAt : Date.now() + 15 * 60 * 1000,
      };
      openPaymentLink(data.shortUrl);
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Could not create the payment link. Please try again."
      );
    } finally {
      setCreatingLink(false);
    }
  };

  const handleProceedToPayment = async () => {
    // Starting Checkout inside an in-app browser is what produced the wave of
    // timed-out UPI payments — route the shopper to a real browser first.
    if (isInApp && !allowInAppPayRef.current) {
      setShowInAppPrompt(true);
      return;
    }
    allowInAppPayRef.current = false;
    setError("");
    setLinkError("");
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
    void verifyAddressPin(formData);

    try {
      setLoading(true);

      // Online payment only — Razorpay Standard Web Checkout
      setPaymentState('initiating');
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Unable to load Razorpay SDK. Please check your internet connection.');
      }

      const buildOrderBody = () => JSON.stringify({
        items,
        shippingAddress: {
          ...formData,
          // The form posts one stored street line; the Area line rides along.
          street: composeStreetAddress(formData.building, formData.street),
          ...(areaText ? { area: areaText } : {}),
          ...(exactSpot ? { lat: exactSpot.lat, lng: exactSpot.lng } : {}),
        },
        customerEmail: formData.email,
        customerPhone: formData.phone,
        promoCode: appliedPromo?.code || null,
        checkoutId: getCheckoutIdFor('razorpay'),
      });

      const createOrder = () =>
        fetch('/api/payment/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: buildOrderBody(),
        });

      let res = await createOrder();
      let orderData = await res.json();

      // A reference that belongs to an older session (different login state or
      // email), or an order that can no longer be resumed, is a dead end —
      // mint a fresh reference and retry once so "Retry Payment" can never
      // get stuck reusing a stale checkout id.
      const staleReference =
        res.status === 409 &&
        /no longer valid|cannot be resumed/i.test(String(orderData?.error || ""));
      if (staleReference) {
        rotateCheckoutId('razorpay');
        res = await createOrder();
        orderData = await res.json();
      }

      if (!res.ok) {
        throw new Error(
          orderData.ref ? `${orderData.error || 'Failed to initialize payment'} (ref ${orderData.ref})` : (orderData.error || 'Failed to initialize payment')
        );
      }

      // A settled order can still be reached from this dialog — e.g. the
      // shopper paid the fallback link in another tab, or a late UPI approval
      // landed after the window. Go straight to the confirmation instead of
      // opening Checkout again.
      if (orderData.alreadyPaid) {
        router.push(`/checkout/success?order_id=${orderData.orderId}`);
        return;
      }

      setActiveOrder({ id: orderData.orderId, number: orderData.orderNumber });

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
          // Razorpay expects "+{country code}{number}" (digits only) and uses
          // it to pre-fill the UPI intent/QR flows. The form keeps bare
          // 10-digit numbers, but saved addresses can still hold older
          // "+91 98765 43210"-style values, so normalise before sending.
          contact: toRazorpayContact(formData.phone),
        },
        notes: {
          address: `${composeStreetAddress(formData.building, formData.street)}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        },
        theme: {
          color: "#050505",
        },
        // NPCI retired the UPI "collect" flow (VPA/mobile-number collect
        // requests) on 28 February 2026. Leaving it on Checkout is exactly
        // what produced the BAD_REQUEST_ERROR / payment_authentication /
        // payment_timed_out failures in the Razorpay dashboard: shoppers who
        // picked a collect-style UPI option could never be authenticated.
        // Hiding it makes Checkout fall back to the supported flows —
        // app-switch (UPI Intent) on phones, dynamic QR on desktop.
        config: {
          display: {
            hide: [{ method: "upi", flows: ["collect"] }],
          },
        },
        // Let UPI timed-out/invalid-account attempts retry in place (same
        // Razorpay order, same local order) instead of starting over.
        retry: {
          enabled: true,
          max_count: 3,
        },
        // Matches the 7-minute stock reservation: a sheet left open past the
        // hold would pay for pieces that may already be sold to someone else.
        timeout: 420,
        modal: {
          ondismiss: function () {
            setLoading(false);
            setPaymentState('idle');
            if (!paymentCompletedRef.current) {
              setTimeout(() => {
                setPaymentState('failed');
                setFailureDetails({
                  title: "Transaction Didn't Go Through",
                  message: "Your transaction didn't go through, please try again.",
                });
              }, 800);
            }
          },
        },
      };

      const rzp = new (window.Razorpay as unknown as RazorpayConstructor)(options);
      rzp.on('payment.failed', function (resp: RazorpayFailureResponse) {
        paymentCompletedRef.current = false;
        const failureReason = resp.error?.description || resp.error?.reason || "Your transaction didn't go through, please try again.";
        setError(`Payment failed: ${failureReason}`);
        setLoading(false);
        setPaymentState('idle');
        // "payment_timed_out" is the one failure a shopper can turn around:
        // the UPI request reached their app but expired unapproved. Spell
        // that out instead of the generic line.
        const upiTimedOut =
          resp.error?.reason === "payment_timed_out" ||
          /timed?\s*out/i.test(failureReason);
        setTimeout(() => {
          setPaymentState('failed');
          setFailureDetails({
            title: "Transaction Didn't Go Through",
            message: upiTimedOut
              ? "Your UPI request expired before it was approved. Please try again and approve the payment request in your UPI app the moment it appears."
              : "Your transaction didn't go through, please try again.",
          });
        }, 800);
      });
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Your transaction didn't go through, please try again.";
      setError(msg);
      setLoading(false);
      setPaymentState('idle');
      setTimeout(() => {
        setPaymentState('failed');
        setFailureDetails({
          title: "Transaction Didn't Go Through",
          message: "Your transaction didn't go through, please try again.",
        });
      }, 800);
    }
  };

  if (items.length === 0) {
    // A successful payment clears the bag before the success-page navigation
    // completes — keep a processing screen up instead of flashing
    // "Your Bag is Empty" and unmounting the payment overlays mid-transition.
    if (paymentState === 'verifying') {
      return (
        <div
          className="min-h-[75vh] bg-[#f5f5f2] flex flex-col items-center justify-center pt-20 px-4 text-black font-sans"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="w-8 h-8 animate-spin text-black mb-4" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/60">
            Finalizing your order…
          </p>
        </div>
      );
    }
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
          className="btn-bagify btn-bagify-dark text-xs uppercase tracking-[0.14em]"
        >
          <span>Shop The Drop</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] text-black font-sans px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <div className="mx-auto w-full max-w-[620px]">

        <div className="bg-white border border-black/10 rounded-2xl px-6 py-8 sm:px-10 sm:py-10">
          <Link
            href="/"
            className="editorial-back inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>

          <h1 className="mt-6 text-3xl font-medium tracking-[-0.04em] text-black sm:text-4xl">
            Checkout
          </h1>

          <CheckoutStepper
            current={checkoutMode === 'select' ? 1 : activeStep}
            className="mt-8"
          />

          {/* In-app browser notice — Instagram/Facebook/WhatsApp webviews
              cannot open UPI apps, which is what stranded the failed UPI
              payments at authentication. */}
          {isInApp && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-amber-600/40 bg-amber-50/80 p-4 text-left"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-black">
                    Open this page in Chrome or Safari to pay
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-black/65">
                    You&apos;re inside an app&apos;s built-in browser, where UPI apps (GPay, PhonePe…) can&apos;t open and payments time out. Tap the button below, or use the ⋮ / ⋯ menu at the top and choose &ldquo;Open in browser&rdquo;. Your bag is saved.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={openInRealBrowser}
                      className="btn-bagify btn-bagify-dark text-xs uppercase tracking-[0.14em] cursor-pointer"
                    >
                      <span>Open in browser</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyCheckoutLink}
                      className="btn-bagify btn-bagify-light text-xs uppercase tracking-[0.14em] cursor-pointer"
                    >
                      <span>{copiedLink ? "Link copied ✓" : "Copy link"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Light Stone Processing Pop-up */}
        {(paymentState === 'initiating' || paymentState === 'verifying') && (
          <ViewportPortal>
          <div
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overscroll-none"
            role="status"
            aria-live="polite"
            data-lenis-prevent="true"
          >
            <motion.div
              initial={{ opacity: 1, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="max-w-sm w-full max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-[#f7f7f5] p-6 sm:p-8 text-center text-black shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            >
              <div className="relative w-12 h-12 mx-auto mb-4" aria-hidden="true">
                <span className="absolute inset-0 rounded-full border-2 border-black/10" />
                <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-black animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-black">
                  ₹
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-black mb-1.5">
                Payment Processing
              </h2>
              <p className="text-xs text-black/60 leading-relaxed max-w-xs mx-auto mb-5">
                Your payment is being processed. Please do not close or refresh this tab.
              </p>
              <div className="inline-flex items-center gap-2 border border-black/10 bg-white px-4 py-2 rounded-full text-xs text-black shadow-2xs">
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-black/50">Total</span>
                <span className="font-bold text-black tabular-nums">
                  ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </motion.div>
          </div>
          </ViewportPortal>
        )}

        {/* Light Stone Transaction Failed Pop-up */}
        {paymentState === 'failed' && (
          <ViewportPortal>
          <div
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overscroll-none"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pay-fail-title"
            data-lenis-prevent="true"
          >
            <motion.div
              initial={{ opacity: 1, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-sm w-full max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-[#f7f7f5] p-6 sm:p-8 text-center text-black shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            >
              <div className="w-12 h-12 rounded-full border border-black/10 bg-white flex items-center justify-center mx-auto mb-4 text-black shadow-2xs">
                <AlertCircle className="w-5 h-5 text-black" aria-hidden="true" />
              </div>
              <h2
                id="pay-fail-title"
                className="text-base sm:text-lg font-bold uppercase tracking-tight text-black mb-1.5"
              >
                {failureDetails?.title || "Transaction Didn't Go Through"}
              </h2>
              <p className="text-xs text-black/60 leading-relaxed max-w-xs mx-auto mb-6">
                {failureDetails?.message || "Your transaction didn't go through, please try again."}
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentState('idle');
                    setFailureDetails(null);
                    setLoading(false);
                    handleProceedToPayment();
                  }}
                  className="btn-bagify btn-bagify-dark w-full justify-center text-xs uppercase tracking-[0.14em] cursor-pointer"
                >
                  <span>Retry Payment</span>
                </button>
                {activeOrder && (
                  <>
                    <div className="flex items-center gap-3" aria-hidden="true">
                      <span className="h-px flex-1 bg-black/10" />
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-black/40">or</span>
                      <span className="h-px flex-1 bg-black/10" />
                    </div>
                    <button
                      type="button"
                      onClick={handlePayViaLink}
                      disabled={creatingLink}
                      className="btn-bagify btn-bagify-light w-full justify-center text-xs uppercase tracking-[0.14em] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        {creatingLink
                          ? 'Creating secure link…'
                          : `Pay ₹${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} via secure link`}
                      </span>
                    </button>
                    <p className="text-[10px] leading-relaxed text-black/55 -mt-1">
                      Opens Razorpay&apos;s hosted page{isInApp ? " in your phone's browser" : ''} — paying there
                      confirms this same order automatically, and the link is texted to you as backup.
                    </p>
                    {linkError && (
                      <p className="text-[10px] leading-relaxed text-red-600" role="alert">
                        {linkError}
                      </p>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentState('idle');
                    setFailureDetails(null);
                    setLoading(false);
                    openCart();
                  }}
                  className="btn-bagify btn-bagify-light w-full justify-center text-xs uppercase tracking-[0.14em] cursor-pointer"
                >
                  <span>Back to Cart</span>
                </button>
              </div>
            </motion.div>
          </div>
          </ViewportPortal>
        )}

        {/* In-app browser escape prompt — shown instead of opening Checkout
            when the shopper is inside a WebView that cannot open UPI apps. */}
        {showInAppPrompt && (
          <ViewportPortal>
          <div
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overscroll-none"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="in-app-pay-title"
            data-lenis-prevent="true"
          >
            <motion.div
              initial={{ opacity: 1, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-sm w-full max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-[#f7f7f5] p-6 sm:p-8 text-center text-black shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            >
              <div className="w-12 h-12 rounded-full border border-black/10 bg-white flex items-center justify-center mx-auto mb-4 text-black shadow-2xs">
                <AlertCircle className="w-5 h-5 text-black" aria-hidden="true" />
              </div>
              <h2
                id="in-app-pay-title"
                className="text-base sm:text-lg font-bold uppercase tracking-tight text-black mb-1.5"
              >
                Pay in Chrome or Safari
              </h2>
              <p className="text-xs text-black/60 leading-relaxed max-w-xs mx-auto mb-2">
                You&apos;re in an app&apos;s built-in browser, where UPI apps (GPay, PhonePe…) can&apos;t open — payments started here time out.
              </p>
              <p className="text-[11px] text-black/50 leading-relaxed max-w-xs mx-auto mb-6">
                If the button does nothing, use the ⋮ / ⋯ menu at the top and choose &ldquo;Open in browser&rdquo;. Your bag is saved.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowInAppPrompt(false);
                    openInRealBrowser();
                  }}
                  className="btn-bagify btn-bagify-dark w-full justify-center text-xs uppercase tracking-[0.14em] cursor-pointer"
                >
                  <span>Open in browser</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInAppPrompt(false);
                    allowInAppPayRef.current = true;
                    handleProceedToPayment();
                  }}
                  className="btn-bagify btn-bagify-light w-full justify-center text-xs uppercase tracking-[0.14em] cursor-pointer"
                >
                  <span>Continue here anyway</span>
                </button>
                <button
                  type="button"
                  onClick={copyCheckoutLink}
                  className="text-[10px] font-mono uppercase tracking-[0.16em] text-black/50 hover:text-black cursor-pointer"
                >
                  {copiedLink ? "Link copied ✓" : "Copy link instead"}
                </button>
              </div>
            </motion.div>
          </div>
          </ViewportPortal>
        )}

        <div>
          
          {/* Left Column: Form Stepper */}
          {checkoutMode === 'select' ? (
            <div className="mt-8">
              <div className="w-full">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] mb-5 text-black/50">
                  How would you like to continue?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  {/* Option 1: Guest */}
                  <div className="flex flex-col border border-black/10 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] mb-1.5 text-black">
                      Guest checkout
                    </h3>
                    <p className="text-[11px] text-black/55 mb-5">Fast checkout with email &amp; phone.</p>
                    <button 
                      onClick={() => setCheckoutMode('guest')}
                      className="checkout-flat mt-auto w-full rounded-none bg-black px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                    >
                      <span>Continue</span>
                    </button>
                  </div>
                  {/* Option 2: Sign In */}
                  <div className="flex flex-col border border-black/10 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] mb-1.5 text-black">
                      Google / Sign in
                    </h3>
                    <p className="text-[11px] text-black/55 mb-5">Save your details and earn points.</p>
                    <Link 
                      href="/login?from=/checkout"
                      className="checkout-flat mt-auto block w-full rounded-none bg-black px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                    >
                      <span>Sign in</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('select')}
                  className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-black/45 hover:text-black transition-colors cursor-pointer py-1"
                >
                  ← Change checkout mode
                </button>
                {user && (
                  <span className="text-[11px] text-black/55 flex items-center gap-1.5 max-w-full">
                    <span className="shrink-0">Logged in as</span>
                    <b className="truncate min-w-0 font-semibold text-black/70">{user.email}</b>
                  </span>
                )}
              </div>

              {error && (
                <div role="alert" className="border border-black/15 bg-white p-4 text-xs font-semibold uppercase tracking-[0.12em] text-black flex items-center gap-2 rounded-lg shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-black shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Delivery address */}
              <div className="mt-8">
                {activeStep === 1 ? (
                  <form onSubmit={handleAddressSubmit} noValidate className="flex flex-col gap-6">
                    {checkoutMode === "account" && savedAddresses.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-black/45">
                          Saved addresses
                        </p>
                        <div className="flex flex-col">
                          {savedAddresses.map((address) => {
                            const selected = selectedSavedAddressId === address.id;
                            return (
                              <button
                                type="button"
                                key={address.id}
                                onClick={() => applySavedAddress(address)}
                                aria-pressed={selected}
                                className={`checkout-flat group flex w-full items-start gap-3 rounded-none border-b border-black/[0.08] py-3 text-left transition-colors cursor-pointer ${
                                  selected ? "" : "hover:bg-black/[0.02]"
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                    selected ? "border-black bg-black" : "border-black/30 group-hover:border-black/60"
                                  }`}
                                >
                                  {selected && <span className="h-[5px] w-[5px] rounded-full bg-white" />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-semibold text-black">
                                    {address.fullName} · {address.phone}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[11px] text-black/55">
                                    {address.street}, {address.city}, {address.state} — {address.pincode}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={clearSavedAddressSelection}
                          className="mt-3 text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-black/45 hover:text-black underline underline-offset-4 transition-colors cursor-pointer"
                        >
                          + Use a new address
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="checkout-fullName" className="sr-only">Full Name</label>
                        <div className={fieldWrap(Boolean(fieldErrors.fullName))}>
                          <input
                            id="checkout-fullName"
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Full Name *"
                            autoComplete="name"
                            required
                            aria-invalid={Boolean(fieldErrors.fullName)}
                            aria-describedby={fieldErrors.fullName ? "checkout-fullName-error" : undefined}
                            className={fieldClass()}
                          />
                        </div>
                        <FieldError id="checkout-fullName-error" message={fieldErrors.fullName} />
                      </div>
                      <div>
                        <label htmlFor="checkout-phone" className="sr-only">Phone Number</label>
                        <div className={fieldWrap(Boolean(fieldErrors.phone))}>
                          <input
                            id="checkout-phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone Number (+91) *"
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            pattern="[0-9]{10}"
                            title="Enter the 10-digit mobile number"
                            required
                            aria-invalid={Boolean(fieldErrors.phone)}
                            aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                            className={fieldClass()}
                          />
                        </div>
                        <FieldError id="checkout-phone-error" message={fieldErrors.phone} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-email" className="sr-only">Email Address</label>
                      <div className={fieldWrap(Boolean(fieldErrors.email))}>
                        <input
                          id="checkout-email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email Address *"
                          autoComplete="email"
                          inputMode="email"
                          required
                          aria-invalid={Boolean(fieldErrors.email)}
                          aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                          className={fieldClass()}
                        />
                      </div>
                      <FieldError id="checkout-email-error" message={fieldErrors.email} />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-black/45">
                        Location Details
                      </p>
                      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-3.5 sm:p-4">
                        <div>
                          <label htmlFor="checkout-building" className="sr-only">Building / Floor</label>
                          <div className={fieldWrap(Boolean(fieldErrors.building))}>
                            <input
                              id="checkout-building"
                              type="text"
                              name="building"
                              value={formData.building}
                              onChange={handleInputChange}
                              placeholder="Building / Floor *"
                              autoComplete="address-line1"
                              required
                              aria-invalid={Boolean(fieldErrors.building)}
                              aria-describedby={fieldErrors.building ? "checkout-building-error" : undefined}
                              className={fieldClass()}
                            />
                          </div>
                          <FieldError id="checkout-building-error" message={fieldErrors.building} />
                        </div>

                        <div>
                          <label htmlFor="checkout-street" className="sr-only">Street</label>
                          <div className={fieldWrap(false)}>
                            <input
                              id="checkout-street"
                              type="text"
                              name="street"
                              value={formData.street}
                              onChange={handleInputChange}
                              placeholder="Street (Recommended)"
                              autoComplete="address-line2"
                              className={fieldClass()}
                            />
                          </div>
                        </div>

                        <AreaPicker
                          areaText={areaText}
                          spot={exactSpot ? { lat: exactSpot.lat, lng: exactSpot.lng } : null}
                          fallbackCenter={lastCoordsRef.current}
                          onPlaceSelected={handlePlaceSelected}
                          onPicked={handleMapPicked}
                          onCleared={handleMapCleared}
                        />

                        {areaHint && (
                          <p className="text-[11px] font-mono text-emerald-700" role="status">
                            ✓ {areaHint}
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label htmlFor="checkout-pincode" className="sr-only">PIN Code</label>
                            <div className={fieldWrap(Boolean(fieldErrors.pincode))}>
                              <input
                                id="checkout-pincode"
                                type="text"
                                name="pincode"
                                maxLength={6}
                                value={formData.pincode}
                                onChange={handleInputChange}
                                placeholder="PIN Code *"
                                autoComplete="postal-code"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                title="Exactly 6 digits"
                                required
                                aria-invalid={Boolean(fieldErrors.pincode)}
                                aria-describedby={fieldErrors.pincode ? "checkout-pincode-error" : undefined}
                                className={fieldClass()}
                              />
                            </div>
                            <FieldError id="checkout-pincode-error" message={fieldErrors.pincode} />
                          </div>
                          <div>
                            <label htmlFor="checkout-city" className="sr-only">City</label>
                            <div className={fieldWrap(Boolean(fieldErrors.city))}>
                              <input
                                id="checkout-city"
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="City *"
                                autoComplete="address-level2"
                                required
                                aria-invalid={Boolean(fieldErrors.city)}
                                aria-describedby={fieldErrors.city ? "checkout-city-error" : undefined}
                                className={fieldClass()}
                              />
                            </div>
                            <FieldError id="checkout-city-error" message={fieldErrors.city} />
                          </div>
                          <div>
                            <label htmlFor="checkout-state" className="sr-only">State</label>
                            <div className={fieldWrap(false)}>
                              <select
                                id="checkout-state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                autoComplete="address-level1"
                                className="w-full cursor-pointer bg-transparent px-0 py-3.5 text-sm text-black outline-none"
                              >
                                {INDIAN_STATES.map((st) => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {etaLabel && (
                          <p className="flex items-center gap-2 text-[11px] font-mono text-emerald-700" role="status">
                            <Truck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            Estimated delivery {etaLabel} · ships within 24–48h
                          </p>
                        )}
                      </div>
                    </div>

                    {addressWarning && (
                      <p className="text-[11px] text-amber-700" role="status">
                        ⚠ {addressWarning}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="checkout-flat mt-2 w-full rounded-none bg-black px-6 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-neutral-800 cursor-pointer disabled:opacity-60"
                    >
                      <span>Continue to payment</span>
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-black/10 pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-xs leading-relaxed text-black/75">
                        <p className="font-semibold text-black">
                          {formData.fullName} <span className="font-normal text-black/45">· {formData.phone}</span>
                        </p>
                        <p className="mt-1">{composeStreetAddress(formData.building, formData.street)}</p>
                        {areaText && (
                          <p className="text-[11px] leading-snug text-black/50">{areaText}</p>
                        )}
                        <p>{formData.city}, {formData.state} — {formData.pincode}</p>
                        {exactSpot && (
                          <p className="mt-1.5 text-[11px] font-mono text-emerald-700">✓ Exact location pinned for the courier</p>
                        )}
                        {etaLabel && (
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-700">
                            <Truck className="w-3 h-3 shrink-0" aria-hidden="true" />
                            Estimated delivery {etaLabel}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-black/45 underline underline-offset-4 transition-colors hover:text-black cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment */}
              {activeStep === 2 && (
                <div className="mt-8 border-t border-black/10 pt-8">
                  <div className="border border-black/10 bg-black/[0.015] p-5">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                      <CreditCard className="w-4 h-4 text-black" aria-hidden="true" />
                      UPI / Cards / NetBanking · Razorpay
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-black/55">
                      Secure payment with Google Pay, PhonePe, Paytm, RuPay cards and NetBanking. Paying by UPI? On mobile
                      you&apos;ll jump straight to your UPI app — approve with your PIN to finish. On desktop, scan the QR
                      with any UPI app. The request expires quickly, so approve it as soon as it appears.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="border border-black/10 bg-white px-2 py-0.5 text-[9px] font-semibold text-black">UPI</span>
                      <span className="border border-black/10 bg-white px-2 py-0.5 text-[9px] font-semibold text-black">GPAY</span>
                      <span className="border border-black/10 bg-white px-2 py-0.5 text-[9px] font-semibold text-black">PHONEPE</span>
                      <span className="border border-black/10 bg-white px-2 py-0.5 text-[9px] font-semibold text-black">CARDS</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-black/55">
                    <span>Total payable</span>
                    <span className="text-sm font-semibold tabular-nums text-black">
                      ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={loading || paymentState === 'initiating' || paymentState === 'verifying'}
                    className="checkout-flat mt-3 flex w-full items-center justify-center gap-2 rounded-none bg-black px-6 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-neutral-800 cursor-pointer disabled:opacity-60"
                  >
                    {(loading || paymentState === 'initiating' || paymentState === 'verifying') && (
                      <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                    )}
                    <span>
                      {paymentState === 'initiating'
                        ? 'Opening payment…'
                        : paymentState === 'verifying'
                        ? 'Verifying payment…'
                        : 'Pay now'}
                    </span>
                  </button>
                  <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.16em] text-black/35">
                    Payments secured by Razorpay
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Order summary — tap the rail to expand items, promo & totals */}
          <div className="mt-10 border-y border-black/10">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              aria-controls="checkout-order-summary"
              className="checkout-flat flex w-full items-center justify-between gap-4 rounded-none py-4 cursor-pointer group"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-black/60 transition-colors group-hover:text-black">
                Order summary ({items.length})
              </span>
              <span className="flex items-center gap-2.5">
                <span className="text-sm font-semibold tabular-nums text-black">
                  ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-black/40 transition-transform duration-200 ${summaryOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            </button>
            {summaryOpen && (
              <div id="checkout-order-summary" className="pb-6">
            
            <div className="flex flex-col gap-5 mb-8 max-h-[380px] overflow-y-auto pr-1">
              {items.map(item => {
                const key = getItemKey(item);
                return (
                  <div key={key} className="flex gap-4 group border-b border-black/10 pb-4 last:border-b-0">
                    <div className="relative w-[64px] h-[78px] bg-[#f5f5f2] border border-black/10 rounded-xs shrink-0 overflow-hidden">
                      <Image
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        fill
                        className={`object-cover ${item.isSoldOut ? "blur-[2px] opacity-60 grayscale" : ""}`}
                      />
                      {item.isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
                          <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-white leading-tight">
                            Sold
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {item.isSoldOut && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-red-600">
                              Somebody bought this · Out of stock
                            </span>
                          </div>
                        )}
                        <h4 className="text-xs font-semibold uppercase tracking-tight text-black">{item.name}</h4>
                        <p className="text-[10px] text-black/50 uppercase tracking-wider mt-0.5">
                          {item.color} | Size: {item.size}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="relative inline-flex items-center" data-remove-tooltip="true">
                          {/* Tooltip pop-up confirmation */}
                          <AnimatePresence>
                            {confirmRemoveKey === key && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.94 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute bottom-full left-0 mb-2 z-40 w-52 rounded-xl bg-white text-black p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-black/15"
                              >
                                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-black leading-snug">
                                  Are you sure you want to remove this?
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-black/10">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmRemoveKey(null);
                                    }}
                                    className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-black/50 hover:text-black transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeItem(key);
                                      setConfirmRemoveKey(null);
                                    }}
                                    className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white rounded transition-colors cursor-pointer active:scale-90 shadow-2xs"
                                  >
                                    Yes, remove
                                  </button>
                                </div>
                                {/* Caret arrow */}
                                <div className="absolute top-full left-3.5 -mt-1 w-2 h-2 bg-white border-r border-b border-black/15 rotate-45" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="inline-flex items-center border border-black/15 rounded-xs bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRemoveKey((prev) => (prev === key ? null : key));
                              }}
                              className="w-5 h-5 flex items-center justify-center hover:bg-black/5 text-black cursor-pointer active:scale-90 transition-transform"
                            >
                              <Minus className="w-2.5 h-2.5" aria-hidden="true" />
                            </button>
                            <span aria-live="polite" className="w-5 text-center font-mono font-bold text-xs text-black select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Max quantity reached (1 of 1 piece)"
                              disabled={true}
                              title="1 of 1 unique piece"
                              className="w-5 h-5 border-l border-black/10 flex items-center justify-center bg-black/[0.03] text-black/25 cursor-not-allowed select-none"
                            >
                              <Plus className="w-2.5 h-2.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-black">₹{(item.price * item.quantity).toFixed(2)}</span>
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="flex items-center justify-between bg-[#f4f4f2] border border-black/10 px-3 py-2 rounded-xl shadow-2xs"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span className="bg-black text-white px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest font-bold">
                      {appliedPromo.code}
                    </span>
                    <span className="text-black/40">·</span>
                    <span className="text-black font-bold">
                      {isFree ? "FREE SHIPPING" : `${(appliedPromo.discount * 100).toFixed(0)}% OFF`}
                    </span>
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { clearPromo(); setPromoInput(""); }}
                    className="text-[10px] font-mono uppercase tracking-wider text-black/50 hover:text-black underline cursor-pointer"
                  >
                    Remove
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  animate={shakePromo ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="space-y-1.5"
                >
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 border border-black/15 focus-within:border-black focus-within:ring-2 focus-within:ring-black/5 focus-within:scale-[1.01] transition-all duration-200 rounded-sm px-3 py-2 bg-white">
                      <Tag className={`w-3.5 h-3.5 transition-colors ${promoInputValue ? "text-black" : "text-black/40"} shrink-0`} />
                      <input
                        type="text"
                        value={promoInputValue}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="PROMO CODE"
                        className="w-full text-xs font-bold uppercase outline-none !bg-transparent tracking-widest placeholder:tracking-wider placeholder:text-black/35 text-black border-0 font-mono"
                      />
                      {promoInputValue && (
                        <motion.span
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="text-[8.5px] font-mono text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold shrink-0 tracking-wider"
                        >
                          READY ↵
                        </motion.span>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => handleApplyPromo(e)}
                      className="btn-bagify btn-bagify-dark text-[10px] uppercase tracking-[0.14em] cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <span>Apply</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
              {promoError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-red-600 font-semibold uppercase tracking-wider mt-1.5"
                >
                  {promoError}
                </motion.p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col gap-2.5 text-xs border-t border-black/10 pt-4">
              {mrpDiscountValue > 0 && (
                <>
                  <div className="flex justify-between items-center text-black/65">
                    <span>MRP Total:</span>
                    <span className="font-semibold text-black">₹{mrpTotalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-black font-semibold">
                    <span>Discount on MRP:</span>
                    <span>−₹{mrpDiscountValue.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-black/65">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-black">₹{subtotal.toFixed(2)}</span>
              </div>
              {setDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-semibold">
                   <span>Set discount:</span>
                  <span>−₹{setDiscount.toFixed(2)}</span>
                </div>
              )}
              {discountAmount > 0 && !isFree && (
                <div className="flex justify-between items-center text-emerald-700 font-semibold">
                  <span>Promo ({appliedPromo!.code}):</span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-black/65">
                <span>Standard Shipping:</span>
                <span className="font-semibold text-black">
                  {isFree ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="line-through text-black/40">₹80.00</span>
                      <span className="text-emerald-700 font-bold">FREE</span>
                    </span>
                  ) : (
                    "₹80.00"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center font-semibold text-sm border-t border-black/10 pt-3 mt-1 text-black">
                <span>To Pay:</span>
                <span className="font-sans font-medium text-base">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <p className="text-[10px] text-black/50 text-center mt-6 tracking-[0.04em]">
               ✦ You will earn {Math.floor(finalTotal / 10)} points with this order.
            </p>
              </div>
            )}
          </div>

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
