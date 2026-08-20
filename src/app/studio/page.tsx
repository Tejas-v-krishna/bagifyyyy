"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, Package, AlertCircle, Sparkles, ShoppingBag, Clock, ArrowRight, ChevronRight, Printer, Layers } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 font-sans">
      <div className="bg-white border border-y2k-gunmetal/10 p-8 max-w-sm w-full shadow-2xl text-y2k-gunmetal">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal">Delete Product?</h2>
        </div>
        <p className="text-y2k-gunmetal/70 text-xs mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-y2k-gunmetal">"{productName}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal hover:bg-y2k-ice py-3 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
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
    <div className="bg-white border border-y2k-gunmetal/15 p-6 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
          {label}
        </p>
        <Icon className={`w-4 h-4 ${accent || "text-y2k-gunmetal/50"}`} />
      </div>
      <div>
        <p className={`text-2xl lg:text-3xl font-display font-medium tracking-tight ${accent || "text-y2k-gunmetal"}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[9px] text-y2k-gunmetal/60 mt-1 uppercase tracking-wider font-sans">{subtitle}</p>
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
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate animate-pulse">
          Loading Dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* ── Page Header (Title matches sidebar nav link) ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            OVERVIEW
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            DASHBOARD
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            Store performance and recent customer orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/studio/bundles"
            className="bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-y2k-gunmetal hover:text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bundles ({stats.total})</span>
          </Link>
          <Link
            href="/studio/orders"
            className="bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-y2k-gunmetal hover:text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </Link>
          <Link
            href="/studio/products/new"
            className="btn-bagify px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
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
          accent="text-y2k-gunmetal font-bold"
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
          accent={stats.pendingOrders > 0 ? "text-y2k-gunmetal font-bold" : "text-y2k-gunmetal/50"}
          subtitle="Pending fulfillment"
        />
        <StatCard label="Total Catalog" value={stats.total} icon={Package} subtitle="Active products" />
        <StatCard label="Sold Out" value={stats.soldOut} icon={AlertCircle} accent="text-red-600" subtitle="Out of stock" />
        <StatCard label="New Items" value={stats.newArrivals} icon={Sparkles} accent="text-y2k-gunmetal font-bold" subtitle="New badges" />
      </div>

      {/* ── Recent Orders Table (Entire Box Area is Clickable to Open Orders) ── */}
      <div className="bg-white border border-y2k-gunmetal/15 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-y2k-gunmetal/15 flex items-center justify-between bg-y2k-ice/30">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-y2k-gunmetal" />
            <h2 className="font-display text-base uppercase tracking-tight text-y2k-gunmetal">
              Recent Fulfillment Orders ({orders.length})
            </h2>
          </div>
          <Link
            href="/studio/orders"
            className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate hover:text-black flex items-center gap-1 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-y2k-gunmetal/50 text-xs uppercase tracking-wider">
            No orders placed yet
          </div>
        ) : (
          <div className="divide-y divide-y2k-gunmetal/10">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href="/studio/orders"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-y2k-ice/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-12 bg-y2k-ice shrink-0 overflow-hidden relative border border-y2k-gunmetal/10">
                    <img
                      src={order.items?.[0]?.image || "/placeholder.jpg"}
                      alt={order.items?.[0]?.name || "Order item"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-y2k-gunmetal group-hover:underline">#{order.orderNumber}</p>
                      <span className="text-[8px] font-bold uppercase px-2 py-0.5 border border-y2k-gunmetal/10 bg-y2k-ice text-y2k-gunmetal">
                        {order.paymentMethod === "COD" ? "COD" : order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-y2k-gunmetal/80 mt-0.5 font-medium truncate">
                      {order.shippingAddress?.fullName || order.customerEmail} • {order.items?.length || 1} item(s)
                    </p>
                    <p className="text-[9px] text-y2k-slate font-mono">
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
                    <p className="text-sm font-bold text-y2k-gunmetal">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 inline-block mt-0.5 border border-y2k-gunmetal/10 bg-y2k-ice text-y2k-gunmetal">
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-y2k-gunmetal/10 hover:bg-y2k-gunmetal hover:text-white text-y2k-gunmetal text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                      title="Print Shipping Label Sticker"
                    >
                      <Printer className="w-3 h-3" />
                      <span className="hidden md:inline">Print Label</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-y2k-slate group-hover:text-black transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Category Spread ───────────────────────────────────────────────── */}
      {Object.keys(stats.categories).length > 0 && (
        <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate mb-3">
            PRODUCTS BY CATEGORY
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.categories).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 border border-y2k-gunmetal/15 bg-y2k-ice/40 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal">
                  {cat}
                </span>
                <span className="bg-y2k-gunmetal text-white text-[9px] font-bold px-1.5 py-0.5">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Products List with Icon Tooltips ──────────────────────────────── */}
      <div className="bg-white border border-y2k-gunmetal/15 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-y2k-gunmetal/15 flex items-center justify-between bg-y2k-ice/30">
          <h2 className="font-display text-base uppercase tracking-tight text-y2k-gunmetal">
            Catalog Items ({stats.total})
          </h2>
          <Link
            href="/studio/products/new"
            className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate hover:text-black flex items-center gap-1"
          >
            <span>+ Add Product</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-4">
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
          <div className="divide-y divide-y2k-gunmetal/10">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-y2k-ice/30 transition-colors group"
              >
                {/* Thumbnail */}
                <Link
                  href={`/studio/products/${product.id}`}
                  className="w-12 h-14 bg-y2k-ice border border-y2k-gunmetal/15 shrink-0 relative overflow-hidden block"
                >
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].url || (product.images[0] as any)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/studio/products/${product.id}`}
                    className="text-xs font-bold text-y2k-gunmetal hover:underline truncate block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[9px] uppercase tracking-wider text-y2k-slate mt-0.5">
                    {product.category} · {product.brand || "BAGIFYYYY"}
                  </p>
                </div>

                {/* Price */}
                <div className="font-bold w-28 text-right shrink-0">
                  <p className="text-xs font-bold text-y2k-gunmetal">
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
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-y2k-ice text-y2k-gunmetal border border-y2k-gunmetal/10">
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
                    className="p-2 text-y2k-slate hover:text-black transition-colors cursor-pointer disabled:opacity-40 relative group/tooltip"
                  >
                    {product.isSoldOut ? (
                      <ToggleRight className="w-5 h-5 text-red-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-y2k-slate" />
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      {product.isSoldOut ? "Mark In Stock" : "Mark Sold Out"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleToggle(product, "isNew")}
                    disabled={toggling === product.id + "isNew"}
                    title={product.isNew ? "Remove New tag" : "Mark as New"}
                    className="p-2 text-y2k-slate hover:text-black transition-colors cursor-pointer disabled:opacity-40 relative group/tooltip"
                  >
                    <Sparkles className={`w-4 h-4 ${product.isNew ? "text-y2k-gunmetal fill-y2k-gunmetal" : "text-y2k-slate"}`} />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      {product.isNew ? "Remove New Badge" : "Add New Badge"}
                    </span>
                  </button>
                </div>

                {/* Actions with Tooltips */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/product/${product.id}`}
                    target="_blank"
                    className="p-2 text-y2k-slate hover:text-black transition-colors relative group/tooltip"
                    title="View on store website"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      View on Store
                    </span>
                  </Link>
                  <Link
                    href={`/studio/products/${product.id}`}
                    className="p-2 text-y2k-slate hover:text-black transition-colors relative group/tooltip"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      Edit Product
                    </span>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="p-2 text-y2k-slate hover:text-red-600 transition-colors cursor-pointer relative group/tooltip"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-red-600 text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      Delete Product
                    </span>
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
