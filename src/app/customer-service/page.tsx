"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, Clock, ArrowRight, CheckCircle2, ShieldQuestion } from "lucide-react";

export default function CustomerServicePage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketRef(`#BG-${Math.floor(Math.random() * 90000 + 10000)}`);
    setFormSubmitted(true);
  };

  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">CUSTOMER CONCIERGE</span>
        </div>

        {/* Header */}
        <div className="mb-8 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            CLIENT SERVICES &amp; HELP DESK
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            CUSTOMER SERVICE
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            Assistance with archive drops, fit advice, orders, and authentication.
          </p>
        </div>

        {/* Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <Mail className="w-4 h-4 text-y2k-gunmetal mb-2" />
              <h3 className="font-bold text-xs uppercase tracking-wider mb-1">EMAIL CONCIERGE</h3>
              <p className="text-[11px] text-y2k-gunmetal/70 mb-3">
                Order inquiries, provenance questions, or custom requests.
              </p>
            </div>
            <a href="mailto:support@bagifyyyy.com" className="text-[11px] font-bold uppercase text-y2k-gunmetal hover:underline flex items-center gap-1">
              support@bagifyyyy.com <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <Phone className="w-4 h-4 text-y2k-gunmetal mb-2" />
              <h3 className="font-bold text-xs uppercase tracking-wider mb-1">PHONE &amp; WHATSAPP</h3>
              <p className="text-[11px] text-y2k-gunmetal/70 mb-3">
                Speak directly with an archive specialist.
              </p>
            </div>
            <a href="tel:+919876543210" className="text-[11px] font-bold uppercase text-y2k-gunmetal hover:underline flex items-center gap-1">
              +91 98765 43210 <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <Clock className="w-4 h-4 text-y2k-gunmetal mb-2" />
              <h3 className="font-bold text-xs uppercase tracking-wider mb-1">LIVE DISPATCH &amp; FAQ</h3>
              <p className="text-[11px] text-y2k-gunmetal/70 mb-3">
                Check courier speeds, size guides, and policy FAQs.
              </p>
            </div>
            <Link href="/faq" className="text-[11px] font-bold uppercase text-y2k-gunmetal hover:underline flex items-center gap-1">
              Browse FAQ <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="bg-white border border-y2k-gunmetal/15 p-5 sm:p-6 shadow-xs">
          <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal mb-1">
            SUBMIT A SERVICE INQUIRY
          </h2>
          <p className="text-xs text-y2k-gunmetal/70 mb-5">
            Fill out the form below to receive a response from our concierge team.
          </p>

          {formSubmitted ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-y2k-gunmetal mx-auto mb-2" />
              <h3 className="font-display font-medium text-base uppercase tracking-tight mb-1">
                TICKET SUBMITTED ({ticketRef})
              </h3>
              <p className="text-xs text-y2k-gunmetal/70 mb-4">
                Our support team will review your message and reply via email.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="btn-bagify px-4 py-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 block mb-1">
                  Full Name *
                </label>
                <input
                  required
                  placeholder="Alex Vance"
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 block mb-1">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  placeholder="alex@example.com"
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 block mb-1">
                  Inquiry Category
                </label>
                <select className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal">
                  <option>Order &amp; Shipping Status</option>
                  <option>Size &amp; Fit Consultation</option>
                  <option>Authentication &amp; Sourcing</option>
                  <option>VIP Chrome Club Points</option>
                  <option>Other Inquiry</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/70 block mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry..."
                  className="w-full bg-y2k-ice/40 border border-y2k-gunmetal/20 px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal resize-none"
                />
              </div>

              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="btn-bagify w-full py-3 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
