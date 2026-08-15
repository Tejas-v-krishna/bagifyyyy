"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleLogin } from "@react-oauth/google";

export default function AuthModal() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal, setUser, setIsAuthenticated, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [view, setView] = useState<"login" | "register">("register");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset form when switching views
  const switchView = (v: "login" | "register") => {
    setView(v);
    setError("");
    setSuccess("");
    setName("");
    setEmail("");
    setPassword("");
  };

  useEffect(() => {
    // Only show automatically on the person's very first visit if unauthenticated
    if (typeof window !== "undefined") {
      const hasVisited = localStorage.getItem("bagify_has_visited") || sessionStorage.getItem("hasSeenAuthModal");
      if (!hasVisited && !isAuthenticated) {
        const timer = setTimeout(() => {
          openAuthModal();
          localStorage.setItem("bagify_has_visited", "true");
          sessionStorage.setItem("hasSeenAuthModal", "true");
        }, 7000);
        return () => clearTimeout(timer);
      }
    }
  }, [openAuthModal, isAuthenticated]);

  // Google Sign In Handler
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
      setSuccess("Signed in with Google!");
      setTimeout(() => {
        closeAuthModal();
        setSuccess("");
      }, 1200);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Google authentication failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Google Login Popup
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleSuccess(tokenResponse);
    },
    onError: (errorResponse) => {
      console.warn("Google popup closed or error:", errorResponse);
      setGoogleLoading(false);
      setError("Google popup was closed.");
    },
    onNonOAuthError: () => {
      setGoogleLoading(false);
    }
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

    // ── Silent admin login: blank email + correct password → /studio ──
    if (!email && password && view === "login") {
      try {
        const res = await fetch("/api/studio/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          closeAuthModal();
          router.push("/studio");
          setLoading(false);
          return;
        }
      } catch {}
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // ── Normal user register ──
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
          setSuccess("Account created! You're signed in.");
          setUser(data.user);
          setIsAuthenticated(true);
          setTimeout(() => {
            closeAuthModal();
            setSuccess("");
          }, 1200);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    }

    // ── Normal user login ──
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
          setSuccess("Signed in successfully!");
          setUser(data.user);
          setIsAuthenticated(true);
          setTimeout(() => {
            closeAuthModal();
            setSuccess("");
          }, 1200);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            layout: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] w-[calc(100vw-32px)] sm:w-[540px] md:w-[580px] bg-white text-y2k-gunmetal font-sans shadow-2xl shadow-black/40 border border-y2k-gunmetal/15 overflow-hidden flex flex-col sm:flex-row"
        >
          {/* Mobile Close Button */}
          <button
            onClick={closeAuthModal}
            className="sm:hidden absolute top-2.5 right-2.5 p-1.5 text-y2k-gunmetal hover:opacity-70 transition-opacity z-30 cursor-pointer"
            aria-label="Close"
          >
            <X strokeWidth={2} className="w-4 h-4" />
          </button>

          {/* Left Column: Form Content */}
          <motion.div
            layout
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="w-full sm:w-[56%] p-4 sm:p-5 flex flex-col justify-between bg-white"
          >
            <div>
              {/* Header Title in Website Display Font */}
              <h2 className="font-display font-medium text-2xl sm:text-[26px] uppercase tracking-[-0.03em] leading-none text-y2k-gunmetal mb-1.5">
                {view === "register" ? "JOIN THE PACK" : "WELCOME BACK"}
              </h2>

              {/* Subtext */}
              <p className="font-sans text-[11px] text-y2k-gunmetal/80 font-normal leading-snug mb-3">
                Sign up to get <strong className="font-bold text-y2k-gunmetal">10% off</strong> your first purchase. We&apos;ll keep you updated on releases &amp; drops.
              </p>

              {/* Toggle Switch in Website Display Font */}
              <div className="flex items-center gap-3 mb-2.5 text-xs font-bold uppercase tracking-wider font-display">
                <button
                  type="button"
                  onClick={() => switchView("register")}
                  className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
                    view === "register"
                      ? "border-y2k-gunmetal text-y2k-gunmetal"
                      : "border-transparent text-y2k-slate/50 hover:text-y2k-gunmetal"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
                    view === "login"
                      ? "border-y2k-gunmetal text-y2k-gunmetal"
                      : "border-transparent text-y2k-slate/50 hover:text-y2k-gunmetal"
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {view === "register" && (
                    <motion.div
                      key="name-input"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                      className="flex flex-col overflow-hidden"
                    >
                      <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-0.5">
                        Name:
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full text-xs font-sans text-y2k-gunmetal placeholder:text-y2k-slate/50 border border-y2k-soft/40 px-2.5 py-1.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-0.5">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required={view === "register"}
                    className="w-full text-xs font-sans text-y2k-gunmetal placeholder:text-y2k-slate/50 border border-y2k-soft/40 px-2.5 py-1.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/80 mb-0.5">
                    Password:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full text-xs font-sans text-y2k-gunmetal placeholder:text-y2k-slate/50 border border-y2k-soft/40 px-2.5 py-1.5 bg-gray-50/50 focus:bg-white focus:border-y2k-gunmetal outline-none transition-all tracking-wider"
                  />
                </div>

                {/* Feedback messages */}
                {error && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 pt-0.5">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 pt-0.5">
                    {success}
                  </p>
                )}

                {/* Action Button: Matches Website's btn-bagify / Gunmetal styling */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full btn-bagify text-white font-bold text-xs uppercase tracking-widest py-2.5 mt-1 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer text-center"
                >
                  {loading ? "Processing..." : view === "register" ? "Sign Up" : "Sign In"}
                </button>
              </form>

              {/* Google Alternative & Full Page Link */}
              <div className="mt-2.5 pt-2 border-t border-y2k-gunmetal/10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate/70">
                    Quick Access:
                  </span>
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={googleLoading}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal hover:text-black transition-colors cursor-pointer"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>
                </div>

                <a
                  href="/login"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("bagify_has_visited", "true");
                      sessionStorage.setItem("hasSeenAuthModal", "true");
                    }
                    closeAuthModal();
                  }}
                  className="text-[9px] font-bold uppercase tracking-[0.14em] text-y2k-slate hover:text-black text-center pt-1 transition-colors"
                >
                  Open Full Sign In Page →
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: High-Motion Editorial Image */}
          <motion.div
            layout
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="hidden sm:block sm:w-[44%] relative bg-black min-h-[290px]"
          >
            <Image
              src="/rebel-bg.jpg"
              alt="Join the pack editorial"
              fill
              sizes="(max-width: 768px) 100vw, 260px"
              className="object-cover grayscale contrast-125 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Close Button on Image */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("bagify_has_visited", "true");
                  sessionStorage.setItem("hasSeenAuthModal", "true");
                }
                closeAuthModal();
              }}
              className="absolute top-2.5 right-2.5 p-1.5 text-white/90 hover:text-white bg-black/40 hover:bg-black/70 backdrop-blur-sm transition-all z-20 cursor-pointer shadow"
              aria-label="Close"
            >
              <X strokeWidth={2} className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
