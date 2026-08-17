"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, Package, Truck, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PROCESSING: { label: "Processing", color: "bg-amber-50 border-amber-200 text-amber-700", icon: Clock },
  SHIPPED: { label: "Shipped", color: "bg-blue-50 border-blue-200 text-blue-700", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-green-50 border-green-200 text-green-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-50 border-red-200 text-red-700", icon: XCircle },
};

const FILTER_TABS = ["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [statusSelects, setStatusSelects] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/studio/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        // Init local state from fetched orders
        const tracking: Record<string, string> = {};
        const statuses: Record<string, string> = {};
        data.orders.forEach((o: Order) => {
          tracking[o.id] = o.trackingId || "";
          statuses[o.id] = o.orderStatus;
        });
        setTrackingInputs(tracking);
        setStatusSelects(statuses);
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
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    } finally {
      setSaving(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesTab = filterTab === "ALL" || o.orderStatus === filterTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      (o.trackingId || "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[9px] uppercase tracking-[0.4em] text-gray-500 mb-1">BAGIFYYYY STUDIO</p>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-xs text-gray-500 mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 px-4 py-2 hover:border-white/30 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5 pb-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
              filterTab === tab
                ? "text-white border-white"
                : "text-gray-600 border-transparent hover:text-gray-400"
            }`}
          >
            {tab}
            {tab !== "ALL" && (
              <span className="ml-1.5 text-[9px] opacity-60">
                ({orders.filter((o) => o.orderStatus === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-4 py-3 mb-6 max-w-md">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order #, email, or tracking ID..."
          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
        />
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center text-xs text-gray-500 uppercase tracking-widest py-24">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-xs text-gray-500 uppercase tracking-widest py-24 border border-white/5">
          <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
          No orders found
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((order) => {
            const isExpanded = expandedId === order.id;
            const StatusIcon = STATUS_CONFIG[order.orderStatus]?.icon || Clock;

            return (
              <div key={order.id} className="border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
                {/* Row Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs font-bold tracking-wider">#{order.orderNumber}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{order.customerEmail}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date</p>
                      <p className="text-xs font-medium">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total</p>
                      <p className="text-xs font-bold">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Payment</p>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-xs border ${
                        order.paymentStatus === "PAID"
                          ? "bg-green-900/30 border-green-700/40 text-green-400"
                          : "bg-amber-900/30 border-amber-700/40 text-amber-400"
                      }`}>
                        {order.paymentMethod === "COD" ? "COD" : order.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Status</p>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-xs border flex items-center gap-1 w-fit ${
                        order.orderStatus === "PROCESSING" ? "bg-amber-900/30 border-amber-700/40 text-amber-400" :
                        order.orderStatus === "SHIPPED" ? "bg-blue-900/30 border-blue-700/40 text-blue-400" :
                        order.orderStatus === "DELIVERED" ? "bg-green-900/30 border-green-700/40 text-green-400" :
                        "bg-red-900/30 border-red-700/40 text-red-400"
                      }`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Items + Address */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Items ({order.items.length})</p>
                      <div className="flex flex-col gap-2 mb-5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-white/3 px-3 py-2">
                            <div className="w-9 h-11 bg-white/5 shrink-0 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold">{item.name}</p>
                              <p className="text-[10px] text-gray-500">{item.color} | {item.size} | Qty: {item.quantity}</p>
                            </div>
                            <p className="text-xs font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Delivery Address</p>
                      <div className="bg-white/3 px-3 py-3 text-xs text-gray-300 leading-relaxed">
                        <p className="font-bold text-white">{order.shippingAddress?.fullName}</p>
                        <p>{order.shippingAddress?.phone}</p>
                        <p>{order.shippingAddress?.street}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
                      </div>
                    </div>

                    {/* Right: Status Update Controls */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Update Order</p>

                      <div className="flex flex-col gap-4">
                        {/* Status select */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1.5">Order Status</label>
                          <select
                            value={statusSelects[order.id] || order.orderStatus}
                            onChange={(e) => setStatusSelects((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold uppercase px-3 py-2.5 outline-none appearance-none cursor-pointer"
                          >
                            {Object.keys(STATUS_CONFIG).map((s) => (
                              <option key={s} value={s} className="bg-[#1a1a1a] text-white">{STATUS_CONFIG[s].label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Tracking ID */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 block mb-1.5">
                            Tracking ID
                            {order.trackingId && (
                              <span className="ml-2 text-blue-400 normal-case font-normal">({order.trackingId})</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={trackingInputs[order.id] || ""}
                            onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="e.g. EA123456789IN"
                            className="w-full bg-white/5 border border-white/10 text-white text-xs px-3 py-2.5 outline-none placeholder:text-gray-600 focus:border-white/30 transition-colors"
                          />
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-white/3 px-3 py-3 text-[10px] text-gray-400 space-y-1.5">
                          <div className="flex justify-between"><span>Subtotal</span><span>₹{(order.totalAmount + order.discountAmount - order.shippingAmount).toFixed(2)}</span></div>
                          {order.discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>−₹{order.discountAmount.toFixed(2)}</span></div>}
                          <div className="flex justify-between"><span>Shipping</span><span>₹{order.shippingAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1.5 mt-1.5"><span>Total</span><span>₹{order.totalAmount.toFixed(2)}</span></div>
                        </div>

                        <button
                          onClick={() => handleSaveOrder(order.id)}
                          disabled={saving === order.id}
                          className="w-full bg-white text-black text-[10px] font-bold uppercase tracking-widest py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
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
  );
}
