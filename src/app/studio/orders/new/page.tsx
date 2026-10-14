"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

type Product = {
  id: string;
  sku?: string | null;
  name: string;
  price: number;
  isSoldOut: boolean;
  images: Array<string | { id?: string; url?: string | null } | null>;
  variants: Variant[];
};

type Line = {
  key: number;
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

const ORDER_STATUSES = ["PROCESSING", "SHIPPED", "DELIVERED"] as const;

function imageUrl(product: Product): string {
  const first = product.images?.[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && first.url) return first.url;
  return "/placeholder.jpg";
}

export default function StudioNewOfflineOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [lines, setLines] = useState<Line[]>([{ key: 1, productId: "", size: "", color: "", quantity: 1 }]);
  const [shippingAmount, setShippingAmount] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [upiRef, setUpiRef] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("PROCESSING");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ orderNumber: string; id: string } | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      setUnauthorized(false);
      try {
        const res = await fetch("/api/admin/products");
        if (res.status === 401) {
          setUnauthorized(true);
          setProducts([]);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, productQuery]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = productById.get(line.productId);
        if (!product) return sum;
        return sum + product.price * (line.quantity || 0);
      }, 0),
    [lines, productById]
  );

  const total = Math.max(
    0,
    Math.round((subtotal - (Number(discountAmount) || 0) + (Number(shippingAmount) || 0)) * 100) / 100
  );

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const pickProduct = (key: number, productId: string) => {
    const product = productById.get(productId);
    const firstAvailable =
      product?.variants.find((v) => v.stock > 0) || product?.variants[0];
    setLine(key, {
      productId,
      size: firstAvailable?.size || "",
      color: firstAvailable?.color || "",
      quantity: 1,
    });
  };

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { key: Math.max(0, ...prev.map((l) => l.key)) + 1, productId: "", size: "", color: "", quantity: 1 },
    ]);

  const removeLine = (key: number) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch("/api/studio/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines
            .filter((l) => l.productId)
            .map((l) => ({
              productId: l.productId,
              size: l.size,
              color: l.color,
              quantity: Number(l.quantity),
            })),
          shippingAddress: {
            fullName,
            street,
            city,
            state,
            pincode,
            country: "India",
          },
          customerPhone: phone,
          customerEmail: email || undefined,
          instagramHandle: handle || undefined,
          upiRef: upiRef || undefined,
          trackingId: trackingId || undefined,
          shippingAmount: Number(shippingAmount) || 0,
          discountAmount: Number(discountAmount) || 0,
          orderStatus,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to create offline order.");
        return;
      }
      setCreated({ orderNumber: data.order.orderNumber, id: data.order.id });
      setLines([{ key: Date.now(), productId: "", size: "", color: "", quantity: 1 }]);
      setUpiRef("");
      setTrackingId("");
    } catch (err) {
      console.error("Failed to create offline order:", err);
      setError("Network error. Could not create offline order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (unauthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <a href="/studio/login?from=/studio/orders/new" className="btn-bagify px-6 py-3 text-xs font-bold uppercase tracking-wider">
          Sign in to Studio →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-y2k-gunmetal/15">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
          Instagram / UPI sales
        </span>
        <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
          Add offline order
        </h1>
        <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
          Records as a paid <span className="font-mono font-bold">IG-xxxxxx</span> order, decrements variant stock, and
          auto-marks the product sold out when the last piece goes.
        </p>
      </div>

      {created && (
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-4 text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            Order #{created.orderNumber} saved.{" "}
            <Link href="/studio/orders" className="underline">
              View in orders →
            </Link>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate">
                Items sold ({lines.length})
              </span>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-y2k-gunmetal/10 px-3 py-1.5 hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add line
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-y2k-gunmetal/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={loadingProducts ? "Loading catalog…" : "Search product to add…"}
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="w-full bg-white border border-y2k-gunmetal/10 pl-9 pr-4 py-2 text-xs outline-none focus:border-y2k-gunmetal placeholder:text-y2k-gunmetal/40"
              />
            </div>

            <div className="space-y-3">
              {lines.map((line) => {
                const product = productById.get(line.productId);
                return (
                  <div key={line.key} className="border border-y2k-gunmetal/10 p-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      value={line.productId}
                      onChange={(e) => pickProduct(line.key, e.target.value)}
                      className="sm:col-span-5 bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-2 text-xs font-medium outline-none focus:border-y2k-gunmetal cursor-pointer"
                      required
                    >
                      <option value="">Select product…</option>
                      {(productQuery ? filteredProducts : products.slice(0, 50)).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku ? `[${p.sku}] ` : ""}{p.name} — ₹{p.price}
                          {p.isSoldOut ? " (sold out)" : ""}
                        </option>
                      ))}
                    </select>
                    <select
                      value={line.size && line.color ? `${line.size}|||${line.color}` : ""}
                      onChange={(e) => {
                        const [size, color] = e.target.value.split("|||");
                        setLine(line.key, { size: size || "", color: color || "" });
                      }}
                      className="sm:col-span-5 bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-2 text-xs outline-none focus:border-y2k-gunmetal cursor-pointer"
                    >
                      <option value="">Size / color…</option>
                      {product?.variants.map((v) => (
                        <option key={v.id} value={`${v.size}|||${v.color}`}>
                          {v.size} / {v.color} ({v.stock} left)
                        </option>
                      ))}
                    </select>
                    <div className="sm:col-span-2 flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={line.quantity}
                        onChange={(e) => setLine(line.key, { quantity: Number(e.target.value) })}
                        className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-2 text-xs font-mono outline-none focus:border-y2k-gunmetal"
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="p-2 text-red-500/70 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {product && (
                      <p className="sm:col-span-12 text-[10px] text-y2k-gunmetal/60 font-mono">
                        {imageUrl(product) !== "/placeholder.jpg" ? "" : "No image on file. "}
                        Line total: ₹{(product.price * (line.quantity || 0)).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-2xs">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-4">
              Buyer & delivery
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Full name *
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-medium normal-case text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Phone *
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Instagram handle
                <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Email (optional)
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Used for receipt if given" className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs normal-case text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="sm:col-span-2 flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Street address *
                <input value={street} onChange={(e) => setStreet(e.target.value)} required className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-medium normal-case text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                City
                <input value={city} onChange={(e) => setCity(e.target.value)} className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                State
                <input value={state} onChange={(e) => setState(e.target.value)} className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Pincode *
                <input value={pincode} onChange={(e) => setPincode(e.target.value)} required inputMode="numeric" placeholder="6 digits" className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-2xs space-y-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block">
              Payment (UPI paid)
            </span>
            <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
              UPI reference
              <input value={upiRef} onChange={(e) => setUpiRef(e.target.value)} placeholder="UPI txn id" className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Shipping ₹
                <input type="number" min={0} value={shippingAmount} onChange={(e) => setShippingAmount(e.target.value)} className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Discount ₹
                <input type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Status
                <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-bold uppercase outline-none focus:border-y2k-gunmetal cursor-pointer">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                Tracking (optional)
                <input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="IN…" className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-mono uppercase text-y2k-gunmetal outline-none focus:border-y2k-gunmetal" />
              </label>
            </div>
            <div className="pt-2 border-t border-y2k-gunmetal/10 text-xs text-y2k-gunmetal/70 space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between font-bold text-y2k-gunmetal"><span>Total to record</span><span className="font-mono">₹{total.toLocaleString("en-IN")}</span></div>
              <p className="text-[10px] text-y2k-gunmetal/50">Prices come from the catalog. Server re-prices on save.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingProducts}
            className="btn-bagify w-full px-6 py-3 text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${submitting ? "animate-spin" : "hidden"}`} />
            {submitting ? "Saving…" : "Save offline order"}
          </button>
          <Link href="/studio/orders" className="block text-center text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 hover:text-black">
            Back to orders
          </Link>
        </div>
      </form>
    </div>
  );
}
