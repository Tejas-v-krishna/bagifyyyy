"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  Printer,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import ShippingLabelModal from "./ShippingLabelModal";
import { AWAITING_PAYMENT, ORDER_STATUSES, countsAsRevenue, orderStatusLabel } from "@/lib/orderStatus";
import MessageCustomerModal from "./MessageCustomerModal";
import Image from "next/image";

type OrderItem = {
  id: string;
  sku: string | null;
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
  /** Exact delivery pin dropped on the checkout map, when the shopper set one. */
  lat?: number | null;
  lng?: number | null;
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

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
const FILTER_TABS = ["ALL", ...ORDER_STATUSES];
const passthroughLoader = ({ src }: { src: string }) => src;

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [messagingOrder, setMessagingOrder] = useState<Order | null>(null);

  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [statusSelects, setStatusSelects] = useState<Record<string, string>>({});
  const [paymentSelects, setPaymentSelects] = useState<Record<string, string>>({});
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    const all: Order[] = [];
    let skip = 0;
    const take = 200;
    try {
      // The API is paginated (default 100). Walk every page so the KPI cards
      // and the fulfilment queue show the real store totals instead of only
      // the newest page.
      while (true) {
        const res = await fetch(`/api/studio/orders?take=${take}&skip=${skip}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          setUnauthorized(true);
          setOrders([]);
          return;
        }
        const data = await res.json();
        const batch: Order[] = Array.isArray(data.orders) ? data.orders : [];
        all.push(...batch);
        if (batch.length < take) break;
        skip += take;
      }
      setOrders(all);
      const tracking: Record<string, string> = {};
      const statuses: Record<string, string> = {};
      const payments: Record<string, string> = {};
      const phones: Record<string, string> = {};
      const emails: Record<string, string> = {};

      all.forEach((o) => {
        tracking[o.id] = o.trackingId || "";
        statuses[o.id] = o.orderStatus;
        payments[o.id] = o.paymentStatus || "PENDING";
        phones[o.id] = o.customerPhone || "";
        emails[o.id] = o.customerEmail || "";
      });

      setTrackingInputs(tracking);
      setStatusSelects(statuses);
      setPaymentSelects(payments);
      setPhoneInputs(phones);
      setEmailInputs(emails);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadOrders() {
      await fetchOrders();
    }
    loadOrders();
  }, [fetchOrders]);

  const handleSaveOrder = async (orderId: string) => {
    setSaving(orderId);
    try {
      const res = await fetch(`/api/studio/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: statusSelects[orderId],
          paymentStatus: paymentSelects[orderId],
          trackingId: trackingInputs[orderId] || null,
          customerPhone: phoneInputs[orderId] || undefined,
          customerEmail: emailInputs[orderId] || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  orderStatus: statusSelects[orderId],
                  paymentStatus: paymentSelects[orderId],
                  trackingId: trackingInputs[orderId] || null,
                  customerPhone: phoneInputs[orderId] || o.customerPhone,
                  customerEmail: emailInputs[orderId] || o.customerEmail,
                }
              : o
          )
        );
        showToast(`Order #${data.order?.orderNumber || "updated"} saved successfully.`);
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    setDeletingId(order.id);
    try {
      const res = await fetch(`/api/studio/orders/${order.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        setDeleteConfirmOrder(null);
        showToast(`Order #${order.orderNumber} has been permanently deleted.`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete order.");
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Network error. Could not delete order.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalRevenue = orders
    .filter(countsAsRevenue)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const activeProcessing = orders.filter((o) => o.orderStatus === "PROCESSING").length;
  const inTransit = orders.filter((o) => o.orderStatus === "SHIPPED").length;

  const filtered = orders.filter((o) => {
    const matchesTab = filterTab === "ALL" || o.orderStatus === filterTab;
    const q = search.toLowerCase().trim();
    if (!q) return matchesTab;

    const matchOrderNum = o.orderNumber?.toLowerCase().includes(q);
    const matchEmail = o.customerEmail?.toLowerCase().includes(q);
    const matchPhone = o.customerPhone?.toLowerCase().includes(q);
    const matchTracking = (o.trackingId || "").toLowerCase().includes(q);
    const matchName = (o.shippingAddress?.fullName || "").toLowerCase().includes(q);
    const matchCity = (o.shippingAddress?.city || "").toLowerCase().includes(q);
    const matchState = (o.shippingAddress?.state || "").toLowerCase().includes(q);
    const matchPincode = (o.shippingAddress?.pincode || "").toLowerCase().includes(q);
    const matchItems = o.items?.some(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q)
    );

    return (
      matchesTab &&
      (matchOrderNum ||
        matchEmail ||
        matchPhone ||
        matchTracking ||
        matchName ||
        matchCity ||
        matchState ||
        matchPincode ||
        matchItems)
    );
  });

  if (unauthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <div className="editorial-panel bg-white border border-black/15 p-8 max-w-md w-full text-center text-black">
          <ShieldCheck className="w-10 h-10 text-black mx-auto mb-4" />
          <h2 className="font-display font-medium text-lg uppercase tracking-tight mb-2">
            Studio Authentication Required
          </h2>
          <p className="text-xs text-black/70 mb-6">
            Please sign in to access order management and customer details.
          </p>
          <a
            href="/studio/login?from=/studio/orders"
            className="btn-bagify inline-block w-full py-3 text-xs font-bold uppercase tracking-wider shadow-sm"
          >
            Sign In to Studio →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/15 gap-3">
        <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-black">
          Orders Management
        </h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white border border-black/10 px-4 py-2.5 hover:bg-black hover:text-white transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white border border-black/10 p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-black/50 block mb-1">
            Total Orders
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-black">{orders.length}</span>
        </div>
        <div className="bg-white border border-black/10 p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
            Processing
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-amber-800">{activeProcessing}</span>
        </div>
        <div className="bg-white border border-black/10 p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
            Shipped
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-blue-800">{inTransit}</span>
        </div>
        <div className="bg-white border border-black/10 p-3 sm:p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Revenue
          </span>
          <span className="font-display text-xl sm:text-2xl font-bold text-emerald-800">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ── Filter Tabs & Search Row ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black/60 hover:text-black"
              }`}
            >
              {tab === "ALL"
                ? `All (${orders.length})`
                : `${orderStatusLabel(tab)} (${orders.filter((o) => o.orderStatus === tab).length})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, tracking, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-black/10 pl-9 pr-4 py-2 text-xs text-black outline-none focus:border-black font-medium placeholder:text-black/40 shadow-2xs"
          />
        </div>
      </div>

      {/* ── Orders Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-black/15 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[10px] font-bold uppercase tracking-wider text-black/50 animate-pulse">
            Fetching order records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-black/50 text-xs font-bold uppercase tracking-wider">
            No matching orders found.
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {filtered.map((order) => {
              const isExpanded = expandedId === order.id;

              return (
                <div key={order.id} className="transition-colors">
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-3 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-[#f5f5f2] transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-12 h-14 sm:w-10 sm:h-12 bg-[#f5f5f2] border border-black/15 rounded-lg shrink-0 overflow-hidden relative">
                        <Image
                          src={order.items?.[0]?.image || "/placeholder.jpg"}
                          alt={order.items?.[0]?.name || "Item"}
                          fill
                          loader={passthroughLoader}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-black">#{order.orderNumber}</span>
                          <span className="text-[8px] font-bold uppercase px-2 py-0.5 border border-black/10 bg-[#f5f5f2] text-black">
                            {order.paymentMethod === "MANUAL"
                              ? "IG • UPI"
                              : order.paymentMethod === "COD"
                                ? "COD"
                                : order.paymentMethod}
                          </span>
                          <span
                            className={`text-[8px] font-bold uppercase px-2 py-0.5 border ${
                              order.paymentStatus === "PAID"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : order.paymentStatus === "FAILED"
                                  ? "border-red-300 bg-red-50 text-red-800"
                                  : "border-amber-300 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        <p className="text-xs text-black/80 font-medium truncate mt-0.5">
                          {order.shippingAddress?.fullName || order.customerEmail} ({order.customerPhone})
                        </p>
                        <p className="text-[10px] text-black/50 font-mono mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end shrink-0">
                      <div className="text-right">
                        <p className="font-bold font-display font-medium text-base text-black">
                          ₹{order.totalAmount?.toLocaleString("en-IN")}
                        </p>
                        <span
                          className={`text-[8px] font-bold uppercase px-2.5 py-0.5 border block mt-0.5 ${
                            order.orderStatus === AWAITING_PAYMENT
                              ? "border-red-300 bg-red-50 text-red-700"
                              : order.orderStatus === "DELIVERED"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-black/10 bg-[#f5f5f2] text-black"
                          }`}
                        >
                          {orderStatusLabel(order.orderStatus)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintingOrder(order);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/10 hover:bg-black hover:text-white text-black text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                          title="Print Thermal Shipping Sticker"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Label</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessagingOrder(order);
                          }}
                          className="p-1.5 text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                          title="Message customer"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmOrder(order);
                          }}
                          className="p-1.5 text-red-500/70 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <ChevronDown
                          className={`w-5 h-5 text-black/50 transition-transform ${
                            isExpanded ? "rotate-180 text-black" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="bg-[#f5f5f2] border-t border-black/10 p-3 sm:p-6 space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Delivery Address & Customer Details */}
                        <div className="bg-white border border-black/15 p-4 shadow-2xs space-y-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/50 block mb-1">
                              DELIVERY DESTINATION
                            </span>
                            <p className="text-xs font-bold text-black mb-0.5">
                              {order.shippingAddress?.fullName}
                            </p>
                            <p className="text-xs text-black/80 leading-relaxed font-sans">
                              {order.shippingAddress?.street}<br />
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                            </p>
                            {order.shippingAddress?.lat != null && order.shippingAddress?.lng != null && (
                              <a
                                href={`https://maps.google.com/?q=${order.shippingAddress.lat},${order.shippingAddress.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black underline underline-offset-2 hover:opacity-70"
                              >
                                📍 View exact spot on map
                              </a>
                            )}
                          </div>

                          <div className="pt-2 border-t border-black/10 space-y-1.5">
                            <div>
                              <label className="text-[8.5px] font-bold uppercase tracking-wider text-black/50 block">
                                Phone
                              </label>
                              <input
                                type="text"
                                value={phoneInputs[order.id] ?? ""}
                                onChange={(e) =>
                                  setPhoneInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className="w-full bg-[#f5f5f2] border border-black/10 px-2 py-1 text-xs font-mono text-black outline-none focus:border-black"
                              />
                            </div>
                            <div>
                              <label className="text-[8.5px] font-bold uppercase tracking-wider text-black/50 block">
                                Email
                              </label>
                              <input
                                type="email"
                                value={emailInputs[order.id] ?? ""}
                                onChange={(e) =>
                                  setEmailInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className="w-full bg-[#f5f5f2] border border-black/10 px-2 py-1 text-xs text-black outline-none focus:border-black"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="bg-white border border-black/15 p-4 md:col-span-2 shadow-2xs flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/50 block mb-3">
                              ORDERED ITEMS ({order.items?.length || 0})
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {order.items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-xs py-1.5 border-b border-black/5 last:border-b-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-10 bg-[#f5f5f2] border border-black/10 rounded-lg shrink-0 relative overflow-hidden">
                                      <Image
                                        src={item.image || "/placeholder.jpg"}
                                        alt={item.name}
                                        fill
                                        loader={passthroughLoader}
                                        unoptimized
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-bold text-black">{item.name}</p>
                                      {item.sku && (
                                        <p className="text-[9px] font-mono font-bold text-black/60">
                                          {item.sku}
                                        </p>
                                      )}
                                      <p className="text-[9px] uppercase tracking-wider text-black/50">
                                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-black font-mono">
                                    ₹{item.price * item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-medium text-black/70">
                            <span>Shipping ₹{order.shippingAmount} · Discount ₹{order.discountAmount}</span>
                            <span className="font-bold font-mono text-sm text-black">
                              Total ₹{order.totalAmount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Update & Management Controls */}
                      <div className="bg-white border border-black/15 p-5 shadow-2xs flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                          {/* Order Status Select */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-black/50">
                              Fulfillment Status
                            </label>
                            <select
                              value={statusSelects[order.id] || order.orderStatus}
                              onChange={(e) =>
                                setStatusSelects((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              className="bg-[#f5f5f2] border border-black/10 px-3 py-2 text-xs font-bold uppercase text-black outline-none focus:border-black cursor-pointer"
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {orderStatusLabel(status).toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Payment Status Select */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-black/50">
                              Payment Status
                            </label>
                            <select
                              value={paymentSelects[order.id] || order.paymentStatus}
                              onChange={(e) =>
                                setPaymentSelects((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              className="bg-[#f5f5f2] border border-black/10 px-3 py-2 text-xs font-bold uppercase text-black outline-none focus:border-black cursor-pointer"
                            >
                              {PAYMENT_STATUSES.map((ps) => (
                                <option key={ps} value={ps}>
                                  {ps}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tracking ID Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-black/50">
                              Tracking ID / India Post
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. IN9827401928"
                              value={trackingInputs[order.id] ?? ""}
                              onChange={(e) =>
                                setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              className="bg-[#f5f5f2] border border-black/10 px-3 py-2 text-xs font-mono uppercase text-black outline-none focus:border-black"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOrder(order)}
                            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Order</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveOrder(order.id)}
                            disabled={saving === order.id}
                            className="btn-bagify w-full sm:w-auto justify-center px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                          >
                            {saving === order.id ? "Saving…" : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="editorial-panel bg-white border border-black/20 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-medium text-lg uppercase text-black">
                  Permanently Delete Order #{deleteConfirmOrder.orderNumber}?
                </h3>
                <p className="text-xs text-black/70 mt-1 leading-relaxed">
                  This will permanently erase this order record and its items (₹
                  {deleteConfirmOrder.totalAmount.toLocaleString("en-IN")}) from the database. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-black/70 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmOrder.id}
                onClick={() => handleDeleteOrder(deleteConfirmOrder)}
                className="bg-red-600 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {deletingId === deleteConfirmOrder.id ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Thermal Print Modal ─────────────────────────────────────────────── */}
      {printingOrder && (
        <ShippingLabelModal order={printingOrder} onClose={() => setPrintingOrder(null)} />
      )}

      {/* ── Customer Message Modal ───────────────────────────────────────────── */}
      {messagingOrder && (
        <MessageCustomerModal order={messagingOrder} onClose={() => setMessagingOrder(null)} />
      )}
    </div>
  );
}

