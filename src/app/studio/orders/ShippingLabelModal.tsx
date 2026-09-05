"use client";

import { useEffect, useState } from "react";
import { Printer, X, Copy, Check } from "lucide-react";

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

// Standard Code 39 Optical Barcode Generator (Scannable by 100% of handheld scanners & phones)
const CODE39_MAP: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnnnw', 'D': 'nnnnwwnnw', 'E': 'wnnnwnnnw', 'F': 'nnwnwnnnw',
  'G': 'nnnnnnwnw', 'H': 'wnnnnnwnw', 'I': 'nnwnnnwnw', 'J': 'nnnnwnwnw',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnnw', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
};

function ThermalBarcode({ text }: { text: string }) {
  const clean = text.replace(/[^A-Z0-9\-\.\ \$\/\+\%]/gi, "").toUpperCase();
  const fullString = `*${clean}*`;
  
  // Build SVG bars
  const elements: { isBar: boolean; width: number }[] = [];
  const narrow = 2;
  const wide = 5;

  for (let i = 0; i < fullString.length; i++) {
    const char = fullString[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP['*'];
    
    for (let p = 0; p < pattern.length; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === 'w';
      elements.push({
        isBar,
        width: isWide ? wide : narrow,
      });
    }
    // Inter-character narrow space
    if (i < fullString.length - 1) {
      elements.push({ isBar: false, width: narrow });
    }
  }

  const totalWidth = elements.reduce((acc, el) => acc + el.width, 0);

  return (
    <div className="flex flex-col items-center w-full py-1">
      <svg
        viewBox={`0 0 ${totalWidth} 48`}
        className="w-full max-w-[340px] h-12"
        style={{ shapeRendering: "crispEdges" }}
      >
        {(() => {
          let currentX = 0;
          return elements.map((el, idx) => {
            const x = currentX;
            currentX += el.width;
            if (!el.isBar) return null;
            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={el.width}
                height={48}
                fill="#000000"
              />
            );
          });
        })()}
      </svg>
      <span className="font-mono text-[11px] font-black tracking-[0.25em] text-black uppercase mt-1">
        *{clean}*
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      {/* Container */}
      <div className="bg-white border border-y2k-gunmetal/10 max-w-2xl w-full text-y2k-gunmetal shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Modal Top Header (Screen Only) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-y2k-gunmetal/15 shrink-0 bg-y2k-ice print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center font-bold">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">Thermal Shipping Sticker</h2>
              <p className="text-[10px] text-y2k-gunmetal/60">Order #{order.orderNumber} • Standard 100% Black &amp; White Sticker Format</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-y2k-gunmetal/10 hover:bg-y2k-gunmetal hover:text-white text-y2k-gunmetal text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              title="Copy delivery address to clipboard"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy Address"}
            </button>
            <button
              onClick={handlePrint}
              className="btn-bagify px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Sticker (Ctrl+P)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-y2k-gunmetal/60 hover:text-black transition-colors ml-1 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-[#0a0a0a]">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-4 text-center font-mono">
            ✦ HIGH-CONTRAST THERMAL / 4x6&quot; / A6 SHIPPING BAG STICKER
          </p>

          {/* ========================================================================= */}
          {/* 100% PURE BLACK & WHITE HIGH-CONTRAST THERMAL SHIPPING LABEL              */}
          {/* ========================================================================= */}
          <div
            id="printable-shipping-label"
            className="w-full max-w-[450px] bg-white text-black font-sans border-3 border-black p-4 shadow-2xl relative select-none leading-tight print:max-w-none print:w-full print:p-2 print:border-3"
          >
            {/* Cut / Stick Guide */}
            <div className="border-b-2 border-dashed border-black pb-1.5 mb-2.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-black">
              <span>✂ STICK TO PACKAGE / SHIPPING BAG</span>
              <span>INDIA POST SPEED LOGISTICS</span>
            </div>

            {/* 1. Header Bar: Brand + Service Level */}
            <div className="border-2 border-black p-2.5 mb-2.5 flex items-center justify-between bg-black text-white">
              <div>
                <h1 className="font-black text-xl tracking-tight uppercase leading-none text-white">
                  BAGIFYYYY
                </h1>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-white mt-0.5">
                  APPAREL LOGISTICS
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase bg-white text-black px-2 py-0.5 border border-black inline-block">
                  {order.shippingAmount > 50 ? "AIR EXPRESS PRIORITY" : "STANDARD SPEED POST"}
                </span>
                <p className="text-[9px] text-white mt-1 uppercase font-mono font-bold">
                  DATE: {orderDate}
                </p>
              </div>
            </div>

            {/* 2. Barcode & Order Number Block */}
            <div className="border-2 border-black p-2 mb-2.5 flex flex-col items-center justify-center bg-white">
              <ThermalBarcode text={order.trackingId || order.orderNumber} />
              <div className="flex justify-between w-full text-[10px] font-black uppercase px-2 mt-1 border-t-2 border-black pt-1 text-black font-mono">
                <span>ORDER: #{order.orderNumber}</span>
                <span>TOTAL ITEMS: {totalItemsCount} PCS</span>
              </div>
            </div>

            {/* 3. SHIP TO (Recipient / Customer Destination) — HIGH READABILITY */}
            <div className="border-3 border-black p-3 mb-2.5 bg-white">
              <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-black text-white px-2.5 py-0.5">
                  SHIP TO (RECIPIENT)
                </span>
                <span className="text-[10px] font-black uppercase text-black">DOMESTIC PARCEL</span>
              </div>

              {/* Recipient Details in Bold Large Crisp Typography */}
              <div className="space-y-1.5">
                <p className="text-lg font-black uppercase tracking-tight text-black leading-none">
                  {order.shippingAddress?.fullName || "CUSTOMER"}
                </p>

                <p className="text-sm font-black text-black flex items-center gap-1.5 pt-0.5">
                  <span className="bg-black text-white px-1.5 py-0.2 text-[10px] font-bold">PHONE</span>
                  <span className="font-mono text-base tracking-wider font-black">
                    +91 {order.shippingAddress?.phone || order.customerPhone}
                  </span>
                </p>

                <p className="text-xs font-bold text-black uppercase leading-snug pt-0.5">
                  {order.shippingAddress?.street}
                </p>

                <p className="text-xs font-black uppercase text-black">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
              </div>

              {/* High-Visibility Destination Pincode Box */}
              <div className="mt-2.5 pt-2 border-t-2 border-black flex items-center justify-between bg-white">
                <span className="text-[11px] font-black uppercase tracking-wider text-black">
                  DESTINATION PINCODE:
                </span>
                <span className="font-mono text-2xl font-black tracking-wider text-black bg-white px-3 py-0.5 border-3 border-black">
                  {order.shippingAddress?.pincode}
                </span>
              </div>
            </div>

            {/* 4. Payment / COD Status Box — High Contrast Black & White */}
            <div className="mb-2.5">
              {order.paymentMethod === "COD" ? (
                <div className="border-3 border-black bg-black text-white p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider uppercase text-white font-bold block">
                      ⚠ PAYMENT DUE ON DELIVERY
                    </span>
                    <span className="text-base font-black tracking-tight uppercase text-white">
                      CASH ON DELIVERY (COD)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block text-white font-bold">COLLECT CASH</span>
                    <span className="font-bold text-xl font-black tracking-tight text-white bg-black px-1.5 border border-white inline-block">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-3 border-black bg-white text-black p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider uppercase text-black font-black block">
                      ✓ DIGITAL PAYMENT VERIFIED
                    </span>
                    <span className="text-sm font-black tracking-tight uppercase text-black">
                      PREPAID PARCEL
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block text-black font-bold">DO NOT COLLECT CASH</span>
                    <span className="font-bold text-sm font-black tracking-tight text-black bg-black text-white px-2 py-0.5 inline-block">
                      PAID IN FULL (₹{order.totalAmount.toFixed(2)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Package Manifest / Content Checklist */}
            <div className="border-2 border-black p-2 mb-2.5 bg-white">
              <div className="flex justify-between border-b-2 border-black pb-1 mb-1 text-[10px] font-black uppercase text-black">
                <span>ITEM DETAILS ({order.items.length} UNIQUE)</span>
                <span>QTY</span>
              </div>
              <div className="divide-y divide-black/30">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between text-[10px]">
                    <div className="flex-1 pr-2 truncate">
                      <span className="font-black text-black uppercase">{item.name}</span>
                      <span className="text-black font-bold ml-1.5">[{item.color} | Size: {item.size}]</span>
                    </div>
                    <span className="font-mono font-black text-black text-xs shrink-0">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. RETURN TO SENDER (SHIP FROM) — Updated to Nilfa's Phagwara Hub Address */}
            <div className="border-2 border-black p-2.5 text-[9.5px] bg-white leading-tight text-black">
              <div className="flex items-center justify-between border-b border-black pb-1 mb-1">
                <span className="font-black uppercase tracking-wider text-black">
                  RETURN TO SENDER IF UNDELIVERED:
                </span>
                <span className="font-mono text-[9px] font-black">PIN: 144411</span>
              </div>
              <p className="font-black text-xs uppercase text-black">BAGIFYYYY</p>
              <p className="font-bold text-black uppercase">
                Lakshmi Niwas, Bhutani&apos;s Colony, near Freshmart, Green Valley
              </p>
              <p className="font-bold text-black uppercase">
                Phagwara, Punjab — 144411, India
              </p>
              <p className="font-mono font-bold text-[9px] text-black pt-0.5">
                TEL: +91 8848080388 | EMAIL: support@bagifyyyy.com
              </p>
            </div>

            {/* Bottom Footer Code */}
            <div className="mt-1.5 text-center text-[8px] uppercase tracking-wider text-black font-mono font-bold">
              BAGIFYYYY • OFFICIAL DISPATCH • VERIFIED PACKAGE
            </div>
          </div>
          {/* ========================================================================= */}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#181818] border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-gray-400">
            ✓ 100% Black &amp; White. Optimized for thermal printers (4x6&quot;, A6) and laser/inkjet A4.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-md cursor-pointer"
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
            padding: 8mm !important;
            border: 3px solid black !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 3mm;
          }
        }
      `}</style>
    </div>
  );
}
