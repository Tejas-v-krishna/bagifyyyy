"use client";

export const dynamic = "force-dynamic";

import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Truck, Package, ShieldCheck } from "lucide-react";
import Image from "next/image";

function SuccessContent() {
  const { clearCart } = useCartStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) {
            setOrder(data.order);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, clearCart]);

  const earnedPoints = order ? Math.floor(order.totalAmount / 10) : 150;

  return (
    <div className="bg-y2k-ice min-h-screen py-16 text-y2k-gunmetal font-sans">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        
        {/* Header Confirmation Box */}
        <div className="bg-white border border-y2k-gunmetal/15 p-8 sm:p-12 text-center mb-8 shadow-xs">
          <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tighter mb-3">
            {order?.paymentMethod === 'COD' ? 'ORDER PLACED (COD) ✦' : 'PAYMENT SUCCESSFUL ✦'}
          </h1>
          <p className="text-sm text-y2k-gunmetal/70 max-w-md mx-auto mb-6">
            {order?.paymentMethod === 'COD' 
              ? 'Thank you for your order! Your Cash on Delivery order is confirmed and currently being prepared for dispatch.'
              : 'Thank you for your purchase. Your payment was verified securely via Razorpay.'}
          </p>

          <div className="inline-flex items-center gap-2 bg-y2k-ice border border-y2k-gunmetal/20 px-4 py-2 text-xs font-bold uppercase tracking-widest mb-2">
            <span>Order #{order?.orderNumber || 'BGF-CONFIRMED'}</span>
            <span className="text-gray-400">|</span>
            <span className="text-green-700">{order?.paymentStatus === 'PAID' ? 'PAID' : 'COD PENDING'}</span>
          </div>

          <div className="mt-4 text-xs font-bold text-amber-800 uppercase tracking-wider">
            ✦ +{earnedPoints} Chrome Points Credited to Your Account!
          </div>
        </div>

        {/* Order Details & Summary Card */}
        {order && (
          <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 mb-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-y2k-gunmetal/15 pb-4">
              <h3 className="font-display text-lg uppercase tracking-tight flex items-center gap-2">
                <Package className="w-4 h-4" /> Ordered Items ({order.items?.length || 0})
              </h3>
              <span className="text-xs text-y2k-gunmetal/60">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center justify-between border-b border-y2k-gunmetal/10 pb-3 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-14 bg-gray-100 shrink-0">
                      <Image src={item.image || '/placeholder.jpg'} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">{item.name}</h4>
                      <p className="text-[10px] text-y2k-gunmetal/60 uppercase">Qty: {item.quantity} | Size: {item.size} | {item.color}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Delivery Info */}
            {order.shippingAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-y2k-ice/40 p-4 border border-y2k-gunmetal/10 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-y2k-gunmetal/60 mb-1">Delivery Address</p>
                  <p className="font-semibold">{order.shippingAddress.fullName}</p>
                  <p className="text-y2k-gunmetal/75">{order.shippingAddress.street}</p>
                  <p className="text-y2k-gunmetal/75">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  <p className="text-y2k-gunmetal/75">Phone: +91 {order.customerPhone}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-y2k-gunmetal/60 mb-1">Logistics & Tracking</p>
                  <p className="font-semibold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> India Post Speed Delivery</p>
                  <p className="text-y2k-gunmetal/75 mt-1">Status: <b>Processing at Hub</b></p>
                  <p className="text-y2k-gunmetal/75">Estimated Delivery: <b>3-5 business days</b></p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-y2k-gunmetal/15 pt-4 flex justify-between items-center text-sm font-bold">
              <span>Total Paid:</span>
              <span className="text-base">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/account" 
            className="flex-1 btn-bagify text-white py-4 text-xs font-bold uppercase tracking-widest text-center hover:opacity-90 transition-opacity"
          >
            VIEW IN MY ACCOUNT →
          </Link>
          <Link 
            href="/products" 
            className="flex-1 bg-white border border-y2k-gunmetal text-y2k-gunmetal py-4 text-xs font-bold uppercase tracking-widest text-center hover:bg-gray-50 transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="bg-y2k-ice min-h-[70vh] flex items-center justify-center text-xs font-bold uppercase tracking-widest">Loading Order Receipt...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
