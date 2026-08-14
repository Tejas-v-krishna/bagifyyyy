"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleLogin } from "@react-oauth/google";

export default function AuthModal() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal, setUser, setIsAuthenticated } = useAuthStore();
  const router = useRouter();
  const [view, setView] = useState<"login" | "register">("login");

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
    const hasSeenModal = sessionStorage.getItem("hasSeenAuthModal");
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        openAuthModal();
        sessionStorage.setItem("hasSeenAuthModal", "true");
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [openAuthModal]);

  useEffect(() => {
    document.body.style.overflow = isAuthModalOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isAuthModalOpen]);

  // Google Sign In Handler
  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setGoogleLoading(true);
      setError("");

      let res;
      // If access_token is returned by useGoogleLogin, fetch profile info
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

  // Trigger Google Login Popup (or fallback simulation if Client ID is unconfigured)
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (errorResponse) => {
      console.warn("Google popup closed or error:", errorResponse);
      const isPlaceholder = !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes("placeholder");
      if (isPlaceholder) {
        handleGoogleDevSimulation();
      } else {
        setError("Google popup was closed, blocked, or this domain is not yet in Google Cloud Console 'Authorized JavaScript origins'.");
        setGoogleLoading(false);
      }
    },
    onNonOAuthError: (nonOAuthError) => {
      console.warn("Google non-OAuth error:", nonOAuthError);
      setGoogleLoading(false);
    }
  });

  const handleGoogleClick = () => {
    setGoogleLoading(true);
    setError("");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes("placeholder")) {
      handleGoogleDevSimulation();
    } else {
      try {
        triggerGoogleLogin();
      } catch (err) {
        console.error("Trigger error:", err);
        setGoogleLoading(false);
      }
    }
  };

  const handleGoogleDevSimulation = async () => {
    try {
      setGoogleLoading(true);
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulatedUser: {
            email: "google.member@bagifyyyy.com",
            name: "Alex River (Google)",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setSuccess("Signed in with Google (Test Mode)!");
        setTimeout(() => {
          closeAuthModal();
          setSuccess("");
        }, 1200);
      } else {
        setError(data.error || "Simulation failed");
      }
    } catch (e: any) {
      setError("Failed to simulate Google login");
    } finally {
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
          setSuccess("Account created! You're now signed in.");
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeAuthModal}
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[420px] flex flex-col gap-[2px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-white rounded-t-[6px] px-8 pt-10 pb-6 text-center">
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-2 text-y2k-slate hover:text-y2k-gunmetal transition-colors z-10"
            >
              <X strokeWidth={1.5} className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-3 select-none">
              <h2
                onClick={() => switchView("login")}
                className={`text-2xl font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                  view === "login" ? "text-y2k-gunmetal" : "text-y2k-mist hover:text-y2k-slate"
                }`}
              >
                LOGIN
              </h2>
              <span className="text-sm font-normal lowercase text-y2k-mist mt-1">or</span>
              <h2
                onClick={() => switchView("register")}
                className={`text-2xl font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                  view === "register" ? "text-y2k-gunmetal" : "text-y2k-mist hover:text-y2k-slate"
                }`}
              >
                REGISTER
              </h2>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-y2k-gunmetal font-bold">
              {view === "login" ? (
                <>ARE YOU NEW?{" "}
                  <span onClick={() => switchView("register")} className="underline underline-offset-4 cursor-pointer hover:text-y2k-slate transition-colors">
                    REGISTER
                  </span>{" "}INSTEAD
                </>
              ) : (
                <>HAVE AN ACCOUNT?{" "}
                  <span onClick={() => switchView("login")} className="underline underline-offset-4 cursor-pointer hover:text-y2k-slate transition-colors">
                    LOGIN
                  </span>{" "}INSTEAD
                </>
              )}
            </p>
          </div>

          {/* Form Area */}
          <div className="bg-white rounded-b-[6px] px-8 py-6 flex flex-col gap-4">
            {/* Google One-Click Auth Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-y2k-gunmetal/25 hover:border-y2k-gunmetal hover:bg-black/5 text-y2k-gunmetal py-3.5 px-4 font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-y2k-gunmetal" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{googleLoading ? "Connecting Google…" : "Continue with Google"}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-[1px] bg-y2k-gunmetal/15"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal/50">
                OR WITH EMAIL
              </span>
              <div className="flex-1 h-[1px] bg-y2k-gunmetal/15"></div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Name field — register only */}
              {view === "register" && (
                <div className="flex flex-col border border-y2k-soft rounded-lg px-4 py-2 bg-white focus-within:border-y2k-slate focus-within:ring-1 focus-within:ring-y2k-slate transition-all shadow-sm">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full text-sm text-black placeholder:text-y2k-slate outline-none bg-transparent mt-1"
                  />
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col border border-y2k-soft rounded-lg px-4 py-2 bg-white focus-within:border-y2k-slate focus-within:ring-1 focus-within:ring-y2k-slate transition-all shadow-sm">
                <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal">
                  EMAIL*
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required={view === "register"}
                  className="w-full text-sm text-black placeholder:text-y2k-slate outline-none bg-transparent mt-1"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col border border-y2k-soft rounded-lg px-4 py-2 bg-white focus-within:border-y2k-slate focus-within:ring-1 focus-within:ring-y2k-slate transition-all shadow-sm">
                <label className="text-[9px] font-bold uppercase tracking-widest text-y2k-gunmetal">
                  PASSWORD*
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-sm text-black placeholder:text-y2k-slate outline-none bg-transparent mt-1 tracking-widest"
                />
              </div>

              {/* Error / Success feedback */}
              {error && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 text-center py-1">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 text-center py-1">
                  {success}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full btn-bagify py-3.5 rounded-none text-center hover:opacity-90 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 mt-1"
              >
                <span className="font-bold text-xs uppercase tracking-widest text-white">
                  {loading ? "Please wait…" : view === "login" ? "LOGIN" : "CREATE ACCOUNT"}
                </span>
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
