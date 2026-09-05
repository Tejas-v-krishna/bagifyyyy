"use client";

import { useState } from "react";

interface NotifyMeSectionProps {
  productId: string;
}

export default function NotifyMeSection({ productId }: NotifyMeSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId }),
      });
      
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full border border-black p-4 text-center mb-4 bg-gray-50">
        <p className="text-[10px] font-bold uppercase tracking-wider text-black">
           We&apos;ll email you if this piece comes back.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 mb-4">
      <input 
        type="email" 
        required
         placeholder="YOUR EMAIL"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-black px-4 py-3 text-xs font-bold uppercase tracking-wider bg-white text-black outline-none placeholder-gray-400"
      />
      <button 
        type="submit"
        disabled={status === "loading"}
        className="w-full border border-black text-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center px-4 py-3 disabled:opacity-50"
      >
        <span className="text-xs font-bold uppercase tracking-wider">
           {status === "loading" ? "SENDING..." : "EMAIL ME IF IT RETURNS"}
        </span>
      </button>
      {status === "error" && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mt-2 text-center">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
