"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/studio";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError("Incorrect password. Access denied.");
        setPassword("");
      }
    } catch {
      setError("Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-y2k-ice text-y2k-gunmetal flex flex-col items-center justify-center px-4 font-sans relative">
      {/* Return to Public Store link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Public Store</span>
      </Link>

      <div className="w-full max-w-sm bg-white border border-y2k-gunmetal/15 p-8 shadow-xl">
        {/* Brand Header */}
        <div className="text-center mb-8 pb-6 border-b border-y2k-gunmetal/15">
          <Image
            src="/logo.png"
            alt="Bagifyyyy Logo"
            width={160}
            height={36}
            className="object-contain mx-auto mb-3"
            priority
          />
          <div className="inline-flex items-center gap-1.5 bg-y2k-ice border border-y2k-gunmetal/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>STUDIO CONTROL PASSPORT</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70">
              Admin Access Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="Enter studio key"
              className="bg-y2k-ice/40 border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-3 text-sm outline-none focus:border-y2k-gunmetal font-medium transition-colors placeholder:text-y2k-gunmetal/30"
            />
          </div>

          {error && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 p-2.5 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-bagify w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-sm"
          >
            <span>{loading ? "Authenticating…" : "Unlock Studio Operations"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-[9px] uppercase tracking-wider text-y2k-gunmetal/40 mt-6 pt-4 border-t border-y2k-gunmetal/10">
          Internal Restricted Control Interface
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-y2k-ice flex items-center justify-center text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
          Loading Control Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
