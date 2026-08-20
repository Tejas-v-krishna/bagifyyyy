"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-bold text-sm uppercase tracking-wider mb-4">Invalid or missing reset token.</p>
        <Link href="/login" className="text-xs font-bold underline underline-offset-4 text-y2k-gunmetal">Return to Login →</Link>
      </div>
    );
  }

  return (
    <div className="bg-y2k-ice min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-20 text-y2k-gunmetal">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>

        <div className="bg-white border border-y2k-gunmetal/15 shadow-xl p-8">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
              <h1 className="font-display text-2xl uppercase tracking-tight">Password Updated!</h1>
              <p className="text-xs text-y2k-gunmetal/70">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-y2k-slate mb-1">BAGIFYYYY Account</p>
              <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-tight mb-2">Set New Password</h1>
              <p className="text-xs text-y2k-gunmetal/60 mb-7">Enter a new password for your account. Must be at least 8 characters.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-y2k-gunmetal/10 px-4 py-3 text-sm outline-none focus:border-y2k-gunmetal transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 mb-1 block">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full border border-y2k-gunmetal/10 px-4 py-3 text-sm outline-none focus:border-y2k-gunmetal transition-all"
                  />
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 border border-red-200 p-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-bagify text-white text-[11px] font-bold uppercase tracking-wider py-3.5 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Updating…" : "UPDATE PASSWORD →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-y2k-ice min-h-screen flex items-center justify-center text-xs font-bold uppercase tracking-wider">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
