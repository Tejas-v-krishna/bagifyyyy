"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  Plus,
  Trash2,
  Check,
  Search,
  X,
  ExternalLink,
  Package,
  AlertCircle,
  TrendingDown,
  Edit2
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

const passthroughLoader = ({ src }: { src: string }) => src;

export default function StudioBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bundle Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bundle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(0);

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
    async function loadData() {
      await fetchData();
    }
    loadData();
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

  const openCreateModal = () => {
    setEditingBundleId(null);
    setBundleName("");
    setBundleDesc("");
    setDiscountPercent(15);
    setSelectedIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bundle) => {
    setEditingBundleId(b.id);
    setBundleName(b.name);
    setBundleDesc(b.description || "");
    setDiscountPercent(b.discount);
    setSelectedIds(b.products.map(p => p.id));
    setIsModalOpen(true);
  };

  const openProductEdit = (p: CatalogProduct) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdPrice(p.price);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: prodName, price: prodPrice }),
      });
      if (res.ok) {
        await fetchData();
        setEditingProduct(null);
      } else {
        alert("Failed to update product");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBundle = async (e: React.FormEvent) => {
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
      const url = editingBundleId ? `/api/studio/bundles/${editingBundleId}` : "/api/studio/bundles";
      const method = editingBundleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
        throw new Error(data.error || "Failed to save bundle.");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
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
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            PRODUCT SETS
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            BUNDLES
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            Create multi-piece outfit sets with custom discounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/bundles"
            target="_blank"
            className="flex items-center gap-2 border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider hover:border-y2k-gunmetal hover:bg-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Live Bundles
          </Link>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-y2k-gunmetal text-white px-5 py-2.5 text-[9px] font-black uppercase tracking-wider hover:bg-black transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Bundle
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-y2k-gunmetal/15 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/50">Active Combos</span>
            <Layers className="w-4 h-4 text-y2k-gunmetal" />
          </div>
          <p className="font-display text-3xl font-black">{bundles.length}</p>
        </div>

        <div className="bg-white border border-y2k-gunmetal/15 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/50">Average Savings</span>
            <TrendingDown className="w-4 h-4 text-y2k-gunmetal" />
          </div>
          <p className="font-display text-3xl font-black">
            {bundles.length > 0
              ? `${Math.round(bundles.reduce((acc, b) => acc + b.discount, 0) / bundles.length)}%`
              : "15%"}
          </p>
        </div>

        <div className="bg-white border border-y2k-gunmetal/15 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/50">Catalog Ready</span>
            <Package className="w-4 h-4 text-y2k-gunmetal" />
          </div>
          <p className="font-display text-3xl font-black">{catalogProducts.length}</p>
        </div>
      </div>

      {/* Existing Bundles List */}
      {loading ? (
        <div className="py-20 text-center text-xs font-bold uppercase tracking-wider text-y2k-gunmetal/60">
          Loading bundles…
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-white border border-y2k-gunmetal/15 p-12 text-center">
          <Layers className="w-10 h-10 text-y2k-gunmetal/30 mx-auto mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-y2k-gunmetal mb-1">
            No bundles created yet
          </h3>
          <p className="text-xs text-y2k-gunmetal/60 max-w-sm mx-auto mb-6">
            Create combo packages (e.g. Jacket + Jeans + Belt) with special discounts to increase average order value.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-y2k-gunmetal text-white px-6 py-2.5 text-[9px] font-black uppercase tracking-wider hover:bg-black transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Bundle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white border border-y2k-gunmetal/15 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-y2k-gunmetal/10">
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-y2k-gunmetal">
                      {bundle.name}
                    </h3>
                    <p className="text-xs text-y2k-gunmetal/60 mt-1 line-clamp-2">
                      {bundle.description || "Curated multi-piece outfit combo."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="shrink-0 border border-y2k-gunmetal text-y2k-gunmetal text-[10px] font-bold uppercase px-3 py-1">
                      {bundle.discount}% OFF
                    </span>
                    <button
                      onClick={() => openEditModal(bundle)}
                      className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 hover:text-y2k-gunmetal flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Bundle
                    </button>
                  </div>
                </div>

                {/* Items strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 my-4">
                  {bundle.products.map((item) => {
                    const catalogProd = catalogProducts.find(p => p.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-y2k-ice/30 border border-y2k-gunmetal/10 p-2 flex flex-col justify-between relative group/item"
                      >
                        <div className="aspect-[3/4] bg-y2k-ice relative overflow-hidden mb-2">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            loader={passthroughLoader}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] font-bold text-y2k-gunmetal truncate">{item.name}</p>
                        <p className="font-bold text-[10px] text-y2k-gunmetal/70 font-mono">₹{item.price.toLocaleString("en-IN")}</p>
                        
                        {/* Quick edit product */}
                        {catalogProd && (
                          <button
                            onClick={() => openProductEdit(catalogProd)}
                            className="absolute top-1 right-1 bg-white border border-y2k-gunmetal/10 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-y2k-ice text-y2k-gunmetal shadow-sm"
                            title="Edit Product Price/Name"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pricing & Actions Footer */}
              <div className="pt-4 border-t border-y2k-gunmetal/10 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold font-display text-xl font-black text-y2k-gunmetal">
                      ₹{bundle.bundlePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="font-bold text-xs text-y2k-gunmetal/50 line-through font-mono">
                      ₹{bundle.originalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal mt-0.5">
                    SAVINGS: ₹{bundle.savings.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/bundles"
                    target="_blank"
                    className="p-2 border border-y2k-gunmetal/15 text-y2k-gunmetal/60 hover:text-y2k-gunmetal hover:border-y2k-gunmetal/40 transition-colors bg-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(bundle)}
                    className="p-2 border border-y2k-gunmetal/15 text-y2k-gunmetal/60 hover:text-red-600 hover:border-red-600/40 transition-colors bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* EDIT PRODUCT INLINE MODAL                                             */}
      {/* ===================================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 bg-y2k-gunmetal/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-y2k-gunmetal/15 p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-y2k-gunmetal">
                Edit Product Name & Price
              </h3>
              <button onClick={() => setEditingProduct(null)}><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-y2k-ice border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-3 py-2 outline-none focus:border-y2k-gunmetal"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  className="w-full bg-y2k-ice border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-3 py-2 outline-none focus:border-y2k-gunmetal font-mono"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-[10px] font-bold uppercase">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-y2k-gunmetal text-white text-[10px] font-bold uppercase">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CREATE / EDIT BUNDLE MODAL                                            */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-y2k-gunmetal/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-y2k-gunmetal/15 max-w-4xl w-full text-y2k-gunmetal shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-y2k-gunmetal/15 shrink-0 bg-y2k-ice">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center font-bold">
                  {editingBundleId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-y2k-gunmetal">
                    {editingBundleId ? "Edit Outfit Bundle" : "Create New Outfit Bundle"}
                  </h2>
                  <p className="text-[10px] text-y2k-gunmetal/60">Manage bundle details, discount, and pieces</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-y2k-gunmetal/60 hover:text-y2k-gunmetal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBundle} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5">
                    Bundle Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Cyber Skater Combo"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-3.5 py-3 outline-none focus:border-y2k-gunmetal"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5">
                    Discount Percentage ({discountPercent}%) *
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={80}
                        step={1}
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-full accent-y2k-gunmetal cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-14 bg-y2k-ice/50 border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-2 py-1 outline-none text-center font-mono font-bold"
                      />
                    </div>
                    <p className="text-[9px] text-y2k-gunmetal/50 leading-tight">
                      Adjust the percentage to control the final price below.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5">
                  Styling Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pair our 14.5oz Raw Selvedge Trucker with Acid Wash Cargos..."
                  value={bundleDesc}
                  onChange={(e) => setBundleDesc(e.target.value)}
                  className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-3.5 py-3 outline-none focus:border-y2k-gunmetal"
                />
              </div>

              {/* Step 2: Live Price Preview Bar */}
              <div className="p-5 bg-y2k-gunmetal text-white border border-y2k-gunmetal flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 block">
                    Selected Items ({selectedIds.length})
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="font-bold font-display text-2xl font-black">
                      Final Price: ₹{calculatedBundlePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="font-bold text-sm text-white/40 line-through font-mono">
                      ₹{calculatedOriginalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="font-bold text-right bg-white text-y2k-gunmetal px-4 py-2 border border-white">
                  <span className="text-[10px] uppercase tracking-wider font-bold block">
                    TOTAL SAVINGS: ₹{calculatedSavings.toLocaleString("en-IN")} ({discountPercent}% OFF)
                  </span>
                </div>
              </div>

              {/* Step 3: Product Selector */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60">
                    Select Products to Include ({selectedIds.length} Selected)
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-y2k-gunmetal/40" />
                      <input
                        type="text"
                        placeholder="Filter catalog…"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs pl-8 pr-3 py-2 outline-none focus:border-y2k-gunmetal w-40 sm:w-48"
                      />
                    </div>
                    {categories.length > 0 && (
                      <select
                        value={catalogCategory}
                        onChange={(e) => setCatalogCategory(e.target.value)}
                        className="bg-y2k-ice border border-y2k-gunmetal/10 text-y2k-gunmetal text-[10px] font-bold uppercase px-2.5 py-2 outline-none cursor-pointer"
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-2 border border-y2k-gunmetal/10 bg-y2k-ice/30">
                  {filteredCatalog.map((prod) => {
                    const isSelected = selectedIds.includes(prod.id);
                    const imgUrl = prod.images?.[0]?.url || "/placeholder.jpg";

                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleSelectProduct(prod.id)}
                        className={`p-2.5 border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? "bg-white border-y2k-gunmetal shadow-md scale-[1.02]"
                            : "bg-white border-y2k-gunmetal/10 hover:border-y2k-gunmetal/40 hover:bg-y2k-ice"
                        }`}
                      >
                        <div>
                          <div className="aspect-[3/4] bg-y2k-ice relative overflow-hidden mb-2">
                            <Image
                              src={imgUrl}
                              alt={prod.name}
                              fill
                              loader={passthroughLoader}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-y2k-gunmetal text-white p-1 rounded-full shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-y2k-gunmetal truncate">{prod.name}</p>
                          <p className="font-bold text-[8px] uppercase tracking-wider text-y2k-gunmetal/50">{prod.category}</p>
                        </div>
                        <p className="text-xs font-mono font-bold text-y2k-gunmetal mt-1">
                          ₹{prod.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-y2k-gunmetal/15 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-y2k-gunmetal/10 text-y2k-gunmetal/60 hover:text-y2k-gunmetal hover:bg-y2k-ice text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedIds.length < 2}
                  className="flex items-center gap-2 bg-y2k-gunmetal text-white px-8 py-3 text-[10px] font-black uppercase tracking-wider hover:bg-black transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? "Saving…" : (editingBundleId ? "Save Changes" : "Publish Bundle")}
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
        <div className="fixed inset-0 bg-y2k-gunmetal/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white border border-y2k-gunmetal/15 p-8 max-w-md w-full text-y2k-gunmetal shadow-2xl">
            <h3 className="font-display text-2xl uppercase tracking-wider text-y2k-gunmetal mb-2">
              Delete Bundle?
            </h3>
            <p className="text-sm text-y2k-gunmetal/60 leading-relaxed mb-8">
              Are you sure you want to remove <b>{deleteTarget.name}</b>? Individual products will remain in the catalog.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 border border-y2k-gunmetal/10 text-y2k-gunmetal text-[10px] font-bold uppercase tracking-wider hover:bg-y2k-ice"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBundle(deleteTarget)}
                className="px-5 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 shadow-sm"
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
