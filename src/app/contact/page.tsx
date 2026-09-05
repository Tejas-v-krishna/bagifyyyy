"use client";

import { useState } from "react";
import { Mail, Phone, Clock, Send, CheckCircle2 } from "lucide-react";
import { getRecaptchaToken } from "@/lib/recaptcha";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", order: "", message: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken("contact");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          orderNumber: formData.order || null,
          message: formData.message,
          honeypot: formData.website,
          recaptchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorialPageShell
       eyebrow="Help / Contact"
      title="Get in touch"
       description="Questions about a piece, your fit, or an order? Send us a note and we will reply within 24 hours."
      wide
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Form (7 cols) */}
        <div className="md:col-span-7 rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
          {submitted ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#f2f2f2] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-sans font-bold text-xl uppercase tracking-tight text-black mb-2">
                 MESSAGE SENT
              </h3>
              <p className="text-xs text-black/60 max-w-sm mx-auto mb-6 leading-relaxed">
                 We got your message. We will reply by email within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: "", email: "", order: "", message: "", website: "" });
                }}
                className="btn-bagify btn-bagify-dark px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="website" value={formData.website} onChange={handleChange} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/70 block mb-1.5">
                  Your Name *
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#f8f8f8] border border-black/10 rounded-lg px-3.5 py-2.5 text-xs text-black outline-none focus:bg-white focus:border-black transition-colors"
                  placeholder="Alex Vance"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/70 block mb-1.5">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#f8f8f8] border border-black/10 rounded-lg px-3.5 py-2.5 text-xs text-black outline-none focus:bg-white focus:border-black transition-colors"
                  placeholder="alex@example.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/70 block mb-1.5">
                  Order Number (Optional)
                </label>
                <input
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full bg-[#f8f8f8] border border-black/10 rounded-lg px-3.5 py-2.5 text-xs text-black outline-none focus:bg-white focus:border-black transition-colors uppercase font-mono"
                  placeholder="BGF-1024"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/70 block mb-1.5">
                   Message *
                </label>
                <textarea
                  required
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-[#f8f8f8] border border-black/10 rounded-lg px-3.5 py-2.5 text-xs text-black outline-none focus:bg-white focus:border-black transition-colors resize-none"
                   placeholder="What can we help with?"
                />
              </div>

              {error && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-bagify btn-bagify-dark w-full py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Transmitting…" : "Send Message"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Info Side (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          <div className="rounded-2xl bg-white border border-black/10 p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45 block mb-5">
               CONTACT DETAILS
            </span>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-black" />
                </div>
                <div>
                   <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-black/45 block">Email</span>
                  <a href="mailto:support@bagifyyyy.com" className="font-semibold text-black hover:underline">
                    support@bagifyyyy.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-black" />
                </div>
                <div>
                   <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-black/45 block">WhatsApp / Phone</span>
                  <a href="tel:+919876543210" className="font-semibold text-black hover:underline">
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-black" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-black/45 block">Hours</span>
                  <p className="text-black/80 font-semibold">Mon – Sat: 10am – 7pm IST</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-black text-white p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 block mb-2">
               FIND US ON INSTAGRAM
            </span>
            <h4 className="text-base font-bold uppercase tracking-tight text-white mb-2">
              Live Instagram DM
            </h4>
            <p className="text-white/65 text-xs leading-relaxed mb-4">
               For quick sizing questions and fit checks, message us on Instagram.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              @bagifyyyy →
            </a>
          </div>
        </div>
      </div>
    </EditorialPageShell>
  );
}
