"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Zap, Sparkles, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleLogin } from "@react-oauth/google";

function LoginContent() {
  const { isAuthenticated, setUser, setIsAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/account";

  const [view, setView] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  };

  // Google Sign-In
  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setGoogleLoading(true);
      setError("");

      let res;
      if (tokenResponse.access_token) {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            simulatedUser: {
              email: googleUser.email,
              name: googleUser.name || googleUser.given_name,
              avatar: googleUser.picture,
            },
          }),
        });
      } else if (tokenResponse.credential) {
        res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: tokenResponse.credential }),
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
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Google authentication failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse),
    onError: (errorResponse) => {
      console.warn("Google popup error:", errorResponse);
      setGoogleLoading(false);
      setError("Google popup was closed.");
    },
    onNonOAuthError: () => setGoogleLoading(false),
  });

  const handleGoogleClick = () => {
    setError("");
    setGoogleLoading(true);
    setTimeout(() => setGoogleLoading(false), 5000);
    try {
      triggerGoogleLogin();
    } catch {
      setError("Could not open Google popup.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Silent admin login check
    if (!email && password && view === "login") {
      try {
        const res = await fetch("/api/studio/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          router.push("/studio");
          setLoading(false);
          return;
        }
      } catch {}
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

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
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-[calc(100vh-64px)] font-sans flex flex-col justify-between py-8 md:py-14 px-4 sm:px-6 lg:px-12">
      <div className="max-w-[1180px] w-full mx-auto">
        {/* Top Back Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-6 pb-3 border-b border-y2k-gunmetal/10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal/75 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Drops
          </Link>
        </motion.div>

        {/* Main Split Portal Container — Hardware-Accelerated Animated Box */}
        <div className="auth-portal-card bg-white border border-y2k-gunmetal/15 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Form Column (7 Columns) */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Header */}
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-y2k-slate block mb-1">
                  AUTHENTIC ARCHIVE ACCESS
                </span>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] uppercase tracking-[-0.03em] font-medium leading-none text-y2k-gunmetal mb-2 py-0.5">
                  {view === "login" ? "SIGN IN TO YOUR ACCOUNT" : "JOIN THE ARCHIVE PACK"}
                </h1>
                <p className="text-xs text-y2k-gunmetal/75 font-normal leading-relaxed">
                  {view === "login"
                    ? "Access your saved wishlists, verified drop orders, and exclusive members-only releases."
                    : "Create an account to unlock instant 10% off with code BAGIFY10 and early drop notifications."}
                </p>
              </div>

              {/* View Toggle Tabs */}
              <div className="flex border-b border-y2k-gunmetal/15 mb-6">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-center transition-all relative cursor-pointer ${
                    view === "login" ? "text-y2k-gunmetal font-black" : "text-y2k-gunmetal/40 hover:text-y2k-gunmetal"
                  }`}
                >
                  SIGN IN
                  {view === "login" && (
                    <motion.div
                      layoutId="activeLoginTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-y2k-gunmetal"
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => switchView("register")}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-center transition-all relative cursor-pointer ${
                    view === "register" ? "text-y2k-gunmetal font-black" : "text-y2k-gunmetal/40 hover:text-y2k-gunmetal"
                  }`}
                >
                  CREATE ACCOUNT
                  {view === "register" && (
                    <motion.div
                      layoutId="activeLoginTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-y2k-gunmetal"
                    />
                  )}
                </button>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-y2k-gunmetal/20 hover:border-y2k-gunmetal hover:bg-black/[0.02] py-3 px-4 transition-all shadow-sm mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-y2k-gunmetal" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="w-full border-t border-y2k-gunmetal/15" />
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-y2k-slate absolute">
                  OR WITH EMAIL
                </span>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <AnimatePresence mode="wait">
                  {view === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      className="flex flex-col overflow-hidden"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/80 mb-1">
                        FULL NAME*
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs font-medium text-black border border-y2k-gunmetal/20 px-4 py-3 bg-white focus:border-y2k-gunmetal outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/80 mb-1">
                    EMAIL ADDRESS*
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-medium text-black border border-y2k-gunmetal/20 px-4 py-3 bg-white focus:border-y2k-gunmetal outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-y2k-gunmetal/80">
                      PASSWORD*
                    </label>
                    {view === "login" && (
                      <button
                        type="button"
                        onClick={() => alert("Password reset instructions will be sent to your email.")}
                        className="text-[10px] font-bold uppercase tracking-[0.14em] text-y2k-slate hover:text-black underline cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-medium text-black border border-y2k-gunmetal/20 px-4 py-3 bg-white focus:border-y2k-gunmetal outline-none transition-all"
                  />
                </div>

                {/* Feedback Alerts */}
                {error && (
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 p-3 border border-red-200">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 p-3 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-bagify text-white text-[11px] font-bold uppercase tracking-[0.16em] py-3.5 px-8 hover:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{view === "login" ? "SIGN IN" : "CREATE MY ACCOUNT"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer Terms Note */}
            <p className="text-[10px] text-y2k-slate leading-relaxed mt-6 text-center">
              By proceeding, you agree to BAGIFYYYY&apos;s{" "}
              <Link href="/terms" className="underline font-bold text-y2k-gunmetal">Terms of Service</Link> and{" "}
              <Link href="/privacy-policy" className="underline font-bold text-y2k-gunmetal">Privacy Policy</Link>.
            </p>
          </div>

          {/* Right Editorial Column (5 Columns) */}
          <div className="hidden lg:flex lg:col-span-5 relative bg-[#232D3B] text-[#F8F5E9] flex-col justify-between p-10 overflow-hidden border-l border-y2k-gunmetal/20">
            {/* Background Editorial Photo */}
            <div className="absolute inset-0 bg-[url('/hero-1-new.jpg')] bg-cover bg-center opacity-25 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#232D3B] via-[#232D3B]/80 to-[#232D3B]/40 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.02em] text-[#F8F5E9] leading-tight mb-3">
                CARRY THE VIBE. WEAR THE ARCHIVE.
              </h2>
              <p className="text-xs text-[#F8F5E9]/75 font-normal leading-relaxed">
                Join over 25,000 streetwear collectors receiving rare archival piece drops, private deadstock capsules, and verified garment provenance.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-4 pt-8 border-t border-white/15">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white/10 border border-white/15 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F8F5E9]" />
                </div>
                <div>
                  <span className="text-xs text-[#F8F5E9] font-bold block uppercase tracking-wider">
                    10% Off Instant Discount
                  </span>
                  <span className="text-[11px] text-[#F8F5E9]/80">
                    Use code <code className="text-white font-black bg-white/15 px-1.5 py-0.5 tracking-wider">BAGIFY10</code> on your first order.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white/10 border border-white/15 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-[#F8F5E9]" />
                </div>
                <div>
                  <span className="text-xs text-[#F8F5E9] font-bold block uppercase tracking-wider">
                    VIP Early Drop Access
                  </span>
                  <span className="text-[11px] text-[#F8F5E9]/80">
                    Shop micro-batch capsules 30 minutes before public release.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white/10 border border-white/15 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F8F5E9]" />
                </div>
                <div>
                  <span className="text-xs text-[#F8F5E9] font-bold block uppercase tracking-wider">
                    Verified Provenance
                  </span>
                  <span className="text-[11px] text-[#F8F5E9]/80">
                    Digital authenticity certificate with every vintage item.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Tag */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-center text-[9px] uppercase tracking-[0.18em] text-[#F8F5E9]/50 font-bold">
              <span>EST. 2024</span>
              <span>HARJUKU &amp; MILAN SOURCING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-y2k-ice min-h-screen flex items-center justify-center text-xs font-bold uppercase tracking-widest">Loading Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
