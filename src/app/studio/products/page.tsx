"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Package, 
  AlertCircle, 
  RefreshCw
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  description: string;
  isNew: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
  images: { id: string; url: string }[];
}

function ConfirmDeleteModal({
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
          <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal">
            Delete Product?
          </h2>
        </div>
        <p className="text-y2k-gunmetal/70 text-xs mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-y2k-gunmetal">"{productName}"</span>? This will permanently remove this item from your store catalog.
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

export default function StudioProductsCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        const detailed = await Promise.all(
          data.map((p: any) => fetch(`/api/products/${p.id}`).then((r) => r.json()))
        );
        setProducts(detailed.filter((p) => !p.error));
      }
    } catch (err) {
      console.error("Failed to load catalog products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
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
      fetchProducts();
    } catch (err) {
      console.error("Toggle failed:", err);
    } finally {
      setToggling(null);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      const matchesCategory =
        selectedCategory === "ALL" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();

      // Stock status filter
      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "IN_STOCK" && !p.isSoldOut) ||
        (stockFilter === "SOLD_OUT" && p.isSoldOut) ||
        (stockFilter === "NEW_DROP" && p.isNew);

      // Search term filter
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q);

      return matchesCategory && matchesStock && matchesSearch;
    });
  }, [products, selectedCategory, stockFilter, search]);

  const totalProducts = products.length;
  const inStockCount = products.filter((p) => !p.isSoldOut).length;
  const soldOutCount = products.filter((p) => p.isSoldOut).length;
  const newDropCount = products.filter((p) => p.isNew).length;

  return (
    <div className="space-y-6 font-sans">
      {/* ── Page Header (Title matches sidebar nav link) ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            CATALOG MANAGEMENT
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            PRODUCTS &amp; CATALOG ({totalProducts})
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            Manage all products, clothes, and accessories in your store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-y2k-gunmetal hover:text-white transition-all shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href="/studio/products/new"
            className="btn-bagify px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── Summary Metric Badges ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-2xs">
          <p className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1">Total Products</p>
          <p className="font-display text-2xl font-bold text-y2k-gunmetal">{totalProducts}</p>
        </div>
        <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-2xs">
          <p className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1">In Stock</p>
          <p className="font-display text-2xl font-bold text-y2k-gunmetal">{inStockCount}</p>
        </div>
        <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-2xs">
          <p className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1">Sold Out</p>
          <p className="font-display text-2xl font-bold text-red-600">{soldOutCount}</p>
        </div>
        <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-2xs">
          <p className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1">New Badges</p>
          <p className="font-display text-2xl font-bold text-y2k-gunmetal">{newDropCount}</p>
        </div>
      </div>

      {/* ── Filters & Search Row ─────────────────────────────────────────────── */}
      <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-y2k-gunmetal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, category, or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 pl-9 pr-4 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium placeholder:text-y2k-gunmetal/40"
          />
        </div>

        {/* Category & Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-bold uppercase text-y2k-gunmetal outline-none focus:border-y2k-gunmetal cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="topwear">Topwear / Shirts</option>
              <option value="bottomwear">Bottomwear / Cargos</option>
              <option value="accessories">Accessories</option>
              <option value="footwear">Footwear</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">Status:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-bold uppercase text-y2k-gunmetal outline-none focus:border-y2k-gunmetal cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="SOLD_OUT">Sold Out Only</option>
              <option value="NEW_DROP">New Tagged Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Product List Table ────────────────────────────────────────────────── */}
      <div className="bg-white border border-y2k-gunmetal/15 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-y2k-gunmetal/15 flex items-center justify-between bg-y2k-ice/30">
          <h2 className="font-display text-base uppercase tracking-tight text-y2k-gunmetal">
            Catalog Items ({filteredProducts.length} showing)
          </h2>
          <span className="text-[10px] text-y2k-slate font-bold uppercase tracking-wider">
            Hover over icons for quick action tooltips
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] font-bold uppercase tracking-wider text-y2k-slate animate-pulse">
            Loading products…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-8 h-8 text-y2k-slate/50 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal mb-2">
              No products found
            </p>
            <p className="text-xs text-y2k-slate max-w-sm mx-auto mb-4">
              Try changing your search terms or category filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-y2k-gunmetal/10">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-y2k-ice/30 transition-colors group"
              >
                {/* Thumbnail */}
                <Link
                  href={`/studio/products/${product.id}`}
                  className="w-14 h-16 bg-y2k-ice border border-y2k-gunmetal/15 shrink-0 relative overflow-hidden block"
                >
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].url || (product.images[0] as any)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/studio/products/${product.id}`}
                    className="text-xs font-bold text-y2k-gunmetal hover:underline truncate block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[9px] uppercase tracking-wider text-y2k-slate mt-0.5">
                    Category: {product.category} • Brand: {product.brand || "BAGIFYYYY"}
                  </p>
                  <p className="text-[10px] text-y2k-gunmetal/70 line-clamp-1 mt-1 font-sans">
                    {product.description}
                  </p>
                </div>

                {/* Price */}
                <div className="w-28 text-right shrink-0">
                  <p className="text-sm font-bold text-y2k-gunmetal">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 w-36 shrink-0 justify-center">
                  {product.isSoldOut ? (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 bg-red-50 text-red-600 border border-red-200">
                      Sold Out
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 bg-y2k-ice text-y2k-gunmetal border border-y2k-gunmetal/10">
                      In Stock
                    </span>
                  )}
                  {product.isNew && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 bg-y2k-gunmetal text-white border border-y2k-gunmetal">
                      New Tag
                    </span>
                  )}
                </div>

                {/* Quick Toggle Controls with Hover Tooltips */}
                <div className="flex items-center gap-2 shrink-0 border-l border-r border-y2k-gunmetal/10 px-3">
                  <button
                    onClick={() => handleToggle(product, "isSoldOut")}
                    disabled={toggling === product.id + "isSoldOut"}
                    title={product.isSoldOut ? "Mark In Stock" : "Mark Sold Out"}
                    className="p-1.5 text-y2k-slate hover:text-black transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1 text-[9px] font-bold uppercase relative group/tooltip"
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
                    title={product.isNew ? "Remove New badge" : "Add New badge"}
                    className="p-1.5 text-y2k-slate hover:text-black transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1 text-[9px] font-bold uppercase relative group/tooltip"
                  >
                    <Sparkles className={`w-4 h-4 ${product.isNew ? "text-y2k-gunmetal fill-y2k-gunmetal" : "text-y2k-slate"}`} />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      {product.isNew ? "Remove New Badge" : "Add New Badge"}
                    </span>
                  </button>
                </div>

                {/* Action Buttons with Hover Tooltips */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/product/${product.id}`}
                    target="_blank"
                    className="p-2 border border-y2k-gunmetal/15 text-y2k-slate hover:text-black hover:border-y2k-gunmetal transition-colors relative group/tooltip"
                    title="View on store website"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      View on Store
                    </span>
                  </Link>

                  <Link
                    href={`/studio/products/${product.id}`}
                    className="p-2 border border-y2k-gunmetal/15 text-y2k-slate hover:text-black hover:border-y2k-gunmetal transition-colors relative group/tooltip"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-y2k-gunmetal text-white text-[8px] font-bold uppercase px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      Edit Product
                    </span>
                  </Link>

                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="p-2 border border-y2k-gunmetal/15 text-y2k-slate hover:text-red-600 hover:border-red-600 transition-colors cursor-pointer relative group/tooltip"
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
