"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthModal() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Show only on the visitor's very first visit to the website if unauthenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
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
  }, [openAuthModal, isAuthenticated]);

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
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] w-[calc(100vw-32px)] sm:w-[480px] md:w-[520px] bg-white text-y2k-gunmetal font-sans shadow-2xl shadow-black/40 border border-y2k-gunmetal/10 overflow-hidden flex flex-col sm:flex-row select-none"
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-y2k-gunmetal/60 hover:text-black bg-white/80 sm:bg-black/40 sm:text-white/80 sm:hover:text-white sm:hover:bg-black/70 backdrop-blur-sm transition-all z-30 cursor-pointer"
            aria-label="Close"
          >
            <X strokeWidth={2} className="w-4 h-4" />
          </button>

          {/* Left Column: Welcome Offer & Action */}
          <div className="w-full sm:w-[58%] p-5 sm:p-6 flex flex-col justify-between bg-white">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-y2k-slate mb-2">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>FIRST VISIT EXCLUSIVE</span>
              </div>

              <h2 className="font-display font-medium text-2xl sm:text-[28px] uppercase tracking-[-0.03em] leading-none text-y2k-gunmetal mb-2">
                WELCOME TO BAGIFYYYY
              </h2>

              <p className="text-xs text-y2k-gunmetal/80 font-normal leading-relaxed mb-4">
                Unlock <strong className="font-bold text-black">10% off</strong> your first order with code <code className="bg-black/5 px-1 py-0.5 font-bold text-black border border-black/10">BAGIFY10</code>, plus early access to vintage archive drops.
              </p>

              {/* Benefits List */}
              <div className="flex flex-col gap-2 mb-5 text-[11px] text-y2k-gunmetal/80 border-t border-y2k-gunmetal/10 pt-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-y2k-gunmetal shrink-0" />
                  <span>VIP drop notifications &amp; micro-capsules</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal shrink-0" />
                  <span>Verified 1-of-1 archive provenance</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-y2k-gunmetal/10">
              <button
                type="button"
                onClick={handleGoToAuth}
                className="btn-bagify w-full text-white text-[11px] font-bold uppercase tracking-wider py-3.5 px-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
              >
                <span>SIGN IN / CREATE ACCOUNT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate hover:text-black py-1 text-center transition-colors cursor-pointer"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 block mb-0.5">
                EST. 2024
              </span>
              <p className="font-display font-medium text-sm uppercase tracking-tight leading-tight">
                Authentic Vintage &amp; Streetwear
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
