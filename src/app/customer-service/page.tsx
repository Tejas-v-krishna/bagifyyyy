"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Mail, Phone, Clock, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CustomerServicePage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("Order Inquiry");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen pb-24 font-sans">
      {/* ── Hero Banner ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-12 border-b border-y2k-gunmetal/15">
        <p className="text-xs font-bold uppercase tracking-widest text-y2k-slate mb-2">
          HELP &amp; CONCIERGE
        </p>
        <h1 className="font-display text-4xl sm:text-6xl lg:text-[72px] uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-4">
          CUSTOMER SERVICE
        </h1>
        <p className="text-sm md:text-base text-y2k-gunmetal/80 font-medium max-w-2xl leading-relaxed">
          Need assistance with an archive drop, size fitting, order tracking, or return? Our dedicated support team is at your disposal 7 days a week.
        </p>
      </section>

      {/* ── Quick Contact Channels ────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 md:p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal mb-2">
                EMAIL SUPPORT
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed mb-4">
                Reach out for detailed order inquiries, authentication certificates, or custom order requests.
              </p>
            </div>
            <div>
              <a
                href="mailto:support@bagifyyyy.com"
                className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:underline flex items-center gap-1.5"
              >
                support@bagifyyyy.com <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-[10px] text-y2k-slate block mt-1">Average response: &lt; 2 hours</span>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center mb-6">
                <Phone className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal mb-2">
                PHONE &amp; WHATSAPP
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed mb-4">
                Speak directly with an archive specialist or message us on WhatsApp for rapid drop assistance.
              </p>
            </div>
            <div>
              <a
                href="tel:+919876543210"
                className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:underline flex items-center gap-1.5"
              >
                +91 (0) 800-BAGIFY <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-[10px] text-y2k-slate block mt-1">Mon – Sun: 10:00 AM – 8:00 PM IST</span>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 border border-y2k-gunmetal/15 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-y2k-ice flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-y2k-gunmetal" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal mb-2">
                SELF-SERVICE PORTAL
              </h3>
              <p className="text-xs text-y2k-gunmetal/75 leading-relaxed mb-4">
                Initiate a seamless return, exchange, check statutory withdrawal rights, or track a shipment.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/return-request"
                className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal hover:underline flex items-center gap-1.5"
              >
                Request a Return / Exchange <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/faq"
                className="text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal flex items-center gap-1.5"
              >
                View FAQ Database <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Direct Support Inquiry Form ────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <div className="bg-white border border-y2k-gunmetal/15 p-8 md:p-12 shadow-sm">
          <div className="max-w-xl mb-8">
            <h2 className="font-display font-medium text-2xl md:text-3xl uppercase tracking-tight text-y2k-gunmetal mb-2">
              SUBMIT A SUPPORT TICKET
            </h2>
            <p className="text-xs text-y2k-gunmetal/80 leading-relaxed">
              Fill out the form below and an assigned concierge specialist will review your case and get back to you promptly.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-8 bg-y2k-ice border border-y2k-gunmetal/20 flex flex-col items-center text-center max-w-md mx-auto">
              <CheckCircle2 className="w-12 h-12 text-y2k-gunmetal mb-3" />
              <h3 className="font-display font-medium text-xl uppercase tracking-tight text-y2k-gunmetal mb-1">
                TICKET SUBMITTED
              </h3>
              <p className="text-xs text-y2k-gunmetal/80 mb-6">
                Your ticket has been logged with reference <strong>#BG-{(Math.random() * 90000 + 10000).toFixed(0)}</strong>. A confirmation email has been dispatched.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="btn-bagify text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  FULL NAME*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex River"
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  EMAIL ADDRESS*
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  ORDER NUMBER (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BGF-98234"
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  INQUIRY TYPE*
                </label>
                <select
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                >
                  <option value="Order Inquiry">Order Inquiry &amp; Tracking</option>
                  <option value="Return / Exchange">Return, Exchange &amp; Refund</option>
                  <option value="Size & Fit Advisory">Size &amp; Fit Advisory</option>
                  <option value="Product Authentication">Product Authentication &amp; Archive Details</option>
                  <option value="Billing / Payment">Billing &amp; Payment Verification</option>
                  <option value="Other">Other Concierge Request</option>
                </select>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-1">
                  MESSAGE / DETAILS*
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Please provide specifics regarding your query..."
                  className="w-full text-xs font-medium text-black border border-y2k-soft/50 p-3.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 flex justify-start">
                <button
                  type="submit"
                  className="btn-bagify text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 hover:opacity-90 transition-opacity"
                >
                  TRANSMIT TICKET
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
