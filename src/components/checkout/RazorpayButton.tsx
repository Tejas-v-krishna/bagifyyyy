"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayButtonProps {
  amount?: number; // In paise or rupees depending on useAmountInRupees
  amountInRupees?: boolean;
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  image?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  notes?: Record<string, string>;
  themeColor?: string;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
  createOrderEndpoint?: string;
  verifyEndpoint?: string;
}

export const loadRazorpayScript = (): Promise<boolean> => {
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

export default function RazorpayButton({
  amount = 100, // 100 paise default
  amountInRupees = false,
  currency = "INR",
  receipt,
  name = "BAGIFYYYY",
  description = "Secure Checkout",
  image = "/favicon.ico",
  customer,
  notes,
  themeColor = "#232D3B",
  className = "btn-bagify text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2",
  children,
  onSuccess,
  onFailure,
  onDismiss,
  createOrderEndpoint = "/api/payment/razorpay/create-order",
  verifyEndpoint = "/api/payment/razorpay/verify",
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      // 1. Ensure Razorpay checkout.js script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      // Calculate amount in paise (minimum 100 paise = ₹1)
      const amountInPaise = amountInRupees ? Math.round(amount * 100) : Math.round(amount);

      // 2. Call backend endpoint to create order
      const orderRes = await fetch(createOrderEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order_id && !orderData.id) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      const orderId = orderData.order_id || orderData.id;
      const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: orderData.amount || amountInPaise,
        currency: orderData.currency || currency,
        name: name,
        description: description,
        image: image,
        order_id: orderId,
        prefill: {
          name: customer?.name || "",
          email: customer?.email || "",
          contact: customer?.phone || "",
        },
        notes: notes || {},
        theme: {
          color: themeColor,
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (onDismiss) onDismiss();
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Send payment signature to backend verification endpoint
            if (verifyEndpoint) {
              const verifyRes = await fetch(verifyEndpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed");
              }
            }

            if (onSuccess) {
              onSuccess(response);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMessage(err.message || "Payment verification failed");
            if (onFailure) onFailure(err);
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        const errorDesc = response.error?.description || "Payment failed";
        setErrorMessage(errorDesc);
        setLoading(false);
        if (onFailure) onFailure(response.error);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout");
      setLoading(false);
      if (onFailure) onFailure(err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={className}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children || (loading ? "PROCESSING..." : "PAY WITH RAZORPAY")}
      </button>

      {errorMessage && (
        <p className="text-red-600 text-xs font-semibold mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
