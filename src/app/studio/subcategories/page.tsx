"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES } from "@/lib/categories";
import { Plus, Trash2, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

type SubcategoryItem = {
  id: string;
  category: string;
  name: string;
  slug: string;
  createdAt: string;
};

export default function StudioSubcategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("bottomwears");
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSubcategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subcategories?category=${selectedCategory}`);
      if (res.ok) {
        const data = await res.json();
        setSubcategories(data.subcategories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryName.trim()) return;

    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          name: newSubcategoryName.trim(),
        }),
      });

      if (res.ok) {
        setNewSubcategoryName("");
        setMessage({ type: "success", text: "Subcategory added successfully." });
        setTimeout(() => setMessage(null), 3500);
        await fetchSubcategories();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error || "Failed to create subcategory." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Products using this fit will be unassigned.`)) {
      return;
    }

    setDeletingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/subcategories?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: `"${name}" removed.` });
        setTimeout(() => setMessage(null), 3500);
        setSubcategories((prev) => prev.filter((item) => item.id !== id));
      } else {
        setMessage({ type: "error", text: "Failed to delete subcategory." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error deleting subcategory." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            CATALOG TAXONOMY
          </span>
          <h1 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
            Categories &amp; Fits Management
          </h1>
          <p className="text-xs text-y2k-slate mt-1">
            Manage subcategories (e.g. Baggy, Bootcut, Cargos for Bottomwears) that power storefront filter pills and product tags.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-black/10 gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.slug);
              setMessage(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-sm transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.slug
                ? "bg-black text-white border-t-2 border-black"
                : "bg-white/80 text-black/60 hover:text-black hover:bg-black/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-sm text-xs flex items-center gap-2.5 font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Add form + Subcategories list */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Left: Add Subcategory Form */}
        <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/10">
            <Sparkles className="w-4 h-4 text-y2k-gunmetal" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
              Add Fit / Subcategory
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Target Category
              </label>
              <div className="px-3 py-2 bg-y2k-ice/60 border border-y2k-gunmetal/10 text-xs font-bold uppercase text-y2k-gunmetal">
                {CATEGORIES.find((c) => c.slug === selectedCategory)?.label || selectedCategory}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Subcategory Name *
              </label>
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="e.g. Baggy, Bootcut, Cargos, Flared"
                required
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-black font-sans"
              />
              <span className="text-[10px] text-y2k-slate mt-1 block">
                Will be converted into URL slug and storefront pill.
              </span>
            </div>

            <button
              type="submit"
              disabled={creating || !newSubcategoryName.trim()}
              className="w-full btn-bagify py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{creating ? "Adding Fit…" : "Add Fit / Subcategory"}</span>
            </button>
          </form>
        </div>

        {/* Right: Existing Subcategories List */}
        <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
              Active Fits in {CATEGORIES.find((c) => c.slug === selectedCategory)?.label} ({subcategories.length})
            </h2>
            <button
              onClick={() => fetchSubcategories()}
              className="text-[10px] text-y2k-slate hover:text-black uppercase tracking-wider underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-y2k-slate gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Loading fits…</span>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="py-12 text-center text-y2k-slate">
              <p className="text-xs font-medium">No subcategories defined for this category yet.</p>
              <p className="text-[10px] mt-1">Use the form on the left to add one (e.g. Baggy, Bootcut, Cargos).</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {subcategories.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between hover:bg-black/[0.015] px-2 rounded-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide bg-black text-white rounded-[0.25rem]">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-y2k-slate">
                      slug: {item.slug}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.name)}
                    disabled={deletingId === item.id}
                    title={`Delete ${item.name}`}
                    className="p-1.5 text-black/40 hover:text-red-600 transition-colors rounded-sm hover:bg-red-50 cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
