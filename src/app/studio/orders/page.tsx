"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, Package, Truck, CheckCircle2, XCircle, Clock, RefreshCw, Printer, ShieldCheck } from "lucide-react";
import ShippingLabelModal from "./ShippingLabelModal";
import { AWAITING_PAYMENT, ORDER_STATUSES, orderStatusLabel } from "@/lib/orderStatus";

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

// Started-but-unpaid checkouts get their own tab rather than sitting inside
// PROCESSING, where they read as orders waiting to be packed.
const FILTER_TABS = ["ALL", ...ORDER_STATUSES];

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [statusSelects, setStatusSelects] = useState<Record<string, string>>({});

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
        data.orders.forEach((o: Order) => {
          tracking[o.id] = o.trackingId || "";
          statuses[o.id] = o.orderStatus;
        });
        setTrackingInputs(tracking);
        setStatusSelects(statuses);
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
    fetchOrders();
  }, [fetchOrders]);

  const handleSaveOrder = async (orderId: string) => {
    setSaving(orderId);
    setSaveSuccess(null);
    try {
      const res = await fetch(`/api/studio/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: statusSelects[orderId],
          trackingId: trackingInputs[orderId] || null,
        }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, orderStatus: statusSelects[orderId], trackingId: trackingInputs[orderId] || null }
              : o
          )
        );
        setSaveSuccess(orderId);
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    } finally {
      setSaving(null);
    }
  };

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
        <div className="bg-white border border-y2k-gunmetal/15 p-8 max-w-md w-full text-center shadow-xl text-y2k-gunmetal">
          <ShieldCheck className="w-10 h-10 text-y2k-gunmetal mx-auto mb-4" />
          <h2 className="font-display font-medium text-lg uppercase tracking-tight mb-2">Studio Authentication Required</h2>
          <p className="text-xs text-y2k-gunmetal/70 mb-6">Please sign in to access order management and customer details.</p>
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
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            FULFILLMENT
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            ORDERS
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">{orders.length} total orders recorded</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white border border-y2k-gunmetal/10 px-4 py-2.5 hover:bg-y2k-gunmetal hover:text-white transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
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
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-y2k-gunmetal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, email, phone…"
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
                        <img
                          src={order.items?.[0]?.image || "/placeholder.jpg"}
                          alt={order.items?.[0]?.name || "Item"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-y2k-gunmetal">#{order.orderNumber}</span>
                          <span className="text-[8px] font-bold uppercase px-2 py-0.5 border border-y2k-gunmetal/10 bg-y2k-ice text-y2k-gunmetal">
                            {order.paymentMethod === "COD" ? "COD" : order.paymentStatus}
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

                    <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                      <div className="text-right">
                        <p className="font-bold font-display font-medium text-base text-y2k-gunmetal">
                          ₹{order.totalAmount?.toLocaleString("en-IN")}
                        </p>
                        <span
                          className={`text-[8px] font-bold uppercase px-2.5 py-0.5 border block mt-0.5 ${
                            order.orderStatus === AWAITING_PAYMENT
                              ? "border-red-300 bg-red-50 text-red-700"
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
                          <span>Label</span>
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
                        {/* Delivery Address */}
                        <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-2xs">
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-2">
                            DELIVERY DESTINATION
                          </span>
                          <p className="text-xs font-bold text-y2k-gunmetal mb-1">
                            {order.shippingAddress?.fullName}
                          </p>
                          <p className="text-xs text-y2k-gunmetal/80 leading-relaxed font-sans">
                            {order.shippingAddress?.street}<br />
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                          </p>
                          <p className="text-xs font-mono text-y2k-gunmetal/70 mt-2">
                            📞 {order.shippingAddress?.phone || order.customerPhone}
                          </p>
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="bg-white border border-y2k-gunmetal/15 p-4 md:col-span-2 shadow-2xs">
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-3">
                            ORDERED ITEMS ({order.items?.length || 0})
                          </span>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-y2k-gunmetal/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-10 bg-y2k-ice border border-y2k-gunmetal/10 shrink-0 relative overflow-hidden">
                                    <img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-y2k-gunmetal">{item.name}</p>
                                    <p className="text-[9px] uppercase tracking-wider text-y2k-slate">
                                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-bold text-y2k-gunmetal font-mono">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Status Update Controls */}
                      <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
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
                              {/* AWAITING_PAYMENT has to be listed or an unpaid
                                  order's select would fall back to showing
                                  PROCESSING, and one Save click would promote a
                                  checkout nobody paid for into the queue. */}
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {orderStatusLabel(status).toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tracking ID Input */}
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                              Tracking ID / India Post Reference
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

                        <div className="flex items-center gap-3">
                          {saveSuccess === order.id && (
                            <span className="text-[10px] font-bold uppercase text-y2k-gunmetal flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-y2k-gunmetal" /> Saved!
                            </span>
                          )}
                          <button
                            onClick={() => handleSaveOrder(order.id)}
                            disabled={saving === order.id}
                            className="btn-bagify px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                          >
                            {saving === order.id ? "Saving…" : "Update Order"}
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

      {/* Thermal Print Modal */}
      {printingOrder && (
        <ShippingLabelModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}
