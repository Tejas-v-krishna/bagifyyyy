"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

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
        setError(data.error || "Failed to send message. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen flex flex-col">
      {/* Header */}
      <header className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-24 text-center w-full">
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter font-black">
          GET IN TOUCH
        </h1>
        <p className="mt-6 text-xl font-bold tracking-widest uppercase">
          WE'RE HERE TO HELP.
        </p>
      </header>

      {/* Main Content */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 w-full flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* Left: Contact Form */}
          <div>
            {submitted ? (
              <div className="bg-y2k-gunmetal text-[#F8F5E9] p-8 h-full flex flex-col justify-center items-center text-center">
                <CheckCircle2 className="w-10 h-10 mb-4 text-green-400" />
                <h3 className="font-display text-3xl uppercase tracking-tighter font-black mb-4">
                  MESSAGE SENT!
                </h3>
                <p className="text-lg">
                  We'll get back to you within 24 hours.
                </p>
                <button 
                  onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", order: "", message: "" }); }}
                  className="mt-8 border-b-2 border-[#F8F5E9] pb-1 uppercase tracking-widest font-bold hover:text-gray-300 transition-colors"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block font-bold uppercase tracking-widest mb-2">Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    className="w-full bg-white/50 border border-y2k-gunmetal/30 p-4 focus:outline-none focus:border-y2k-gunmetal transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block font-bold uppercase tracking-widest mb-2">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    className="w-full bg-white/50 border border-y2k-gunmetal/30 p-4 focus:outline-none focus:border-y2k-gunmetal transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="order" className="block font-bold uppercase tracking-widest mb-2">Order Number (Optional)</label>
                  <input 
                    type="text" 
                    id="order"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder="BGF-XXXXX"
                    className="w-full bg-white/50 border border-y2k-gunmetal/30 p-4 focus:outline-none focus:border-y2k-gunmetal transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block font-bold uppercase tracking-widest mb-2">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required 
                    className="w-full bg-white/50 border border-y2k-gunmetal/30 p-4 focus:outline-none focus:border-y2k-gunmetal transition-colors resize-none"
                  ></textarea>
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 border border-red-200 p-3">{error}</p>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#232D3B] text-[#F8F5E9] rounded-none font-bold uppercase tracking-widest px-8 py-4 hover:bg-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "SENDING…" : "SEND MESSAGE"}
                </button>
              </form>
            )}
          </div>

          {/* Right: Brand Info */}
          <div className="flex flex-col justify-center space-y-12">
            <div>
              <h2 className="font-display text-4xl uppercase tracking-tighter font-black mb-6">
                SUPPORT
              </h2>
              <ul className="space-y-4 text-lg">
                <li>
                  <span className="font-bold uppercase tracking-widest block mb-1 text-sm text-y2k-gunmetal/70">Email</span>
                  <a href="mailto:support@bagifyyyy.com" className="hover:underline">support@bagifyyyy.com</a>
                </li>
                <li>
                  <span className="font-bold uppercase tracking-widest block mb-1 text-sm text-y2k-gunmetal/70">Phone</span>
                  <a href="tel:+919876543210" className="hover:underline">+91 98765 43210</a>
                </li>
                <li>
                  <span className="font-bold uppercase tracking-widest block mb-1 text-sm text-y2k-gunmetal/70">Hours</span>
                  <span>Mon-Sat, 10am-6pm IST</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-4xl uppercase tracking-tighter font-black mb-6">
                SOCIALS
              </h2>
              <div className="flex space-x-8 text-lg font-bold uppercase tracking-widest">
                <a href="https://instagram.com/bagifyyyy" target="_blank" rel="noopener noreferrer" className="hover:underline decoration-2 underline-offset-4">Instagram</a>
                <a href="https://x.com/bagifyyyy" target="_blank" rel="noopener noreferrer" className="hover:underline decoration-2 underline-offset-4">Twitter/X</a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bottom Band */}
      <div className="w-full mt-auto bg-y2k-gunmetal text-[#F8F5E9] py-6 px-4 text-center">
        <p className="font-bold uppercase tracking-widest text-sm md:text-base">
          LIVE CHAT COMING SOON — DM US ON INSTAGRAM FOR FASTEST RESPONSE
        </p>
      </div>
    </div>
  );
}
