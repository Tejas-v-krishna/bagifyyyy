"use client";

import { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Smartphone, 
  Monitor, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Tag, 
  RefreshCw,
  Eye
} from "lucide-react";
import Image from "next/image";

export default function MarketingStudioPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Marketing Stats
  const [stats, setStats] = useState({
    subscriberCount: 0,
    campaigns: [] as any[],
    recentSubscribers: [] as any[],
  });

  // Form Fields
  const [campaignTitle, setCampaignTitle] = useState("Y2K Cyber Drop Release");
  const [subjectLine, setSubjectLine] = useState("✦ RIGHT TO FASHION SALE: New Y2K Drop is Live (50-80% OFF)");
  const [headline, setHeadline] = useState("RIGHT TO FASHION SALE");
  const [subheadline, setSubheadline] = useState("Exclusive Y2K Streetwear & Cyber Archive Collection");
  const [promoBadge, setPromoBadge] = useState("50–80% OFF");
  const [testEmail, setTestEmail] = useState("admin@bagifyyyy.in");

  // 1. Load Store Products & Stats
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, statsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/marketing/campaigns"),
        ]);

        const prodData = await prodRes.json();
        const statsData = await statsRes.json();

        const rawProducts = Array.isArray(prodData) ? prodData : (prodData.products || []);
        if (rawProducts.length > 0) {
          setProducts(rawProducts);
          // Default select first 4 products
          const initialIds = rawProducts.slice(0, 4).map((p: any) => p.id);
          setSelectedProductIds(initialIds);
        }

        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error("Error loading marketing data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 2. Refresh Email Live Preview when inputs change
  useEffect(() => {
    async function fetchPreview() {
      try {
        const res = await fetch("/api/marketing/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline,
            subheadline,
            promoBadge,
            productIds: selectedProductIds,
          }),
        });
        const data = await res.json();
        if (data.html) {
          setPreviewHtml(data.html);
        }
      } catch (err) {
        console.error("Failed to generate preview:", err);
      }
    }

    const timer = setTimeout(() => {
      fetchPreview();
    }, 400);

    return () => clearTimeout(timer);
  }, [headline, subheadline, promoBadge, selectedProductIds]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSendBroadcast = async (isTest = false) => {
    setStatusMessage(null);
    if (isTest && (!testEmail || !testEmail.includes("@"))) {
      setStatusMessage({ type: "error", text: "Please enter a valid test email address." });
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/marketing/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignTitle,
          subject: subjectLine,
          headline,
          subheadline,
          promoBadge,
          productIds: selectedProductIds,
          testRecipient: isTest ? testEmail : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: data.message || `Broadcast successfully sent to ${data.sentCount} subscribers!`,
        });
        // Refresh campaigns
        const updatedStats = await fetch("/api/marketing/campaigns").then((r) => r.json());
        setStats(updatedStats);
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to dispatch broadcast." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Network error sending email." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-6 sm:p-10">
      
      {/* Top Header */}
      <div className="max-w-[1500px] mx-auto mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-1">
            <span>BAGIFYYYY STUDIO</span> • <span>EMAIL ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-400" /> DROP CAMPAIGNS & EMAIL MARKETING
          </h1>
        </div>

        {/* Quick Metric Badges */}
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-md">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Subscribers</p>
            <p className="text-xl font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" /> {stats.subscriberCount}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-md">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Campaigns Sent</p>
            <p className="text-xl font-bold text-white flex items-center gap-1.5">
              <Send className="w-4 h-4 text-blue-400" /> {stats.campaigns.length}
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`max-w-[1500px] mx-auto mb-6 p-4 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/80 border border-emerald-500 text-emerald-300"
              : "bg-red-950/80 border border-red-500 text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMessage.text}
        </div>
      )}

      {/* Main 2-Column Studio Grid */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-8">
        
        {/* Left Column: Drop Campaign Composer */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#121212] border border-white/10 rounded-lg p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> 1. COMPOSE DROP CAMPAIGN
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Internal Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Summer Drop Broadcast"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Promo / Discount Badge
                </label>
                <input
                  type="text"
                  value={promoBadge}
                  onChange={(e) => setPromoBadge(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold text-amber-400"
                  placeholder="e.g. 50–80% OFF or FLAT ₹400 OFF"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Email Subject Line (What Customers See in Inbox)
              </label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                placeholder="✦ RIGHT TO FASHION: New Drop Live"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. RIGHT TO FASHION DROP"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Subheadline / Hook
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Limited Archive Streetwear Collection"
                />
              </div>
            </div>

            {/* Product Selector */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-blue-400" /> Select Featured Drop Products ({selectedProductIds.length} chosen)
                  </h3>
                  <p className="text-[11px] text-gray-400">These will be displayed in the 2-column visual grid inside the email with Shop Now buttons.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProductIds.length === products.length) {
                      setSelectedProductIds([]);
                    } else {
                      setSelectedProductIds(products.map((p) => p.id));
                    }
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:underline"
                >
                  {selectedProductIds.length === products.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading store products…</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProductSelection(prod.id)}
                        className={`p-2.5 rounded border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-950/40 border-blue-500 text-white"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <div className="relative w-10 h-12 bg-black/40 rounded overflow-hidden shrink-0">
                          <Image
                            src={prod.image || prod.images?.[0]?.url || prod.images?.[0] || "/placeholder.jpg"}
                            alt={prod.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{prod.name}</p>
                          <p className="text-[10px] text-gray-400">₹{prod.price}</p>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-white/30"}`}>
                          {isSelected ? "✓" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dispatch Bar */}
          <div className="bg-[#121212] border border-white/10 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Test Send */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="your.test.email@gmail.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 w-full sm:w-64"
              />
              <button
                type="button"
                onClick={() => handleSendBroadcast(true)}
                disabled={sending}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider shrink-0 transition-all"
              >
                Send Test
              </button>
            </div>

            {/* Broadcast to All */}
            <button
              type="button"
              onClick={() => handleSendBroadcast(false)}
              disabled={sending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded text-xs font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{sending ? "DISPATCHING BROADCAST…" : `🚀 BROADCAST TO ALL ${stats.subscriberCount} SUBSCRIBERS`}</span>
            </button>
          </div>

          {/* Campaign History Table */}
          <div className="bg-[#121212] border border-white/10 rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Past Campaign Dispatches ({stats.campaigns.length})
            </h3>

            {stats.campaigns.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">No marketing campaigns dispatched yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Title / Subject</th>
                      <th className="pb-3 font-semibold">Headline</th>
                      <th className="pb-3 font-semibold">Recipients</th>
                      <th className="pb-3 font-semibold">Date Sent</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.campaigns.map((c) => (
                      <tr key={c.id} className="text-gray-300">
                        <td className="py-3 font-medium text-white">{c.subject}</td>
                        <td className="py-3">{c.headline} ({c.promoBadge})</td>
                        <td className="py-3 font-mono">{c.sentCount}</td>
                        <td className="py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-3 text-right">
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                            SENT
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Email Preview Frame */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#121212] border border-white/10 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <Eye className="w-4 h-4 text-blue-400" /> Live Email Preview
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded text-xs transition-all ${
                  previewDevice === "desktop" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded text-xs transition-all ${
                  previewDevice === "mobile" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Preview Container */}
          <div className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden flex justify-center p-4 min-h-[640px]">
            <div
              className={`transition-all duration-300 bg-white rounded shadow-2xl overflow-hidden ${
                previewDevice === "mobile" ? "w-[375px] max-h-[680px]" : "w-full max-h-[680px]"
              }`}
            >
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="w-full h-[680px] border-0"
                />
              ) : (
                <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  Generating live drop preview…
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
