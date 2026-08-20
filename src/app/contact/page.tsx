"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", order: "", message: "" });
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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          orderNumber: formData.order || null,
          message: formData.message,
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
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">CONTACT CONCIERGE</span>
        </div>

        {/* Header */}
        <div className="mb-8 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            CONCIERGE &amp; CLIENT SUPPORT
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            GET IN TOUCH
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            Questions regarding drops, fit advice, or order fulfillment? We respond within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Form (7 cols) */}
          <div className="md:col-span-7 bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 shadow-xs">
            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-y2k-gunmetal mx-auto mb-2" />
                <h3 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-1">
                  MESSAGE DISPATCHED
                </h3>
                <p className="text-xs text-y2k-gunmetal/70 mb-5">
                  Our concierge team will review your inquiry and email you back shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", order: "", message: "" });
                  }}
                  className="btn-bagify px-5 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 block mb-1">
                    Your Name *
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal"
                    placeholder="Alex Vance"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 block mb-1">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal"
                    placeholder="alex@example.com"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 block mb-1">
                    Order Number (Optional)
                  </label>
                  <input
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal uppercase font-mono"
                    placeholder="BGF-1024"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 block mb-1">
                    Inquiry Details *
                  </label>
                  <textarea
                    required
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/10 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal resize-none"
                    placeholder="How can we assist you with this archive drop?"
                  />
                </div>

                {error && (
                  <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-bagify w-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Transmitting…" : "Send Message"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Info Side (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white border border-y2k-gunmetal/15 p-5 shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-3">
                DIRECT CHANNELS
              </span>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-y2k-gunmetal shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-y2k-gunmetal/60 block">Email Support</span>
                    <a href="mailto:support@bagifyyyy.com" className="font-bold text-y2k-gunmetal hover:underline">
                      support@bagifyyyy.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-y2k-gunmetal shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-y2k-gunmetal/60 block">WhatsApp &amp; Phone</span>
                    <a href="tel:+919876543210" className="font-bold text-y2k-gunmetal hover:underline">
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-y2k-gunmetal shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-y2k-gunmetal/60 block">Hours</span>
                    <p className="text-y2k-gunmetal/80">Mon – Sat: 10am – 7pm IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-y2k-gunmetal text-white p-4 border border-y2k-gunmetal text-xs">
              <p className="font-bold uppercase tracking-wider text-[10px] mb-1">Live Instagram DM</p>
              <p className="text-white/70 text-[11px] leading-snug">
                For rapid pre-sale sizing checks or drop announcements, message us on Instagram @bagifyyyy.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
