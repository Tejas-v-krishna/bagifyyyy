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
  Eye,
  ShieldCheck
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
          setSelectedProductIds(rawProducts.slice(0, 4).map((p: any) => p.id));
        }

        if (statsData.subscribersCount !== undefined) {
          setStats({
            subscriberCount: statsData.subscribersCount || 0,
            campaigns: statsData.campaigns || [],
            recentSubscribers: statsData.recentSubscribers || [],
          });
        }
      } catch (err) {
        console.error("Failed to load marketing data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 2. Generate Live Email HTML Preview
  useEffect(() => {
    if (products.length === 0) return;

    const selectedProds = products.filter((p) => selectedProductIds.includes(p.id));

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #E8EDF2; margin: 0; padding: 20px; color: #28323F; }
  .container { max-width: 600px; margin: 0 auto; bg-color: #FFFFFF; background: #FFFFFF; border: 1px solid rgba(40,50,63,0.15); }
  .header { padding: 30px; text-align: center; border-bottom: 1px solid rgba(40,50,63,0.1); background: #E8EDF2; }
  .badge { background: #28323F; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; letter-spacing: 2px; display: inline-block; margin-top: 10px; }
  .title { font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 15px 0 5px 0; color: #28323F; }
  .subtitle { font-size: 12px; color: #5F7591; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
  .grid { display: table; width: 100%; border-collapse: collapse; padding: 20px; }
  .card { display: inline-block; width: 46%; margin: 2%; vertical-align: top; background: #FFFFFF; border: 1px solid rgba(40,50,63,0.12); box-sizing: border-box; }
  .card-img { width: 100%; height: 200px; object-fit: cover; background: #E8EDF2; }
  .card-body { padding: 12px; text-align: center; }
  .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #28323F; margin: 0 0 4px 0; }
  .card-price { font-size: 13px; font-weight: 900; color: #28323F; margin: 0 0 10px 0; }
  .btn { background: #28323F; color: #FFFFFF; padding: 8px 14px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; display: inline-block; }
  .footer { padding: 20px; text-align: center; font-size: 10px; color: #5F7591; border-top: 1px solid rgba(40,50,63,0.1); background: #E8EDF2; text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 20px; font-weight: 900; letter-spacing: 4px; color: #28323F;">BAGIFYYYY</div>
      <div class="badge">${promoBadge}</div>
      <div class="title">${headline}</div>
      <div class="subtitle">${subheadline}</div>
    </div>
    <div className="grid" style="padding: 20px 10px;">
      ${selectedProds.map(p => `
        <div class="card">
          <img src="${p.image || p.images?.[0]?.url || '/placeholder.jpg'}" class="card-img" />
          <div class="card-body">
            <div class="card-title">${p.name}</div>
            <div class="card-price">₹${p.price}</div>
            <a href="https://bagifyyyy.in/product/${p.id}" class="btn">Shop Piece →</a>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      © 2026 BAGIFYYYY • PREMIUM STREETWEAR<br>
      You are receiving this email because you subscribed to Bagifyyyy updates.
    </div>
  </div>
</body>
</html>
    `;

    setPreviewHtml(html);
  }, [headline, subheadline, promoBadge, products, selectedProductIds]);

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // 3. Dispatch Broadcast Campaign API
  const handleSendBroadcast = async (isTest: boolean) => {
    try {
      setSending(true);
      setStatusMessage(null);

      const selectedProds = products.filter((p) => selectedProductIds.includes(p.id));

      const res = await fetch("/api/marketing/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTest,
          testEmail,
          campaignTitle,
          subjectLine,
          headline,
          subheadline,
          promoBadge,
          products: selectedProds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed.");

      setStatusMessage({
        type: "success",
        text: isTest
          ? `Test email sent to ${testEmail} successfully!`
          : `Broadcast campaign "${campaignTitle}" sent to all ${data.recipientCount || stats.subscriberCount} subscribers!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to send email broadcast." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            PROMOTIONS
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            EMAIL MARKETING
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-y2k-gunmetal/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal flex items-center gap-2 shadow-2xs">
            <Users className="w-4 h-4 text-y2k-slate" />
            <span>{stats.subscriberCount} Active Subscribers</span>
          </div>
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 border text-xs font-bold uppercase tracking-wider flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-white border-y2k-gunmetal text-y2k-gunmetal"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-y2k-gunmetal shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8">
        
        {/* Left Column: Drop Campaign Form */}
        <div className="space-y-6">
          <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 shadow-xs">
            <h2 className="font-display text-base uppercase tracking-tight text-y2k-gunmetal mb-6 flex items-center gap-2 pb-3 border-b border-y2k-gunmetal/10">
              <Sparkles className="w-4 h-4 text-y2k-gunmetal" /> 1. COMPOSE DROP CAMPAIGN
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1.5">
                  Internal Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium"
                  placeholder="e.g. Summer Drop Broadcast"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1.5">
                  Promo / Discount Badge *
                </label>
                <input
                  type="text"
                  value={promoBadge}
                  onChange={(e) => setPromoBadge(e.target.value)}
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-bold"
                  placeholder="e.g. 50–80% OFF"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1.5">
                Email Subject Line (Inbox Headline) *
              </label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium"
                placeholder="✦ RIGHT TO FASHION: New Drop Live"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1.5">
                  Banner Headline *
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-bold uppercase"
                  placeholder="e.g. RIGHT TO FASHION DROP"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-y2k-slate mb-1.5">
                  Subheadline / Hook *
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium"
                  placeholder="e.g. Limited Archive Collection"
                />
              </div>
            </div>

            {/* Product Selector */}
            <div className="border-t border-y2k-gunmetal/15 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-y2k-gunmetal" /> Featured Pieces ({selectedProductIds.length} chosen)
                  </h3>
                  <p className="text-[10px] text-y2k-gunmetal/60">Selected pieces will be formatted into the email showcase grid.</p>
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
                  className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate hover:text-black underline cursor-pointer"
                >
                  {selectedProductIds.length === products.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-y2k-slate font-bold uppercase tracking-wider">Loading catalog products…</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProductSelection(prod.id)}
                        className={`p-2.5 border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-y2k-ice border-y2k-gunmetal text-y2k-gunmetal font-bold shadow-2xs"
                            : "bg-white border-y2k-gunmetal/15 text-y2k-gunmetal/70 hover:border-y2k-gunmetal/40"
                        }`}
                      >
                        <div className="relative w-10 h-12 bg-y2k-ice border border-y2k-gunmetal/10 overflow-hidden shrink-0">
                          <Image
                            src={prod.image || prod.images?.[0]?.url || prod.images?.[0] || "/placeholder.jpg"}
                            alt={prod.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{prod.name}</p>
                          <p className="font-bold text-[10px] text-y2k-gunmetal/60">₹{prod.price}</p>
                        </div>
                        <div className={`w-4 h-4 border flex items-center justify-center text-[10px] font-bold ${isSelected ? "bg-y2k-gunmetal border-y2k-gunmetal text-white" : "border-y2k-gunmetal/15"}`}>
                          {isSelected ? "✓" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dispatch Control Bar */}
          <div className="bg-white border border-y2k-gunmetal/15 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Test Send */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="your.test@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2.5 text-xs text-y2k-gunmetal outline-none focus:border-y2k-gunmetal font-medium w-full sm:w-60"
              />
              <button
                type="button"
                onClick={() => handleSendBroadcast(true)}
                disabled={sending}
                className="bg-white border border-y2k-gunmetal/10 hover:bg-y2k-ice text-y2k-gunmetal px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                Send Test
              </button>
            </div>

            {/* Broadcast to All */}
            <button
              type="button"
              onClick={() => handleSendBroadcast(false)}
              disabled={sending}
              className="w-full sm:w-auto btn-bagify px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{sending ? "DISPATCHING…" : `DISPATCH TO ${stats.subscriberCount} SUBSCRIBERS`}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Email Preview Frame */}
        <div className="space-y-4">
          <div className="bg-white border border-y2k-gunmetal/15 p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
              <Eye className="w-4 h-4 text-y2k-gunmetal" /> Live Email Preview
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-y2k-ice p-1 border border-y2k-gunmetal/15">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 text-xs transition-all cursor-pointer ${
                  previewDevice === "desktop" ? "bg-y2k-gunmetal text-white" : "text-y2k-slate hover:text-black"
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 text-xs transition-all cursor-pointer ${
                  previewDevice === "mobile" ? "bg-y2k-gunmetal text-white" : "text-y2k-slate hover:text-black"
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Preview Container */}
          <div className="bg-y2k-ice border border-y2k-gunmetal/15 p-4 flex justify-center min-h-[640px] shadow-xs">
            <div
              className={`transition-all duration-300 bg-white border border-y2k-gunmetal/15 shadow-xl overflow-hidden ${
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
                <div className="p-12 text-center text-xs text-y2k-slate flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-y2k-gunmetal" />
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
