"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Smartphone, X, Copy, Check } from "lucide-react";

type OrderLike = {
  id: string;
  orderNumber: string;
  customerPhone: string;
  customerEmail?: string;
  totalAmount: number;
  orderStatus: string;
  paymentMethod?: string;
  trackingId?: string | null;
  customerName?: string;
  shippingAddress?: { fullName?: string; city?: string } | null;
};

type NotifyResult = {
  message: string;
  phone: string;
  manualLinks: { whatsapp: string; sms: string };
  twilio: { whatsapp: boolean; sms: boolean };
  orderNumber: string;
};

const CHANNELS = ["WHATSAPP", "SMS"] as const;

export default function MessageCustomerModal({
  order,
  onClose,
}: {
  order: OrderLike;
  onClose: () => void;
}) {
  const [channel, setChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<NotifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sentSid, setSentSid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/studio/orders/${order.id}/notify`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Failed to load message template.");
          return;
        }
        setInfo(data);
        setMessage(data.message || "");
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/orders/${order.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, message, auto: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Provider unavailable or send failed — fall back to manual link.
        const link = channel === "WHATSAPP" ? info?.manualLinks.whatsapp : info?.manualLinks.sms;
        if (link) window.open(link, "_blank", "noopener,noreferrer");
        setError(data.error || "Sent via your phone instead.");
        return;
      }
      if (data.provider === "twilio" && data.sid) {
        setSentSid(data.sid);
      } else {
        const link = channel === "WHATSAPP" ? data.manualLinks?.whatsapp : data.manualLinks?.sms;
        if (link) window.open(link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
      const link = channel === "WHATSAPP" ? info?.manualLinks.whatsapp : info?.manualLinks.sms;
      if (link) window.open(link, "_blank", "noopener,noreferrer");
      setError("Network error; opened manually.");
    } finally {
      setSending(false);
    }
  };

  const autoAvailable =
    info?.twilio && (channel === "WHATSAPP" ? info.twilio.whatsapp : info.twilio.sms);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="editorial-panel bg-white border border-y2k-gunmetal/20 max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-medium text-lg uppercase text-y2k-gunmetal">
              Message customer
            </h3>
            <p className="text-xs text-y2k-gunmetal/70 mt-1">
              Order #{order.orderNumber} · {order.customerPhone || order.customerEmail}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-y2k-gunmetal/60 hover:text-black cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-[10px] font-bold uppercase tracking-wider text-y2k-slate animate-pulse">
            Loading…
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChannel("WHATSAPP")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                  channel === "WHATSAPP"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-y2k-gunmetal/60 border-y2k-gunmetal/10"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel("SMS")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                  channel === "SMS"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-y2k-gunmetal/60 border-y2k-gunmetal/10"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> SMS
              </button>
              {info?.twilio && (channel === "WHATSAPP" ? info.twilio.whatsapp : info.twilio.sms) ? (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  API auto-send ready
                </span>
              ) : (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                  Opens your phone
                </span>
              )}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs font-medium text-y2k-gunmetal outline-none focus:border-y2k-gunmetal resize-none"
              />
            </label>

            {error && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                {error}
              </div>
            )}
            {sentSid && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2">
                Sent via Twilio. SID: {sentSid}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-y2k-gunmetal/10">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 hover:text-black px-3 py-2 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <div className="flex items-center gap-2">
                {info?.manualLinks && (
                  <a
                    href={channel === "WHATSAPP" ? info.manualLinks.whatsapp : info.manualLinks.sms}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider border border-y2k-gunmetal/10 text-y2k-gunmetal hover:bg-y2k-gunmetal hover:text-white transition-colors cursor-pointer"
                  >
                    Open link
                  </a>
                )}
                <button
                  type="button"
                  disabled={sending || !message.trim()}
                  onClick={handleSend}
                  className="btn-bagify px-5 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {sending ? "Sending…" : autoAvailable ? "Send now" : "Send via phone"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
