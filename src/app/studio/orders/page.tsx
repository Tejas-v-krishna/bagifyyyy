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
import { AWAITING_PAYMENT, ORDER_STATUSES, orderStatusLabel } from "@/lib/orderStatus";
import Image from "next/image";

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
    try {
      const res = await fetch("/api/studio/orders");
      if (res.status === 401) {
        setUnauthorized(true);
        setOrders([]);
        return;
      }
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        const tracking: Record<string, string> = {};
        const statuses: Record<string, string> = {};
        const payments: Record<string, string> = {};
        const phones: Record<string, string> = {};
        const emails: Record<string, string> = {};

        data.orders.forEach((o: Order) => {
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
      } else if (data.error === "Unauthorized") {
        setUnauthorized(true);
      }
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
    .filter((o) => o.paymentStatus === "PAID" || o.orderStatus === "DELIVERED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

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
    const matchItems = o.items?.some((item) => item.name?.toLowerCase().includes(q));

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
        <div className="editorial-panel bg-white border border-y2k-gunmetal/15 p-8 max-w-md w-full text-center text-y2k-gunmetal">
          <ShieldCheck className="w-10 h-10 text-y2k-gunmetal mx-auto mb-4" />
          <h2 className="font-display font-medium text-lg uppercase tracking-tight mb-2">
            Studio Authentication Required
          </h2>
          <p className="text-xs text-y2k-gunmetal/70 mb-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-y2k-gunmetal/15 gap-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            FULFILLMENT &amp; LOGISTICS
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            ORDERS MANAGEMENT
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            Manage customer orders, update tracking barcodes, print thermal labels, and remove archived test orders.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white border border-y2k-gunmetal/10 px-4 py-2.5 hover:bg-y2k-gunmetal hover:text-white transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-y2k-gunmetal/10 p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1">
            TOTAL ORDERS
          </span>
          <span className="font-display text-2xl font-bold text-y2k-gunmetal">{orders.length}</span>
        </div>
        <div className="bg-white border border-y2k-gunmetal/10 p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
            TO PACK (PROCESSING)
          </span>
          <span className="font-display text-2xl font-bold text-amber-800">{activeProcessing}</span>
        </div>
        <div className="bg-white border border-y2k-gunmetal/10 p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
            IN TRANSIT (SHIPPED)
          </span>
          <span className="font-display text-2xl font-bold text-blue-800">{inTransit}</span>
        </div>
        <div className="bg-white border border-y2k-gunmetal/10 p-4 shadow-2xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            SETTLED REVENUE
          </span>
          <span className="font-display text-2xl font-bold text-emerald-800">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ── Filter Tabs & Search Row ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-y2k-gunmetal/15 pb-0 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab
                  ? "border-y2k-gunmetal text-y2k-gunmetal bg-white"
                  : "border-transparent text-y2k-gunmetal/60 hover:text-black hover:bg-white/50"
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
          <Search className="w-4 h-4 text-y2k-gunmetal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, tracking, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-y2k-gunmetal/10 pl-9 pr-4 py-2 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium placeholder:text-y2k-gunmetal/40 shadow-2xs"
          />
        </div>
      </div>

      {/* ── Orders Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-y2k-gunmetal/15 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[10px] font-bold uppercase tracking-wider text-y2k-slate animate-pulse">
            Fetching order records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-y2k-gunmetal/50 text-xs font-bold uppercase tracking-wider">
            No matching orders found.
          </div>
        ) : (
          <div className="divide-y divide-y2k-gunmetal/10">
            {filtered.map((order) => {
              const isExpanded = expandedId === order.id;

              return (
                <div key={order.id} className="transition-colors">
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-y2k-ice/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-12 bg-y2k-ice border border-y2k-gunmetal/15 shrink-0 overflow-hidden relative">
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
                          <span className="font-mono text-sm font-bold text-y2k-gunmetal">#{order.orderNumber}</span>
                          <span className="text-[8px] font-bold uppercase px-2 py-0.5 border border-y2k-gunmetal/10 bg-y2k-ice text-y2k-gunmetal">
                            {order.paymentMethod === "COD" ? "COD" : order.paymentMethod}
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
                        <p className="text-xs text-y2k-gunmetal/80 font-medium truncate mt-0.5">
                          {order.shippingAddress?.fullName || order.customerEmail} ({order.customerPhone})
                        </p>
                        <p className="text-[10px] text-y2k-slate font-mono mt-0.5">
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
                        <p className="font-bold font-display font-medium text-base text-y2k-gunmetal">
                          ₹{order.totalAmount?.toLocaleString("en-IN")}
                        </p>
                        <span
                          className={`text-[8px] font-bold uppercase px-2.5 py-0.5 border block mt-0.5 ${
                            order.orderStatus === AWAITING_PAYMENT
                              ? "border-red-300 bg-red-50 text-red-700"
                              : order.orderStatus === "DELIVERED"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-y2k-gunmetal/10 bg-y2k-ice text-y2k-gunmetal"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-y2k-gunmetal/10 hover:bg-y2k-gunmetal hover:text-white text-y2k-gunmetal text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                          title="Print Thermal Shipping Sticker"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Label</span>
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
                          className={`w-5 h-5 text-y2k-slate transition-transform ${
                            isExpanded ? "rotate-180 text-y2k-gunmetal" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="bg-y2k-ice/50 border-t border-y2k-gunmetal/10 p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Delivery Address & Customer Details */}
                        <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-2xs space-y-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
                              DELIVERY DESTINATION
                            </span>
                            <p className="text-xs font-bold text-y2k-gunmetal mb-0.5">
                              {order.shippingAddress?.fullName}
                            </p>
                            <p className="text-xs text-y2k-gunmetal/80 leading-relaxed font-sans">
                              {order.shippingAddress?.street}<br />
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-y2k-gunmetal/10 space-y-1.5">
                            <div>
                              <label className="text-[8.5px] font-bold uppercase tracking-wider text-y2k-slate block">
                                Phone
                              </label>
                              <input
                                type="text"
                                value={phoneInputs[order.id] ?? ""}
                                onChange={(e) =>
                                  setPhoneInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-1 text-xs font-mono text-y2k-gunmetal outline-none focus:border-y2k-gunmetal"
                              />
                            </div>
                            <div>
                              <label className="text-[8.5px] font-bold uppercase tracking-wider text-y2k-slate block">
                                Email
                              </label>
                              <input
                                type="email"
                                value={emailInputs[order.id] ?? ""}
                                onChange={(e) =>
                                  setEmailInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-1 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="bg-white border border-y2k-gunmetal/15 p-4 md:col-span-2 shadow-2xs flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-3">
                              ORDERED ITEMS ({order.items?.length || 0})
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {order.items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-xs py-1.5 border-b border-y2k-gunmetal/5 last:border-b-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-10 bg-y2k-ice border border-y2k-gunmetal/10 shrink-0 relative overflow-hidden">
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
                                      <p className="font-bold text-y2k-gunmetal">{item.name}</p>
                                      <p className="text-[9px] uppercase tracking-wider text-y2k-slate">
                                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-y2k-gunmetal font-mono">
                                    ₹{item.price * item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-y2k-gunmetal/10 flex items-center justify-between text-xs font-medium text-y2k-gunmetal/70">
                            <span>Shipping: ₹{order.shippingAmount} | Discount: ₹{order.discountAmount}</span>
                            <span className="font-bold font-mono text-sm text-y2k-gunmetal">
                              Total: ₹{order.totalAmount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Update & Management Controls */}
                      <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-2xs flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                          {/* Order Status Select */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                              Fulfillment Status
                            </label>
                            <select
                              value={statusSelects[order.id] || order.orderStatus}
                              onChange={(e) =>
                                setStatusSelects((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-bold uppercase text-y2k-gunmetal outline-none focus:border-y2k-gunmetal cursor-pointer"
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
                            <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                              Payment Status
                            </label>
                            <select
                              value={paymentSelects[order.id] || order.paymentStatus}
                              onChange={(e) =>
                                setPaymentSelects((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-bold uppercase text-y2k-gunmetal outline-none focus:border-y2k-gunmetal cursor-pointer"
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
                            <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                              Tracking ID / India Post
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. IN9827401928"
                              value={trackingInputs[order.id] ?? ""}
                              onChange={(e) =>
                                setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono uppercase text-y2k-gunmetal outline-none focus:border-y2k-gunmetal"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOrder(order)}
                            className="px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Order</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveOrder(order.id)}
                            disabled={saving === order.id}
                            className="btn-bagify px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
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
          <div className="editorial-panel bg-white border border-y2k-gunmetal/20 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-medium text-lg uppercase text-y2k-gunmetal">
                  Permanently Delete Order #{deleteConfirmOrder.orderNumber}?
                </h3>
                <p className="text-xs text-y2k-gunmetal/70 mt-1 leading-relaxed">
                  This will permanently erase this order record and its items (₹
                  {deleteConfirmOrder.totalAmount.toLocaleString("en-IN")}) from the database. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-y2k-gunmetal/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal/70 hover:text-black cursor-pointer"
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
    </div>
  );
}

