"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Search,
  X,
} from "lucide-react";

type OrderItem = {
  id: string;
  sku: string | null;
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
  country?: string;
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
  paymentId: string | null;
  trackingId: string | null;
  upiRef?: string | null;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null;
};

type Row = {
  id: string;
  orderNumber: string;
  channel: "WEBSITE" | "INSTAGRAM";
  orderDate: string;
  customerName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  sku: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  upiRef: string;
  trackingId: string;
  orderStatus: string;
  itemCount: number;
};

const passthroughLoader = ({ src }: { src: string }) => src;
const PAGE_SIZES = [25, 50, 100];

function channelOf(order: Order): "WEBSITE" | "INSTAGRAM" {
  return order.paymentMethod === "MANUAL" ? "INSTAGRAM" : "WEBSITE";
}

export default function StudioOrderLedgerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<"ALL" | "WEBSITE" | "INSTAGRAM">("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [payStatus, setPayStatus] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("orderDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    const all: Order[] = [];
    let skip = 0;
    const take = 200;
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await fetch(`/api/studio/orders?take=${take}&skip=${skip}`);
        if (res.status === 401) {
          setUnauthorized(true);
          setOrders([]);
          return;
        }
        const data = await res.json();
        const batch: Order[] = data.orders ?? [];
        all.push(...batch);
        if (batch.length < take) break;
        skip += take;
      }
      setOrders(all);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const flattened: Row[] = useMemo(() => {
    const rows: Row[] = [];
    for (const order of orders) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          rows.push({
            id: `${order.id}-${item.id}`,
            orderNumber: order.orderNumber,
            channel: channelOf(order),
            orderDate: order.createdAt,
            customerName: order.shippingAddress?.fullName || order.customerEmail,
            phone: order.customerPhone,
            email: order.customerEmail,
            street: order.shippingAddress?.street || "",
            city: order.shippingAddress?.city || "",
            state: order.shippingAddress?.state || "",
            pincode: order.shippingAddress?.pincode || "",
            sku: item.sku || item.id,
            productName: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity,
            imageUrl: item.image || "",
            discountAmount: order.discountAmount,
            shippingAmount: order.shippingAmount,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            upiRef: order.paymentId || "",
            trackingId: order.trackingId || "",
            orderStatus: order.orderStatus,
            itemCount: order.items.length,
          });
        }
      } else {
        rows.push({
          id: `${order.id}-single`,
          orderNumber: order.orderNumber,
          channel: channelOf(order),
          orderDate: order.createdAt,
          customerName: order.shippingAddress?.fullName || order.customerEmail,
          phone: order.customerPhone,
          email: order.customerEmail,
          street: order.shippingAddress?.street || "",
          city: order.shippingAddress?.city || "",
          state: order.shippingAddress?.state || "",
          pincode: order.shippingAddress?.pincode || "",
          sku: "",
          productName: "",
          size: "",
          color: "",
          quantity: 0,
          unitPrice: 0,
          lineTotal: 0,
          imageUrl: "",
          discountAmount: order.discountAmount,
          shippingAmount: order.shippingAmount,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          upiRef: order.paymentId || "",
          trackingId: order.trackingId || "",
          orderStatus: order.orderStatus,
          itemCount: 0,
        });
      }
    }
    return rows;
  }, [orders]);

  const statuses = useMemo(
    () => ["ALL", ...Array.from(new Set(orders.map((o) => o.orderStatus)))],
    [orders]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let rows = flattened;
    if (channel !== "ALL") rows = rows.filter((r) => r.channel === channel);
    if (status !== "ALL") rows = rows.filter((r) => r.orderStatus === status);
    if (payStatus !== "ALL") rows = rows.filter((r) => r.paymentStatus === payStatus);
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      if (!Number.isNaN(from)) rows = rows.filter((r) => new Date(r.orderDate).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime() + 86400000 - 1;
      rows = rows.filter((r) => new Date(r.orderDate).getTime() <= to);
    }
    if (q) {
      rows = rows.filter((r) =>
        [
          r.orderNumber,
          r.customerName,
          r.phone,
          r.email,
          r.street,
          r.city,
          r.state,
          r.pincode,
          r.sku,
          r.productName,
          r.size,
          r.color,
          r.upiRef,
          r.trackingId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return rows;
  }, [flattened, channel, status, payStatus, fromDate, toDate, search]);

  const sorted = useMemo(() => {
    const sortedRows = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    });
    return sortDir === "asc" ? sortedRows : sortedRows.reverse();
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => {
    const uniq = new Set(filtered.map((r) => r.orderNumber));
    const revenue = filtered.reduce((sum, r) => sum + (r.channel === "WEBSITE" ? r.totalAmount : r.totalAmount), 0) / Math.max(1, new Set(filtered.map((r) => r.orderNumber)).size) * uniq.size;
    // revenue = sum of unique order totals
    const uniqTotals = new Map<string, number>();
    for (const r of filtered) {
      if (!uniqTotals.has(r.orderNumber)) uniqTotals.set(r.orderNumber, r.totalAmount);
    }
    const totalRevenue = [...uniqTotals.values()].reduce((s, v) => s + v, 0);
    return {
      orders: uniq.size,
      lines: filtered.length,
      revenue: totalRevenue,
    };
  }, [filtered]);

  const handleSort = (key: keyof Row) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Reset pagination when filters change.
  useEffect(() => {
    setPage(0);
  }, [search, channel, status, payStatus, fromDate, toDate, sortKey, sortDir, pageSize]);

  const pageRows = useMemo(
    () => sorted.slice(page * pageSize, page * pageSize + pageSize),
    [sorted, page, pageSize]
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));

  const exportCsv = () => {
    const headers = [
      "Order #","Channel","Date","Customer","Phone","Email","Street","City","State","Pincode",
      "SKU","Product","Size","Color","Qty","Unit Price","Line Total","Image URL",
      "Discount","Shipping","Order Total","Pay Method","Pay Status","UPI Ref","Tracking","Order Status",
    ];
    const csvRows = sorted.map((r) => [
      r.orderNumber,
      r.channel,
      r.orderDate,
      r.customerName,
      r.phone,
      r.email,
      r.street,
      r.city,
      r.state,
      r.pincode,
      r.sku,
      r.productName,
      r.size,
      r.color,
      r.quantity,
      r.unitPrice,
      r.lineTotal,
      r.imageUrl,
      r.discountAmount,
      r.shippingAmount,
      r.totalAmount,
      r.paymentMethod,
      r.paymentStatus,
      r.upiRef,
      r.trackingId,
      r.orderStatus,
    ]);
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      // Prevent CSV formula injection and wrap any field with separators or quotes.
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const csv = "\uFEFF" + [headers.map(escape).join(","), ...csvRows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `orders-ledger-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Crude column model for render.
  const ledgerColumns: { key: keyof Row; label: string; width: number; align?: "left" | "right" }[] = [
    { key: "orderDate", label: "Date", width: 130 },
    { key: "orderNumber", label: "Order #", width: 105 },
    { key: "channel", label: "Channel", width: 95 },
    { key: "customerName", label: "Buyer", width: 130 },
    { key: "phone", label: "Phone", width: 120 },
    { key: "email", label: "Email", width: 170 },
    { key: "street", label: "Street", width: 200 },
    { key: "city", label: "City", width: 110 },
    { key: "state", label: "State", width: 110 },
    { key: "pincode", label: "Pincode", width: 75 },
    { key: "sku", label: "SKU", width: 90 },
    { key: "productName", label: "Product", width: 150 },
    { key: "size", label: "Size", width: 65 },
    { key: "color", label: "Color", width: 80 },
    { key: "quantity", label: "Qty", width: 45, align: "right" },
    { key: "unitPrice", label: "Unit ₹", width: 75, align: "right" },
    { key: "lineTotal", label: "Line ₹", width: 75, align: "right" },
    { key: "imageUrl", label: "Image", width: 60 },
    { key: "discountAmount", label: "Discount", width: 75, align: "right" },
    { key: "shippingAmount", label: "Shipping", width: 75, align: "right" },
    { key: "totalAmount", label: "Total ₹", width: 80, align: "right" },
    { key: "paymentMethod", label: "Pay", width: 85 },
    { key: "paymentStatus", label: "Pay Status", width: 85 },
    { key: "upiRef", label: "UPI Ref", width: 120 },
    { key: "trackingId", label: "Tracking", width: 120 },
    { key: "orderStatus", label: "Status", width: 95 },
  ];

  if (unauthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-sans">
        <div className="editorial-panel bg-white border border-y2k-gunmetal/15 p-8 max-w-md w-full text-center text-y2k-gunmetal">
          <h2 className="font-display font-medium text-lg uppercase tracking-tight mb-2">Studio auth required</h2>
          <p className="text-xs text-y2k-gunmetal/70 mb-6">Please sign in to open the order ledger.</p>
          <a href="/studio/login?from=/studio/ledger" className="btn-bagify inline-block w-full py-3 text-xs font-bold uppercase tracking-wider">
            Sign in to Studio →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="pb-3 border-b border-y2k-gunmetal/15 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            SPREADSHEET VIEW
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            ORDER LEDGER
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            {stats.orders} orders · {stats.lines} line items · ₹{stats.revenue.toLocaleString("en-IN")} recorded. Drag to scroll, click any column to sort.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white border border-y2k-gunmetal/10 px-4 py-2.5 hover:bg-y2k-gunmetal hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-black text-white px-4 py-2.5 hover:bg-black/80 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-y2k-gunmetal/10 p-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-y2k-gunmetal/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything: order #, name, phone, city, SKU, product, UPI ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 pl-9 pr-4 py-2 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium placeholder:text-y2k-gunmetal/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-y2k-gunmetal/40 shrink-0" />
            {(["ALL", "WEBSITE", "INSTAGRAM"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  channel === c
                    ? "bg-y2k-gunmetal text-white border-y2k-gunmetal"
                    : "bg-white text-y2k-gunmetal/60 border-y2k-gunmetal/10 hover:text-black"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-1.5 text-[10px] font-bold uppercase text-y2k-gunmetal cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={payStatus}
            onChange={(e) => setPayStatus(e.target.value)}
            className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-1.5 text-[10px] font-bold uppercase text-y2k-gunmetal cursor-pointer"
          >
            <option value="ALL">PAY: ALL</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="REFUND_PENDING">REFUND_PENDING</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-y2k-gunmetal/40" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-1 text-[10px] text-y2k-gunmetal font-mono"
            />
            <span className="text-[10px] text-y2k-gunmetal/40">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-2 py-1 text-[10px] text-y2k-gunmetal font-mono"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-red-600 px-2 py-1 cursor-pointer"
              >
                clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-y2k-gunmetal/15 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[10px] font-bold uppercase tracking-wider text-y2k-slate animate-pulse">
            Loading ledger records…
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center text-y2k-gunmetal/50 text-xs font-bold uppercase tracking-wider">
            No matching records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max w-full border-collapse text-[11px]">
              <thead className="bg-y2k-ice border-b border-y2k-gunmetal/15 sticky top-0 z-10">
                <tr>
                  {ledgerColumns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-2 py-2.5 text-left font-extrabold uppercase tracking-wider text-y2k-gunmetal whitespace-nowrap cursor-pointer select-none hover:bg-y2k-gunmetal/5 ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                      style={{ minWidth: col.width }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (
                          <span className="text-y2k-slate">{sortDir === "asc" ? "▲" : "▼"}</span>
                        ) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-y2k-gunmetal/10 odd:bg-white even:bg-[#fafafa] hover:bg-y2k-ice transition-colors">
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{new Date(row.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-2 py-1.5 font-mono font-bold text-y2k-gunmetal whitespace-nowrap">{row.orderNumber}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span
                        className={`text-[8px] font-bold uppercase px-2 py-0.5 border ${
                          row.channel === "INSTAGRAM"
                            ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800"
                            : "border-slate-300 bg-slate-50 text-slate-800"
                        }`}
                      >
                        {row.channel}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-medium whitespace-nowrap">{row.customerName}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{row.phone}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.email}</td>
                    <td className="px-2 py-1.5 max-w-[220px] truncate" title={row.street}>{row.street}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.city}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.state}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{row.pincode}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {row.sku ? (
                        <span className="text-[9px] font-mono font-bold text-black bg-black/5 px-1.5 py-0.5 border border-black/20">
                          {row.sku}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-2 py-1.5 max-w-[160px] truncate font-medium" title={row.productName}>{row.productName || "—"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.size || "—"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.color || "—"}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap text-right">{row.quantity}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap text-right">{row.unitPrice.toFixed(0)}</td>
                    <td className="px-2 py-1.5 font-mono font-bold whitespace-nowrap text-right">₹{row.lineTotal}</td>
                    <td className="px-2 py-1.5 text-center">
                      {row.imageUrl ? (
                        <button
                          onClick={() => setPreviewImage(row.imageUrl)}
                          className="w-8 h-10 relative overflow-hidden border border-y2k-gunmetal/15 bg-y2k-ice block cursor-pointer hover:border-y2k-gunmetal"
                          title="Preview image"
                        >
                          <Image src={row.imageUrl} alt={row.productName} fill loader={passthroughLoader} unoptimized className="object-cover" />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap text-right">{row.discountAmount || ""}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap text-right">{row.shippingAmount || ""}</td>
                    <td className="px-2 py-1.5 font-mono font-bold text-y2k-gunmetal whitespace-nowrap text-right">₹{row.totalAmount}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.paymentMethod === "MANUAL" ? "MANUAL" : row.paymentMethod}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span
                        className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                          row.paymentStatus === "PAID"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : row.paymentStatus === "FAILED"
                              ? "border-red-300 bg-red-50 text-red-800"
                              : "border-amber-300 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[10px] max-w-[120px] truncate" title={row.upiRef}>{row.upiRef || "—"}</td>
                    <td className="px-2 py-1.5 font-mono text-[10px] max-w-[120px] truncate" title={row.trackingId}>{row.trackingId || "—"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span
                        className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                          row.orderStatus === "DELIVERED"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : row.orderStatus === "CANCELLED"
                              ? "border-red-300 bg-red-50 text-red-800"
                              : "border-y2k-gunmetal/10 bg-y2k-ice text-y2k-gunmetal"
                        }`}
                      >
                        {row.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60">
        <div>
          Showing {sorted.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length} lines
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white border border-y2k-gunmetal/10 px-2 py-1 text-[10px] cursor-pointer"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 border border-y2k-gunmetal/10 bg-white hover:bg-y2k-ice disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="p-1.5 border border-y2k-gunmetal/10 bg-white hover:bg-y2k-ice disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-white border border-y2k-gunmetal/20 p-3 max-w-3xl w-full relative">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-y2k-gunmetal/20 rounded-full flex items-center justify-center text-y2k-gunmetal shadow cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Product" className="max-h-[70vh] mx-auto object-contain" />
            <a
              href={previewImage}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 hover:text-black mt-3"
            >
              Open in new tab →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
