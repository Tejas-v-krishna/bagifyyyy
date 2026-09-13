"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowRight, ArrowLeft, KeyRound, Smartphone } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/studio";

  const [step, setStep] = useState<"password" | "totp">("password");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        if (data?.requires2FA) {
          setStep("totp");
          setError("");
        } else if (data?.success) {
          router.push(from);
          router.refresh();
        }
      } else {
        setError(data?.error || "Incorrect password. Access denied.");
        setPassword("");
      }
    } catch {
      setError("Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: totpCode.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(data?.error || "Invalid 6-digit authenticator code.");
        setTotpCode("");
      }
    } catch {
      setError("Authentication verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editorial-page w-full min-h-screen bg-y2k-ice text-y2k-gunmetal flex flex-col items-center justify-center px-4 font-sans relative">
      {/* Return to Public Store link */}
      <Link
        href={process.env.NEXT_PUBLIC_APP_URL || "/"}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Public Store</span>
      </Link>

      <div className="editorial-panel w-full max-w-sm bg-white border border-y2k-gunmetal/15 p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8 pb-6 border-b border-y2k-gunmetal/15">
          <Image
            src="/bagifyyyy-wordmark.webp"
            alt="Bagifyyyy Logo"
            width={640}
            height={166}
            className="object-contain mx-auto mb-3"
          />
          <div className="inline-flex items-center gap-1.5 bg-y2k-ice border border-y2k-gunmetal/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal">
            {step === "password" ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>STUDIO CONTROL PASSPORT</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>TWO-FACTOR AUTHENTICATION</span>
              </>
            )}
          </div>
        </div>

        {/* Step 1: Password */}
        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 flex items-center justify-between">
                <span>Admin Access Password *</span>
                <KeyRound className="w-3 h-3 text-y2k-gunmetal/40" />
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
              className="btn-bagify w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>{loading ? "Authenticating…" : "Unlock Studio Operations"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Step 2: Google Authenticator 2FA */}
        {step === "totp" && (
          <form onSubmit={handleTotpSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 flex items-center justify-between">
                <span>Google Authenticator 6-Digit Code *</span>
                <Smartphone className="w-3 h-3 text-y2k-gunmetal/40" />
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                placeholder="000000"
                className="bg-y2k-ice/40 border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-3 text-lg font-mono text-center tracking-[0.3em] outline-none focus:border-y2k-gunmetal font-bold transition-colors placeholder:text-y2k-gunmetal/20"
              />
              <p className="text-[9px] text-y2k-gunmetal/50 mt-1 leading-normal">
                Enter the dynamic 6-digit code currently showing in your Google Authenticator app.
              </p>
            </div>

            {error && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 p-2.5 border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="btn-bagify w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>{loading ? "Verifying Code…" : "Verify & Enter Studio"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("password");
                setError("");
                setTotpCode("");
              }}
              className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 hover:text-black transition-colors text-center mt-1 py-1"
            >
              ← Back to Password
            </button>
          </form>
        )}

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
