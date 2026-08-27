"use client";

import React, { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [honeypot, setHoneypot] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, honeypot }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("You're subscribed! Use code BAGIFY10 for 10% off.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col mb-6">
      <form
        className="w-full flex flex-col sm:flex-row gap-4"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <input
          type="email"
          placeholder="ENTER YOUR EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 bg-y2k-gunmetal border border-[#F8F5E9] text-[#F8F5E9] placeholder-[#F8F5E9]/50 px-6 py-4 outline-none font-bold text-xs tracking-wider focus:bg-white/5 transition-colors rounded-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-[#F8F5E9] text-y2k-gunmetal font-bold uppercase tracking-wider px-8 py-4 whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === "loading" ? "JOINING..." : "SUBSCRIBE"}
        </button>
      </form>
      {message && (
        <p
          className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
            status === "success" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
