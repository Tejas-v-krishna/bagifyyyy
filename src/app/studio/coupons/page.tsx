"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TicketPercent,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Calendar,
  Percent,
  DollarSign,
  Truck
} from "lucide-react";
import type { Coupon } from "@/lib/coupons";

export default function StudioCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED" | "FREE_SHIPPING",
    discountValue: "10",
    minOrderAmount: "0",
    maxDiscountAmount: "",
    usageLimit: "",
    expiresAt: "",
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue) || 0,
          minOrderAmount: parseFloat(form.minOrderAmount) || 0,
          maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        setForm({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "10",
          minOrderAmount: "0",
          maxDiscountAmount: "",
          usageLimit: "",
          expiresAt: "",
        });
        setMessage({ type: "success", text: "Coupon code created successfully." });
        setTimeout(() => setMessage(null), 3500);
        await fetchCoupons();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error || "Failed to create coupon." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });

      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentActive } : c))
        );
      } else {
        alert("Failed to toggle coupon status.");
      }
    } catch {
      alert("Error updating coupon.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setMessage({ type: "success", text: `Coupon "${code}" deleted.` });
        setTimeout(() => setMessage(null), 3500);
      } else {
        alert("Failed to delete coupon.");
      }
    } catch {
      alert("Error deleting coupon.");
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
            DISCOUNTS &amp; PROMOTIONS
          </span>
          <h1 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal">
            Coupon Codes Manager
          </h1>
          <p className="text-xs text-y2k-slate mt-1">
            Create and manage promotional discount codes (e.g. BAGIFY10, FREESHIP, FLAT200) for shoppers to redeem in cart and checkout.
          </p>
        </div>
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

      {/* Main Grid: Form + Coupon List */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-6">
        {/* Left: Add Coupon Form */}
        <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/10">
            <Sparkles className="w-4 h-4 text-y2k-gunmetal" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
              Create Coupon Code
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. BAGIFY10, FREESHIP, Y2KVIP"
                required
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-y2k-gunmetal outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Discount Type *
              </label>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-y2k-gunmetal outline-none focus:border-black cursor-pointer"
              >
                <option value="PERCENTAGE">Percentage (% Off)</option>
                <option value="FIXED">Fixed Amount (₹ Off)</option>
                <option value="FREE_SHIPPING">Free Shipping (₹80 Off)</option>
              </select>
            </div>

            {form.discountType !== "FREE_SHIPPING" && (
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                  {form.discountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                  min="1"
                  max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                  step="any"
                  required
                  placeholder={form.discountType === "PERCENTAGE" ? "10" : "200"}
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2.5 text-xs font-mono text-y2k-gunmetal outline-none focus:border-black"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                  Min Order (₹)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-black"
                />
              </div>

              {form.discountType === "PERCENTAGE" ? (
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                    Max Cap (₹)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={form.maxDiscountAmount}
                    onChange={handleChange}
                    min="1"
                    placeholder="None"
                    className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-black"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    min="1"
                    placeholder="Unlimited"
                    className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-black"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                name="expiresAt"
                value={form.expiresAt}
                onChange={handleChange}
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/15 px-3 py-2 text-xs text-y2k-gunmetal outline-none focus:border-black cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !form.code.trim()}
              className="w-full btn-bagify py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{creating ? "Creating Coupon…" : "Create Coupon"}</span>
            </button>
          </form>
        </div>

        {/* Right: Existing Coupons List */}
        <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10">
            <div className="flex items-center gap-2">
              <TicketPercent className="w-4 h-4 text-y2k-gunmetal" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
                Active Coupons ({coupons.length})
              </h2>
            </div>
            <button
              onClick={() => fetchCoupons()}
              className="text-[10px] text-y2k-slate hover:text-black uppercase tracking-wider underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-y2k-slate gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Loading coupons…</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center text-y2k-slate">
              <p className="text-xs font-medium">No coupons created yet.</p>
              <p className="text-[10px] mt-1">Use the form on the left to set up promo codes like BAGIFY10 or FREESHIP.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                return (
                  <div
                    key={coupon.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.015] px-2 rounded-sm transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-black text-white rounded-[0.25rem]">
                          {coupon.code}
                        </span>

                        <span className="text-xs font-semibold text-y2k-gunmetal">
                          {coupon.discountType === "PERCENTAGE" && `${coupon.discountValue}% OFF`}
                          {coupon.discountType === "FIXED" && `₹${coupon.discountValue} OFF`}
                          {coupon.discountType === "FREE_SHIPPING" && "FREE SHIPPING (₹80 OFF)"}
                        </span>

                        {!coupon.isActive ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded-full">
                            Inactive
                          </span>
                        ) : isExpired ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            Expired
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            Live
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-y2k-slate pt-1">
                        {coupon.minOrderAmount > 0 && (
                          <span>Min Order: ₹{coupon.minOrderAmount.toLocaleString("en-IN")}</span>
                        )}
                        {coupon.maxDiscountAmount && (
                          <span>Max Discount: ₹{coupon.maxDiscountAmount.toLocaleString("en-IN")}</span>
                        )}
                        <span>Used: {coupon.usedCount} times</span>
                        {coupon.expiresAt && (
                          <span>
                            Expires: {new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon.id, coupon.isActive)}
                        disabled={togglingId === coupon.id}
                        title={coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                        className="p-1 text-y2k-slate hover:text-black transition-colors cursor-pointer"
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        disabled={deletingId === coupon.id}
                        title="Delete Coupon"
                        className="p-1.5 text-black/40 hover:text-red-600 transition-colors rounded-sm hover:bg-red-50 cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
