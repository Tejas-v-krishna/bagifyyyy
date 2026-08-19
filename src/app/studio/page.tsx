"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, Package, Tag, AlertCircle, Sparkles, ShoppingBag, Clock, ArrowRight, CheckCircle2, ChevronRight, Printer } from "lucide-react";
import ShippingLabelModal from "./orders/ShippingLabelModal";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  isNew: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
  images: { id: string; url: string }[];
  _count?: { variants: number };
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

interface Order {
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
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface Stats {
  total: number;
  soldOut: number;
  newArrivals: number;
  categories: Record<string, number>;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

function ConfirmModal({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-[#111] border border-white/10 p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <h2 className="text-white font-medium text-lg">Delete Product?</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          You are about to permanently delete{" "}
          <span className="text-white font-medium">"{productName}"</span>. This
          action cannot be undone and will remove all images and variants.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-white/20 text-gray-400 hover:text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: any;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#111] border border-white/5 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
          {label}
        </p>
        <Icon className={`w-4 h-4 ${accent || "text-gray-600"}`} />
      </div>
      <div>
        <p className={`text-2xl lg:text-3xl font-medium ${accent || "text-white"}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function StudioDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    soldOut: 0,
    newArrivals: 0,
    categories: {},
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Products
      const [prodRes, orderRes] = await Promise.allSettled([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/studio/orders").then((r) => r.json()),
      ]);

      let allProducts: Product[] = [];
      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
        const detailed = await Promise.all(
          prodRes.value.map((p) => fetch(`/api/products/${p.id}`).then((r) => r.json()))
        );
        allProducts = detailed.filter((p) => !p.error);
        setProducts(allProducts);
      }

      let fetchedOrders: Order[] = [];
      if (orderRes.status === "fulfilled" && orderRes.value?.orders) {
        fetchedOrders = orderRes.value.orders;
        setOrders(fetchedOrders);
      }

      const categories: Record<string, number> = {};
      allProducts.forEach((p) => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });

      const totalRevenue = fetchedOrders
        .filter((o) => o.paymentStatus === "PAID" || o.orderStatus !== "CANCELLED")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const pendingOrders = fetchedOrders.filter(
        (o) => o.orderStatus === "PROCESSING"
      ).length;

      setStats({
        total: allProducts.length,
        soldOut: allProducts.filter((p) => p.isSoldOut).length,
        newArrivals: allProducts.filter((p) => p.isNew).length,
        categories,
        totalOrders: fetchedOrders.length,
        totalRevenue,
        pendingOrders,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (
    product: Product,
    field: "isSoldOut" | "isNew"
  ) => {
    setToggling(product.id + field);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !product[field] }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[8px] uppercase tracking-[0.3em] text-gray-600 mb-2">
            BAGIFYYYY / STUDIO
          </p>
          <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/studio/orders"
            className="flex items-center gap-2 border border-white/20 text-white px-5 py-3 text-[9px] font-bold uppercase tracking-widest hover:border-white hover:bg-white/5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Manage Orders ({orders.length})
          </Link>
          <Link
            href="/studio/products/new"
            className="flex items-center gap-2 bg-white text-black px-5 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          icon={ShoppingBag}
          accent="text-emerald-400"
          subtitle="Gross sales"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          accent="text-white"
          subtitle={`${orders.length} placed`}
        />
        <StatCard
          label="Processing"
          value={stats.pendingOrders}
          icon={Clock}
          accent={stats.pendingOrders > 0 ? "text-amber-400" : "text-gray-400"}
          subtitle="Pending action"
        />
        <StatCard label="Total Products" value={stats.total} icon={Package} subtitle="In catalog" />
        <StatCard label="Sold Out" value={stats.soldOut} icon={AlertCircle} accent="text-red-400" subtitle="Needs restock" />
        <StatCard label="New Arrivals" value={stats.newArrivals} icon={Sparkles} accent="text-cyan-400" subtitle="Active badges" />
      </div>

      {/* Recent Orders Section */}
      <div className="mb-10 bg-[#111] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-white">
              Recent Orders ({orders.length})
            </p>
          </div>
          <Link
            href="/studio/orders"
            className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-xs uppercase tracking-widest">
            No orders placed yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-11 bg-white/5 shrink-0 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.items?.[0]?.image || "/placeholder.jpg"}
                      alt={order.items?.[0]?.name || "Order item"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">#{order.orderNumber}</p>
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-xs border ${
                        order.paymentStatus === "PAID"
                          ? "bg-green-900/30 border-green-700/40 text-green-400"
                          : "bg-amber-900/30 border-amber-700/40 text-amber-400"
                      }`}>
                        {order.paymentMethod === "COD" ? "COD" : order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {order.shippingAddress?.fullName || order.customerEmail} • {order.items?.length || 1} item(s)
                    </p>
                    <p className="text-[9px] text-gray-600">
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

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </p>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 inline-block mt-0.5 border ${
                      order.orderStatus === "PROCESSING" ? "bg-amber-900/30 border-amber-700/40 text-amber-400" :
                      order.orderStatus === "SHIPPED" ? "bg-blue-900/30 border-blue-700/40 text-blue-400" :
                      order.orderStatus === "DELIVERED" ? "bg-green-900/30 border-green-700/40 text-green-400" :
                      "bg-red-900/30 border-red-700/40 text-red-400"
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(order)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 hover:border-white text-gray-300 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      title="Print Shipping Label Sticker"
                    >
                      <Printer className="w-3 h-3" />
                      <span className="hidden md:inline">Print Label</span>
                    </button>
                    <Link
                      href="/studio/orders"
                      className="p-2 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                      title="Manage Order"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.categories).length > 0 && (
        <div className="mb-10 bg-[#111] border border-white/5 p-6">
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            By Category
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.categories).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white">
                  {cat}
                </span>
                <span className="bg-white/10 text-gray-400 text-[9px] font-bold px-2 py-0.5">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-[#111] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
            All Products ({stats.total})
          </p>
        </div>

        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-4">
              No products yet
            </p>
            <Link
              href="/studio/products/new"
              className="text-[9px] font-bold uppercase tracking-widest text-white hover:text-gray-300 transition-colors"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 bg-white/5 shrink-0 relative overflow-hidden">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].url || (product.images[0] as any)}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-lighten"
                    />
                  )}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-600 mt-0.5">
                    {product.category} · {product.brand || "BAGIFYYYY"}
                  </p>
                </div>

                {/* Price */}
                <div className="w-28 text-right shrink-0">
                  <p className="text-sm font-medium text-white">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Status badges */}
                <div className="flex gap-2 w-36 shrink-0">
                  {product.isSoldOut && (
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20">
                      Sold Out
                    </span>
                  )}
                  {product.isNew && (
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      New
                    </span>
                  )}
                </div>

                {/* Quick toggles */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(product, "isSoldOut")}
                    disabled={toggling === product.id + "isSoldOut"}
                    title={product.isSoldOut ? "Mark In Stock" : "Mark Sold Out"}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {product.isSoldOut ? (
                      <ToggleRight className="w-4 h-4 text-red-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(product, "isNew")}
                    disabled={toggling === product.id + "isNew"}
                    title={product.isNew ? "Remove New tag" : "Mark as New"}
                    className="p-2 text-gray-600 hover:text-emerald-400 transition-colors disabled:opacity-40"
                  >
                    <Sparkles className={`w-4 h-4 ${product.isNew ? "text-emerald-400" : ""}`} />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/product/${product.id}`}
                    target="_blank"
                    className="p-2 text-gray-600 hover:text-white transition-colors"
                    title="View on site"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/studio/products/${product.id}`}
                    className="p-2 text-gray-600 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmModal
          productName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Printable Shipping Label Modal */}
      {printingOrder && (
        <ShippingLabelModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}
