"use client";

import { useEffect, useRef } from "react";
import { Printer, X, Copy, Check, Package, ShieldCheck, MapPin, Truck, Phone, Mail } from "lucide-react";
import { useState } from "react";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
};

type ShippingAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  trackingId: string | null;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
};

// Generates stylized SVG barcode pattern based on string
function Barcode({ text }: { text: string }) {
  // Deterministic bar widths based on char codes
  const bars: number[] = [];
  const seed = text.replace(/[^A-Z0-9]/gi, "").toUpperCase() + "BGF";
  for (let i = 0; i < 48; i++) {
    const charCode = seed.charCodeAt(i % seed.length) || 65;
    bars.push(((charCode * (i + 1) * 7) % 4) + 1);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-stretch h-12 gap-[2px] bg-white px-2 py-1">
        {bars.map((w, idx) => (
          <div
            key={idx}
            style={{ width: `${w * 1.5}px` }}
            className={`h-full ${idx % 2 === 0 ? "bg-black" : "bg-transparent"}`}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-black uppercase mt-0.5">
        *{text}*
      </span>
    </div>
  );
}

export default function ShippingLabelModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAddress = () => {
    const fullText = `${order.shippingAddress?.fullName}\nPhone: ${order.shippingAddress?.phone || order.customerPhone}\n${order.shippingAddress?.street}\n${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}\nIndia`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-[#141414] border border-white/15 max-w-2xl w-full text-white shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header (Screen Only) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Shipping Bag Label</h2>
              <p className="text-[10px] text-gray-400">Order #{order.orderNumber} • {order.shippingAddress?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 hover:border-white text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
              title="Copy delivery address to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy Address"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Label (Ctrl+P)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-[#0d0d0d]">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 text-center">
            ✦ Thermal 4x6" &amp; Standard A6/A4 Printer Template Preview
          </p>

          {/* ========================================================================= */}
          {/* THE ACTUAL PRINTABLE SHIPPING LABEL (STICKER READY)                      */}
          {/* ========================================================================= */}
          <div
            id="printable-shipping-label"
            className="w-full max-w-[440px] bg-white text-black font-sans border-2 border-black p-5 shadow-2xl relative select-none leading-tight print:max-w-none print:w-full print:p-4 print:border-2"
          >
            {/* Top Cut/Stick Watermark */}
            <div className="border-b-2 border-dashed border-black/40 pb-2 mb-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-black/60">
              <span>✂ STICK TO PACKAGE / SHIPPING BAG</span>
              <span>INDIA POST SPEED LOGISTICS</span>
            </div>

            {/* 1. Header Bar: Brand + Courier Routing */}
            <div className="border-2 border-black p-2.5 mb-3 flex items-center justify-between bg-black text-white">
              <div>
                <h1 className="font-black text-lg tracking-tight uppercase leading-none">BAGIFYYYY</h1>
                <p className="text-[8px] font-mono tracking-[0.2em] uppercase text-gray-300 mt-0.5">
                  ARCHIVE APPAREL HUB
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase bg-white text-black px-2 py-0.5 border border-black inline-block">
                  {order.shippingAmount > 50 ? "AIR EXPRESS PRIORITY" : "STANDARD SPEED POST"}
                </span>
                <p className="text-[8px] text-gray-300 mt-1 uppercase font-mono">
                  DATE: {orderDate}
                </p>
              </div>
            </div>

            {/* 2. Barcode & Order Number */}
            <div className="border-2 border-black p-2 mb-3 flex flex-col items-center justify-center bg-gray-50">
              <Barcode text={order.trackingId || order.orderNumber} />
              <div className="flex justify-between w-full text-[9px] font-bold uppercase px-1 mt-1 border-t border-black/20 pt-1 text-black/80 font-mono">
                <span>ORDER: #{order.orderNumber}</span>
                <span>ITEMS: {totalItemsCount} PCS</span>
              </div>
            </div>

            {/* 3. SHIP TO (Customer Destination) — HIGH PRIORITY & LARGE */}
            <div className="border-2 border-black p-3 mb-3 bg-white">
              <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5">
                  DELIVER TO (RECIPIENT)
                </span>
                <span className="text-[10px] font-bold uppercase text-black/70">DOMESTIC PARCEL</span>
              </div>

              {/* Recipient Details */}
              <div className="space-y-1">
                <p className="text-base font-black uppercase tracking-tight text-black">
                  {order.shippingAddress?.fullName || "CUSTOMER"}
                </p>

                <p className="text-xs font-bold text-black flex items-center gap-1.5 pt-0.5">
                  <span>📱 TEL:</span>
                  <span className="font-mono text-sm tracking-wider font-black">
                    +91 {order.shippingAddress?.phone || order.customerPhone}
                  </span>
                </p>

                <p className="text-xs font-semibold text-gray-900 leading-snug pt-1">
                  {order.shippingAddress?.street}
                </p>

                <p className="text-xs font-bold uppercase text-black pt-0.5">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
              </div>

              {/* Prominent Pincode Box */}
              <div className="mt-3 pt-2 border-t-2 border-black flex items-center justify-between bg-black/5 p-2 border">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  DESTINATION PINCODE:
                </span>
                <span className="font-mono text-lg font-black tracking-widest text-black bg-white px-2.5 py-0.5 border-2 border-black">
                  {order.shippingAddress?.pincode}
                </span>
              </div>
            </div>

            {/* 4. Payment / COD Status Box */}
            <div className="mb-3">
              {order.paymentMethod === "COD" ? (
                <div className="border-2 border-black bg-black text-white p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest uppercase text-amber-300 block">
                      ⚠ PAYMENT DUE ON DELIVERY
                    </span>
                    <span className="text-base font-black tracking-tight uppercase">
                      CASH ON DELIVERY (COD)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block text-gray-300">COLLECT AMOUNT</span>
                    <span className="text-lg font-black tracking-tight text-amber-300">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-black bg-gray-100 text-black p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest uppercase text-emerald-700 block font-bold">
                      ✓ DIGITAL PAYMENT VERIFIED
                    </span>
                    <span className="text-sm font-black tracking-tight uppercase">
                      PREPAID PARCEL
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block text-gray-600 font-bold">DO NOT COLLECT CASH</span>
                    <span className="text-sm font-black tracking-tight text-emerald-700">
                      PAID (₹{order.totalAmount.toFixed(2)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Item Checklist / Packing Manifest */}
            <div className="border-2 border-black p-2.5 mb-3 bg-white">
              <p className="text-[9px] font-black uppercase tracking-wider border-b border-black pb-1 mb-1.5 text-black">
                PACKAGE CONTENTS ({order.items.length} unique items)
              </p>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between text-[10px]">
                    <div className="flex-1 pr-2 truncate">
                      <span className="font-bold text-black">{item.name}</span>
                      <span className="text-gray-600 ml-1">({item.color} / {item.size})</span>
                    </div>
                    <span className="font-mono font-black text-black shrink-0">QTY: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. SHIP FROM (Sender / Return Address) */}
            <div className="border-2 border-black p-2 text-[9px] bg-gray-50 leading-relaxed text-black/80">
              <span className="font-black uppercase tracking-wider text-black block mb-0.5">
                RETURN TO SENDER IF UNDELIVERED:
              </span>
              <p className="font-bold text-black">BAGIFYYYY ARCHIVE LOGISTICS HUB</p>
              <p>Plot 42, Streetwear Distribution Centre, Lower Parel West</p>
              <p>Mumbai, Maharashtra — 400013 | Support: +91 98765 43210</p>
            </div>

            {/* Bottom Seal & Disclaimer */}
            <div className="mt-2 text-center text-[7.5px] uppercase tracking-widest text-black/50 font-mono">
              VERIFIED AUTHENTIC DROP • BAGIFYYYY STORE APPAREL • GST INVOICE INCLUDED
            </div>
          </div>
          {/* ========================================================================= */}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#141414] border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-gray-400">
            Tip: Compatible with standard 4x6" thermal label printers and regular A4 paper.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Shipping Label
            </button>
          </div>
        </div>

      </div>

      {/* Global CSS for Print Optimization */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-shipping-label,
          #printable-shipping-label * {
            visibility: visible !important;
          }
          #printable-shipping-label {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            border: 2px solid black !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}
