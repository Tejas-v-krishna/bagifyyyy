"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, Package, AlertCircle, Sparkles, ShoppingBag, Clock, ArrowRight, ChevronRight, Printer, Layers, Bug } from "lucide-react";
import ShippingLabelModal from "./orders/ShippingLabelModal";
import { countsAsRevenue, orderStatusLabel } from "@/lib/orderStatus";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";

type ProductImage = string | { id?: string; url?: string | null } | null;

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  isNew: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
  images: ProductImage[];
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

interface BugReport {
  id: string;
  name: string | null;
  email: string | null;
  page: string;
  message: string;
  status: string;
  createdAt: string;
}

function getProductImageUrl(image: ProductImage | undefined): string | null {
  if (typeof image === "string") {
    const url = image.trim();
    return url || null;
  }

  if (image && typeof image.url === "string") {
    const url = image.url.trim();
    return url || null;
  }

  return null;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 font-sans">
      <div className="editorial-panel bg-white border border-black/10 rounded-xl p-8 max-w-sm w-full text-black">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <h2 className="font-microgramma font-bold text-lg uppercase tracking-tight text-black">Delete Product?</h2>
        </div>
        <p className="text-black/70 text-xs mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-black">&quot;{productName}&quot;</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-black/10 rounded-[0.35rem] text-black hover:bg-black/5 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-[0.35rem] text-white py-3 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
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
   icon: LucideIcon;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-6 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold uppercase tracking-wider text-black/50">
          {label}
        </p>
        <Icon className={`w-4 h-4 ${accent || "text-black/50"}`} />
      </div>
      <div>
        <p className={`text-2xl lg:text-3xl font-microgramma font-bold tracking-tight ${accent || "text-black"}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[9px] text-black/45 mt-1 uppercase tracking-wider font-sans">{subtitle}</p>
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
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [openBugCount, setOpenBugCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, orderRes, bugRes] = await Promise.allSettled([
        fetch("/api/admin/products").then((r) => r.json()),
        fetch("/api/studio/orders").then((r) => r.json()),
        fetch("/api/admin/bug-reports").then((r) => r.json()),
      ]);

      let allProducts: Product[] = [];
      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
        allProducts = prodRes.value;
        setProducts(allProducts);
      }

      let fetchedOrders: Order[] = [];
      if (orderRes.status === "fulfilled" && orderRes.value?.orders) {
        fetchedOrders = orderRes.value.orders;
        setOrders(fetchedOrders);
      }

      if (bugRes.status === "fulfilled" && Array.isArray(bugRes.value?.reports)) {
        setBugReports(bugRes.value.reports);
        setOpenBugCount(bugRes.value.openCount ?? 0);
      }

      const categories: Record<string, number> = {};
      allProducts.forEach((p) => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });

      // Card orders count once the money is captured, cash on delivery counts
      // until it is cancelled. The old test was "paid OR not cancelled", which
      // booked every abandoned payment sheet as revenue.
      const totalRevenue = fetchedOrders
        .filter(countsAsRevenue)
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
    async function loadData() {
      await fetchData();
    }
    loadData();
  }, [fetchData]);

  const handleResolveBug = async (id: string, status: "OPEN" | "RESOLVED") => {
    try {
      const res = await fetch(`/api/admin/bug-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return;
      setBugReports((prev) => prev.map((b) => (b.id === id ? { ...b, status: data.report.status } : b)));
      setOpenBugCount(data.openCount ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (product: Product) => {    try {
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
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="text-[10px] font-bold uppercase tracking-wider text-black/50 animate-pulse">
          Loading Dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* ── Page Header (Title matches sidebar nav link) ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div>
          <h1 className="font-microgramma font-bold text-3xl uppercase tracking-[-0.03em] text-black">
            DASHBOARD
          </h1>
          <p className="text-xs text-black/70 mt-0.5">
            Store performance and recent customer orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/studio/bundles"
            className="bg-white border border-black/10 rounded-[0.35rem] text-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bundles ({stats.total})</span>
          </Link>
          <Link
            href="/studio/orders"
            className="bg-white border border-black/10 rounded-[0.35rem] text-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </Link>
          <Link
            href="/studio/products/new"
            className="btn-bagify px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────────────── */}
      <div className="font-bold grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          icon={ShoppingBag}
          accent="text-black font-bold"
          subtitle="Gross sales"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          subtitle={`${orders.length} in database`}
        />
        <StatCard
          label="Processing"
          value={stats.pendingOrders}
          icon={Clock}
          accent={stats.pendingOrders > 0 ? "text-black font-bold" : "text-black/50"}
          subtitle="Pending fulfillment"
        />
        <StatCard label="Total Catalog" value={stats.total} icon={Package} subtitle="Active products" />
        <StatCard label="Sold Out" value={stats.soldOut} icon={AlertCircle} accent="text-red-600" subtitle="Out of stock" />
        <StatCard label="New Items" value={stats.newArrivals} icon={Sparkles} accent="text-black font-bold" subtitle="New badges" />
      </div>

      {/* ── Recent Orders Table (Entire Box Area is Clickable to Open Orders) ── */}
      <div className="bg-white border border-black/10 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-black/[0.02]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-black" />
            <h2 className="font-microgramma font-bold text-base uppercase tracking-tight text-black">
              Recent Fulfillment Orders ({orders.length})
            </h2>
          </div>
          <Link
            href="/studio/orders"
            className="text-[10px] font-bold uppercase tracking-wider text-black/50 hover:text-black flex items-center gap-1 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-black/50 text-xs uppercase tracking-wider">
            No orders placed yet
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href="/studio/orders"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-black/[0.03] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-12 bg-[#f2f2f2] shrink-0 overflow-hidden relative border border-black/10 rounded-md">
                    <Image
                      src={order.items?.[0]?.image || "/placeholder.jpg"}
                      alt={order.items?.[0]?.name || "Order item"}
                      fill
                      loader={({ src }) => src}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-black group-hover:underline">#{order.orderNumber}</p>
                      <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border border-black/10 bg-[#f5f5f2] text-black">
                        {order.paymentMethod === "COD" ? "COD" : order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-black/80 mt-0.5 font-medium truncate">
                      {order.shippingAddress?.fullName || order.customerEmail} • {order.items?.length || 1} item(s)
                    </p>
                    <p className="text-[9px] text-black/50 font-mono">
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

                <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                  <div className="font-bold text-right">
                    <p className="text-sm font-bold text-black">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 border border-black/10 bg-[#f5f5f2] text-black">
                      {orderStatusLabel(order.orderStatus)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setPrintingOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/15 rounded-[0.35rem] hover:bg-black hover:text-white text-black text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                        title="Print Shipping Label Sticker"
                      >
                      <Printer className="w-3 h-3" />
                      <span className="hidden md:inline">Print Label</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── User Bug Reports (notifications) ─────────────────────────────── */}
      <div className="bg-white border border-black/10 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-black/[0.02]">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex">
              <Bug className="w-4 h-4 text-black" aria-hidden="true" />
              {openBugCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold tabular-nums text-white">
                  {openBugCount}
                </span>
              )}
            </span>
            <h2 className="font-microgramma font-bold text-base uppercase tracking-tight text-black">
              User Bug Reports ({bugReports.length})
            </h2>
          </div>
        </div>

        {bugReports.length === 0 ? (
          <div className="py-12 text-center text-black/40 text-xs uppercase tracking-wider">
            No bug reports — shoppers are happy
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {bugReports.slice(0, 8).map((bug) => {
              const isOpen = bug.status !== "RESOLVED";
              return (
                <div key={bug.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${isOpen ? "bg-red-600 border-red-600 text-white" : "bg-black/[0.04] border-black/10 text-black/50"}`}>
                        {isOpen ? "Open" : "Resolved"}
                      </span>
                      <span className="text-[10px] font-mono text-black/50 truncate">
                        {bug.page || "unknown page"}
                      </span>
                      <span className="text-[9px] text-black/40">
                        {new Date(bug.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-black mt-1.5 leading-relaxed">
                      {bug.message}
                    </p>
                    {(bug.name || bug.email) && (
                      <p className="text-[10px] text-black/50 mt-1 truncate">
                        {[bug.name, bug.email].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResolveBug(bug.id, isOpen ? "RESOLVED" : "OPEN")}
                    className={`shrink-0 px-3 py-1.5 rounded-[0.35rem] text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${isOpen ? "bg-black text-white border-black hover:bg-black/80" : "bg-white text-black/50 border-black/15 hover:text-black hover:border-black"}`}
                  >
                    {isOpen ? "Resolve" : "Reopen"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Category Spread ───────────────────────────────────────────────── */}
      {Object.keys(stats.categories).length > 0 && (
        <div className="bg-white border border-black/10 rounded-xl p-6 shadow-xs">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/50 mb-3">
            PRODUCTS BY CATEGORY
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.categories).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 border border-black/10 rounded-[0.35rem] bg-[#f5f5f2] px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                  {cat}
                </span>
                <span className="bg-black text-white rounded-full text-[9px] font-bold px-1.5 py-0.5">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Products List with Icon Tooltips ──────────────────────────────── */}
      <div className="bg-white border border-black/10 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-black/[0.02]">
          <h2 className="font-microgramma font-bold text-base uppercase tracking-tight text-black">
            Catalog Items ({stats.total})
          </h2>
          <Link
            href="/studio/products/new"
            className="text-[10px] font-bold uppercase tracking-wider text-black/50 hover:text-black flex items-center gap-1"
          >
            <span>+ Add Product</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/50 mb-4">
              No products in catalog
            </p>
            <Link
              href="/studio/products/new"
              className="btn-bagify inline-block px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider"
            >
              Add First Product →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product.images?.[0]);

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-black/[0.03] transition-colors group"
                >
                {/* Thumbnail */}
                <Link
                  href={`/studio/products/${product.id}`}
                  className="w-12 h-14 bg-[#f2f2f2] border border-black/10 rounded-md shrink-0 relative overflow-hidden block"
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      loader={({ src }) => src}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/studio/products/${product.id}`}
                    className="text-xs font-bold text-black hover:underline truncate block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[9px] uppercase tracking-wider text-black/50 mt-0.5">
                    {product.category} · {product.brand || "BAGIFYYYY"}
                  </p>
                </div>

                {/* Price */}
                <div className="font-bold w-28 text-right shrink-0">
                  <p className="text-xs font-bold text-black">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Status badges */}
                <div className="flex gap-2 w-36 shrink-0 justify-center">
                  {product.isSoldOut && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-50 text-red-600 border border-red-200">
                      Sold Out
                    </span>
                  )}
                  {product.isNew && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f2] text-black border border-black/10">
                      New
                    </span>
                  )}
                </div>

                {/* Quick toggles with Tooltips */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(product, "isSoldOut")}
                    disabled={toggling === product.id + "isSoldOut"}
                    title={product.isSoldOut ? "Mark In Stock" : "Mark Sold Out"}
                    className="p-2 text-black/50 hover:text-black transition-colors cursor-pointer disabled:opacity-40 relative group/tooltip"
                  >
                    {product.isSoldOut ? (
                      <ToggleRight className="w-5 h-5 text-red-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-black/50" />
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-black text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      {product.isSoldOut ? "Mark In Stock" : "Mark Sold Out"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleToggle(product, "isNew")}
                    disabled={toggling === product.id + "isNew"}
                    title={product.isNew ? "Remove New tag" : "Mark as New"}
                    className="p-2 text-black/50 hover:text-black transition-colors cursor-pointer disabled:opacity-40 relative group/tooltip"
                  >
                    <Sparkles className={`w-4 h-4 ${product.isNew ? "text-black fill-black" : "text-black/50"}`} />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-black text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      {product.isNew ? "Remove New Badge" : "Add New Badge"}
                    </span>
                  </button>
                </div>

                {/* Actions with Tooltips */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/product/${product.id}`}
                    target="_blank"
                    className="p-2 text-black/50 hover:text-black transition-colors relative group/tooltip"
                    title="View on store website"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-black text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      View on Store
                    </span>
                  </Link>
                  <Link
                    href={`/studio/products/${product.id}`}
                    className="p-2 text-black/50 hover:text-black transition-colors relative group/tooltip"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-black text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      Edit Product
                    </span>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="p-2 text-black/50 hover:text-red-600 transition-colors cursor-pointer relative group/tooltip"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-red-600 text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      Delete Product
                    </span>
                  </button>
                </div>
                </div>
              );
            })}
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
