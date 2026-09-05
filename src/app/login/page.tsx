"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type GoogleTokenResponse = { access_token?: string; credential?: string };

function getSafeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (response: GoogleTokenResponse) => Promise<void>;
  onError: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const trigger = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      try {
        await onSuccess(response);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setLoading(false);
      onError();
    },
    onNonOAuthError: () => {
      setLoading(false);
      onError();
    },
  });

  return (
    <button
      type="button"
      onClick={() => {
        try {
          trigger();
        } catch {
          onError();
        }
      }}
      disabled={loading}
      className="mb-5 flex w-full cursor-pointer items-center justify-center gap-3 border border-black/15 bg-[#f5f5f2] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:border-black hover:bg-white disabled:cursor-wait disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      )}
      <span>{loading ? "Connecting..." : "Continue with Google"}</span>
    </button>
  );
}

function LoginContent() {
  const { isAuthenticated, setUser, setIsAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = getSafeReturnPath(searchParams.get("from"));

  const [view, setView] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.push(from);
    }
  }, [isAuthenticated, router, from]);

  const switchView = (v: "login" | "register") => {
    setView(v);
    setError("");
    setSuccess("");
    setForgotMode(false);
    setForgotSuccess("");
  };

  const handleForgotPassword = async () => {
    setForgotLoading(true);
    setForgotSuccess("");
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      // Always show success to prevent email enumeration
      setForgotSuccess("If that email is registered, a reset link has been sent.");
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Google Sign-In. The popup flow hands back an `access_token`; One Tap hands
  // back a `credential` (ID token). Either is forwarded verbatim to the server.
  const handleGoogleSuccess = async (tokenResponse: GoogleTokenResponse) => {
    try {
      setError("");

      let res;
      if (tokenResponse.credential) {
        res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: tokenResponse.credential }),
        });
      } else if (tokenResponse.access_token) {
        // Send the raw token — the server exchanges it with Google itself, so the
        // browser never gets to assert which account is signing in.
        res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });
      } else {
        throw new Error("No Google token received");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google Sign-In failed.");
      }

      setUser(data.user);
      setIsAuthenticated(true);
      setSuccess("Signed in successfully with Google!");
      setTimeout(() => {
        router.push(from);
      }, 800);
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Google authentication failed. Please try again."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (view === "register") {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed.");
        } else {
          setSuccess("Account created! Redirecting to archive...");
          setUser(data.user);
          setIsAuthenticated(true);
          setTimeout(() => {
            router.push(from);
          }, 800);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    }

    if (view === "login") {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed.");
        } else {
          setSuccess("Signed in successfully! Redirecting...");
          setUser(data.user);
          setIsAuthenticated(true);
          setTimeout(() => {
            router.push(from);
          }, 800);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    }

    setLoading(false);
  };
  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black selection:bg-black selection:text-white sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1240px]">
        {/* Top Back Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center justify-between border-b border-black/10 pb-3"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to shop
          </Link>
        </motion.div>

        {/* Main Split Portal Container */}
        <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-xl border border-black/10 bg-white lg:grid-cols-12">
          {/* Left Form Column (7 Columns) */}
          <div className="flex flex-col justify-between bg-white p-6 sm:p-10 lg:col-span-7 lg:p-14">
            <div>
              {/* Header */}
              <div className="mb-8">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">
                  Personal archive / Access
                </span>
                <h1 className="max-w-[12ch] font-microgramma text-[clamp(2.3rem,5vw,5rem)] font-bold uppercase leading-[0.86] tracking-[-0.05em] text-black">
                  {view === "login" ? "Sign in" : "Create account"}
                </h1>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-black/55">
                  {view === "login"
                    ? "Keep your saved pieces, orders, and Chrome Club progress together."
                    : "Join the archive for 10% off your first order and first access to new drops."}
                </p>
              </div>

              {/* View Toggle Tabs */}
              <div className="mb-7 flex border-b border-black/10" role="tablist" aria-label="Account access mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "login"}
                  aria-controls="email-auth-form"
                  onClick={() => switchView("login")}
                  className={`relative flex-1 cursor-pointer py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] transition-colors sm:text-[11px] ${
                    view === "login" ? "text-black font-black" : "text-black/40 hover:text-black"
                  }`}
                >
                  SIGN IN
                  {view === "login" && (
                    <motion.div
                      layoutId="activeLoginTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                    />
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "register"}
                  aria-controls="email-auth-form"
                  onClick={() => switchView("register")}
                  className={`relative flex-1 cursor-pointer py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] transition-colors sm:text-[11px] ${
                    view === "register" ? "text-black font-black" : "text-black/40 hover:text-black"
                  }`}
                >
                  CREATE ACCOUNT
                  {view === "register" && (
                    <motion.div
                      layoutId="activeLoginTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                    />
                  )}
                </button>
              </div>

              {GOOGLE_CLIENT_ID && (
                <>
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setError("Google sign-in was cancelled. Try again or use email.");
                    }}
                  />

                  <div className="relative mb-6 flex items-center justify-center">
                    <div className="w-full border-t border-black/10" />
                    <span className="absolute bg-white px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
                      Or use email
                    </span>
                  </div>
                </>
              )}

              {/* Auth Form */}
              <form id="email-auth-form" onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label={view === "login" ? "Sign in form" : "Create account form"}>
                <AnimatePresence mode="wait">
                  {view === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      className="flex flex-col overflow-hidden"
                    >
                      <label htmlFor="auth-name" className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/55">
                        FULL NAME*
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="e.g. Alex Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-black/15 bg-[#f5f5f2] px-3.5 py-3 text-xs font-medium text-black outline-none transition-colors focus:border-black focus:bg-white"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col">
                  <label htmlFor="auth-email" className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/55">
                    EMAIL ADDRESS*
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-black/15 bg-[#f5f5f2] px-3.5 py-3 text-xs font-medium text-black outline-none transition-colors focus:border-black focus:bg-white"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="auth-password" className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/55">
                      PASSWORD*
                    </label>
                    {view === "login" && (
                      <button
                        type="button"
                        onClick={() => { setForgotMode(!forgotMode); setForgotSuccess(""); setError(""); }}
                        className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/60 hover:text-black underline cursor-pointer"
                      >
                        {forgotMode ? "Cancel" : "Forgot?"}
                      </button>
                    )}
                  </div>
                  {!forgotMode && (
                    <input
                      id="auth-password"
                      type="password"
                      required={!forgotMode}
                      minLength={view === "register" ? 8 : undefined}
                      autoComplete={view === "register" ? "new-password" : "current-password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-black/15 bg-[#f5f5f2] px-3.5 py-3 text-xs font-medium text-black outline-none transition-colors focus:border-black focus:bg-white"
                    />
                  )}
                </div>

                {/* Forgot Password Inline Form */}
                <AnimatePresence>
                  {forgotMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 bg-[#f8f8f8] border border-black/10 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/65">
                          Enter your email to receive a reset link
                        </p>
                        <label htmlFor="forgot-email" className="sr-only">Email address for password reset</label>
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full border border-black/15 bg-white px-3 py-2.5 text-xs outline-none focus:border-black"
                        />
                        {forgotSuccess && (
                          <p role="status" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black/70">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {forgotSuccess}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={forgotLoading}
                          className="btn-bagify btn-bagify-dark text-[10px] font-bold uppercase tracking-[0.18em] py-2.5 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {forgotLoading ? "Sending…" : "Send Reset Link →"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <p role="alert" className="border border-black/15 bg-[#f2f2f0] p-3 text-[10px] font-bold uppercase tracking-[0.12em] text-black">
                    {error}
                  </p>
                )}

                {success && (
                  <p role="status" aria-live="polite" className="flex items-center gap-2 border border-black/15 bg-[#f2f2f0] p-3 text-[10px] font-bold uppercase tracking-[0.12em] text-black">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {success}
                  </p>
                )}

                {/* Submit Button */}
                {!forgotMode && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-bagify btn-bagify-dark mt-2 flex w-full cursor-pointer items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-[0.2em]"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{view === "login" ? "SIGN IN TO ARCHIVE" : "CREATE MY ACCOUNT"}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </form>
            </div>

            {/* Switch view footer */}
            <div className="mt-8 border-t border-black/10 pt-5 text-center">
              <p className="text-xs text-black/55">
                {view === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => switchView(view === "login" ? "register" : "login")}
                  className="ml-1 cursor-pointer font-bold uppercase tracking-[0.12em] text-black underline underline-offset-4 hover:opacity-60"
                >
                  {view === "login" ? "Create one here" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          {/* Right Column: VIP Archive Perks (5 Columns) */}
          <aside className="relative flex flex-col justify-between overflow-hidden bg-black p-7 text-white sm:p-10 lg:col-span-5 lg:p-14">
            <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
              <div className="absolute inset-x-10 top-1/3 border-t border-white/40" />
              <div className="absolute bottom-10 left-1/3 top-10 border-l border-white/40" />
            </div>
            <div className="relative z-10">
              <div className="mb-12 flex items-center justify-between border-b border-white/15 pb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/50">Chrome Club / 001</span>
                <span className="border border-white/25 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-white/70">Member access</span>
              </div>

              <h2 className="max-w-[10ch] font-microgramma text-4xl font-bold uppercase leading-[0.88] tracking-[-0.04em] text-white sm:text-5xl">
                Keep your place
              </h2>
              <p className="mb-10 mt-5 max-w-sm text-sm leading-relaxed text-white/55">
                A private space for the pieces, orders, and releases worth returning to.
              </p>

              <div className="space-y-5 text-xs">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[10px] text-white/35">01</span>
                  <div>
                    <p className="font-bold uppercase tracking-[0.12em] text-white">Early access</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/45">See selected drops before they open publicly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-mono text-[10px] text-white/35">02</span>
                  <div>
                    <p className="font-bold uppercase tracking-[0.12em] text-white">10% to start</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/45">Use BAGIFY10 on your first archive purchase.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-mono text-[10px] text-white/35">03</span>
                  <div>
                    <p className="font-bold uppercase tracking-[0.12em] text-white">Earn points</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/45">Build Chrome Club status as you shop.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-12 border-t border-white/15 pt-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                Authenticated archive / Mumbai · Global
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-[#f5f5f2] min-h-screen flex items-center justify-center text-xs font-bold uppercase tracking-wider text-black">Loading Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
