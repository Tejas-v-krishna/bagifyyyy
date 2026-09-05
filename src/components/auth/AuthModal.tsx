"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthModal() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const modalBlockedRoute = [
    "/checkout",
    "/login",
    "/reset-password",
    "/account",
    "/track",
    "/contact",
    "/customer-service",
    "/privacy-policy",
    "/terms",
    "/shipping",
    "/return-request",
    "/right-of-withdrawal",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // Show only on the visitor's very first visit to the website if unauthenticated
  useEffect(() => {
    if (modalBlockedRoute) {
      closeAuthModal();
      return;
    }

    if (typeof window !== "undefined" && !modalBlockedRoute) {
      const hasSeenModal =
        localStorage.getItem("bagify_welcome_modal_seen") ||
        sessionStorage.getItem("bagify_welcome_modal_seen");

      if (!hasSeenModal && !isAuthenticated) {
        const timer = setTimeout(() => {
          openAuthModal();
          localStorage.setItem("bagify_welcome_modal_seen", "true");
          sessionStorage.setItem("bagify_welcome_modal_seen", "true");
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [closeAuthModal, openAuthModal, isAuthenticated, modalBlockedRoute]);

  const handleGoToAuth = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bagify_welcome_modal_seen", "true");
      sessionStorage.setItem("bagify_welcome_modal_seen", "true");
    }
    closeAuthModal();
    router.push("/login");
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bagify_welcome_modal_seen", "true");
      sessionStorage.setItem("bagify_welcome_modal_seen", "true");
    }
    closeAuthModal();
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{
            type: "spring",
            damping: 26,
            stiffness: 320,
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] w-[calc(100vw-32px)] sm:w-[500px] md:w-[540px] bg-white text-black font-sans rounded-3xl border border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col sm:flex-row select-none"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full text-black/60 hover:text-white bg-[#f2f2f2] hover:bg-black flex items-center justify-center transition-all z-30 cursor-pointer"
            aria-label="Close"
          >
            <X strokeWidth={2} className="w-3.5 h-3.5" />
          </button>

          {/* Left Column: Welcome Offer & Action */}
          <div className="w-full sm:w-[58%] p-6 sm:p-7 flex flex-col justify-between bg-white">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                 <span>WELCOME OFFER</span>
              </div>

              <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-black mb-2 leading-none">
                 WELCOME IN
              </h2>

              <p className="text-xs text-black/65 font-normal leading-relaxed mb-4">
                 Take <strong className="font-bold text-black">10% off</strong> your first order with <code className="bg-[#f2f2f2] px-1.5 py-0.5 font-bold font-mono text-black rounded border border-black/10 text-[11px]">BAGIFY10</code>. Sign up if you want first word when new pieces go live.
              </p>

              {/* Benefits List */}
              <div className="flex flex-col gap-2 mb-5 text-[11px] text-black/75 border-t border-black/5 pt-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-black shrink-0" />
                   <span>First word on new drops</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
                   <span>Wishlist and orders in one place</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={handleGoToAuth}
                className="btn-bagify btn-bagify-dark w-full text-[10.5px] font-bold uppercase tracking-[0.18em] py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                 <span>SIGN IN / JOIN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/45 hover:text-black py-1 text-center transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Photo */}
          <div className="hidden sm:block sm:w-[42%] relative bg-black min-h-[300px]">
            <Image
              src="/hero-1-new.jpg"
              alt="BAGIFYYYY Archive"
              fill
              sizes="240px"
              className="object-cover grayscale contrast-125 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/20 pointer-events-none" />
            <div className="absolute bottom-5 left-5 right-5 text-white z-10">
              <span className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-white/60 block mb-0.5">
                EST. 2024
              </span>
              <p className="font-sans font-bold text-sm uppercase tracking-tight leading-tight">
                 VINTAGE + STREETWEAR
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
