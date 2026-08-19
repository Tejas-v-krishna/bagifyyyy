"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  Plus,
  Trash2,
  Tag,
  Check,
  Search,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Package,
  AlertCircle,
  TrendingDown
} from "lucide-react";

interface BundleProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  category?: string;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  createdAt: string;
  products: BundleProduct[];
  originalTotal: number;
  bundlePrice: number;
  savings: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  isSoldOut: boolean;
  images: { id: string; url: string }[];
}

export default function StudioBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Bundle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [bundleName, setBundleName] = useState("");
  const [bundleDesc, setBundleDesc] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bundlesRes, productsRes] = await Promise.all([
        fetch("/api/studio/bundles"),
        fetch("/api/admin/products"),
      ]);

      const bundlesData = await bundlesRes.json();
      const productsData = await productsRes.json();

      if (bundlesData.bundles) setBundles(bundlesData.bundles);
      if (Array.isArray(productsData)) setCatalogProducts(productsData);
      else if (productsData.products) setCatalogProducts(productsData.products);
    } catch (err) {
      console.error("Failed to load bundles data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle selection
  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculations for selected products
  const selectedProducts = catalogProducts.filter((p) => selectedIds.includes(p.id));
  const calculatedOriginalTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const calculatedBundlePrice = Math.round(
    calculatedOriginalTotal * (1 - discountPercent / 100) * 100
  ) / 100;
  const calculatedSavings = calculatedOriginalTotal - calculatedBundlePrice;

  // Filter catalog
  const filteredCatalog = catalogProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCat = catalogCategory === "all" || p.category.toLowerCase() === catalogCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(catalogProducts.map((p) => p.category))).filter(Boolean);

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      setErrorMsg("Please enter a bundle title.");
      return;
    }
    if (selectedIds.length < 2) {
      setErrorMsg("Please select at least 2 products to create a combo bundle.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/studio/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bundleName,
          description: bundleDesc,
          discount: discountPercent,
          productIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create bundle.");
      }

      // Reset form & reload
      setBundleName("");
      setBundleDesc("");
      setDiscountPercent(15);
      setSelectedIds([]);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBundle = async (bundle: Bundle) => {
    try {
      const res = await fetch(`/api/studio/bundles/${bundle.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBundles((prev) => prev.filter((b) => b.id !== bundle.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-6 sm:px-10 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div>
          <p className="text-[8px] uppercase tracking-[0.3em] text-gray-600 mb-2">
            BAGIFYYYY / STUDIO
          </p>
          <h1 className="text-2xl font-medium tracking-tight">Bundle Combos &amp; Sets</h1>
          <p className="text-xs text-gray-400 mt-1">
            Curate head-to-toe archive outfit packages with discounted combo pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/bundles"
            target="_blank"
            className="flex items-center gap-2 border border-white/20 text-white px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:border-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Store Bundles
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Bundle
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#111] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Active Combos</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black">{bundles.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Live on website bundles page</p>
        </div>

        <div className="bg-[#111] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Average Savings</span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black">
            {bundles.length > 0
              ? `${Math.round(bundles.reduce((acc, b) => acc + b.discount, 0) / bundles.length)}%`
              : "15%"}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Special bundle discount rate</p>
        </div>

        <div className="bg-[#111] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Catalog Ready</span>
            <Package className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-2xl font-black">{catalogProducts.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Products available to combine</p>
        </div>
      </div>

      {/* Existing Bundles List */}
      {loading ? (
        <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
          Loading bundles…
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-[#111] border border-white/5 p-12 text-center">
          <Layers className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
            No bundles created yet
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            Create combo packages (e.g. Jacket + Jeans + Belt) with special discounts to increase average order value.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Bundle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-[#111] border border-white/8 p-6 flex flex-col justify-between hover:border-white/20 transition-colors"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-tight text-white">
                      {bundle.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                      {bundle.description || "Curated multi-piece outfit combo."}
                    </p>
                  </div>
                  <span className="shrink-0 bg-emerald-950/40 border border-emerald-700/50 text-emerald-400 text-[9px] font-black uppercase px-2.5 py-1">
                    {bundle.discount}% OFF
                  </span>
                </div>

                {/* Items strip */}
                <div className="grid grid-cols-3 gap-2 my-4">
                  {bundle.products.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/3 border border-white/5 p-2 flex flex-col justify-between"
                    >
                      <div className="aspect-[3/4] bg-white/5 relative overflow-hidden mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                      <p className="text-[9px] text-gray-400 font-mono">₹{item.price.toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Actions Footer */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-white">
                      ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-gray-500 line-through font-mono">
                      ₹{bundle.originalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[9px] text-emerald-400 font-medium">
                    Customer saves ₹{bundle.savings.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/bundles"
                    target="_blank"
                    className="p-2 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                    title="View on store"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(bundle)}
                    className="p-2 border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-colors cursor-pointer"
                    title="Delete Bundle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* CREATE BUNDLE MODAL                                                   */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-white/15 max-w-4xl w-full text-white shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-[#161616]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">Create New Outfit Bundle</h2>
                  <p className="text-[10px] text-gray-400">Select 2 or more products and set bundle discount</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateBundle} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                    Bundle Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Cyber Skater Combo"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-3.5 py-2.5 outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                    Discount Percentage ({discountPercent}%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold bg-white/10 px-2 py-1 shrink-0">
                      {discountPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                  Styling Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pair our 14.5oz Raw Selvedge Trucker with Acid Wash Cargos and Chrome Star Belt."
                  value={bundleDesc}
                  onChange={(e) => setBundleDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white text-xs px-3.5 py-2.5 outline-none focus:border-white/40"
                />
              </div>

              {/* Step 2: Live Price Preview Bar */}
              <div className="p-4 bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">
                    Selected Items ({selectedIds.length})
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-base font-black text-white">
                      Bundle Price: ₹{calculatedBundlePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-gray-500 line-through font-mono">
                      ₹{calculatedOriginalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">
                    TOTAL SAVINGS: ₹{calculatedSavings.toLocaleString("en-IN")} ({discountPercent}% OFF)
                  </span>
                </div>
              </div>

              {/* Step 3: Product Selector */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Select Products to Include ({selectedIds.length} Selected)
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filter products…"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white text-xs pl-8 pr-3 py-1.5 outline-none focus:border-white/30 w-40 sm:w-48"
                      />
                    </div>
                    {categories.length > 0 && (
                      <select
                        value={catalogCategory}
                        onChange={(e) => setCatalogCategory(e.target.value)}
                        className="bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-bold uppercase px-2.5 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1 border border-white/5 bg-black/40">
                  {filteredCatalog.map((prod) => {
                    const isSelected = selectedIds.includes(prod.id);
                    const imgUrl = prod.images?.[0]?.url || "/placeholder.jpg";

                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleSelectProduct(prod.id)}
                        className={`p-2.5 border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? "bg-white/10 border-white shadow-sm"
                            : "bg-white/2 border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <div className="aspect-[3/4] bg-white/5 relative overflow-hidden mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-white text-black p-1 rounded-full shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-white truncate">{prod.name}</p>
                          <p className="text-[8px] uppercase tracking-wider text-gray-500">{prod.category}</p>
                        </div>
                        <p className="text-xs font-mono font-bold text-white mt-1">
                          ₹{prod.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedIds.length < 2}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-md disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? "Creating…" : "Publish Bundle Outfit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE CONFIRM MODAL                                                  */}
      {/* ===================================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 p-6 max-w-md w-full text-white">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
              Delete Bundle?
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Are you sure you want to remove <b>{deleteTarget.name}</b>? Individual products will remain in the catalog.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-white/20 text-gray-300 text-[10px] font-bold uppercase tracking-widest hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBundle(deleteTarget)}
                className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700"
              >
                Delete Bundle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
