"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Zap, ShieldCheck, Check } from "lucide-react";
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

  const handleDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bagify_welcome_modal_seen", "true");
      sessionStorage.setItem("bagify_welcome_modal_seen", "true");
    }
    closeAuthModal();
  }, [closeAuthModal]);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText("BAGIFY10");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  // Centered overlay behavior: Escape closes, background scroll locks.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isAuthModalOpen, closeAuthModal, handleDismiss]);

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={handleDismiss}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome offer"
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.96 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[calc(100dvh-2rem)] w-full max-w-[880px] grid-cols-1 overflow-hidden overflow-y-auto rounded-3xl bg-white font-sans text-black shadow-[0_32px_90px_rgba(0,0,0,0.35)] sm:grid-cols-2"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 cursor-pointer"
              aria-label="Close"
            >
              <X strokeWidth={2.2} className="h-4 w-4" />
            </button>

            {/* Left Column: Welcome Offer & Action */}
            <div className="flex w-full flex-col justify-center bg-white p-6 sm:p-9">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black/50">
                  <Sparkles className="h-3.5 w-3.5 text-black" />
                  <span>WELCOME OFFER</span>
                </div>

                <h2 className="mb-3 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-black sm:text-[2.75rem]">
                  WELCOME IN
                </h2>

                <p className="mb-5 text-sm font-normal leading-relaxed text-black/65">
                  Take <strong className="font-bold text-black">10% off</strong> your first order with{" "}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Click to copy"
                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-black/10 bg-[#f2f2f2] px-1.5 py-0.5 font-mono text-[12px] font-bold text-black transition-colors hover:border-black/30"
                  >
                    BAGIFY10
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" strokeWidth={2.5} />
                    ) : null}
                  </button>
                  {copied ? <span className="ml-1.5 text-[11px] font-semibold text-green-700">Copied!</span> : null}.
                  Sign up if you want first word when new pieces go live.
                </p>

                {/* Benefits List */}
                <div className="mb-6 flex flex-col gap-2.5 border-t border-black/[0.08] pt-4 text-[13px] text-black/75">
                  <div className="flex items-center gap-2.5">
                    <Zap className="h-4 w-4 shrink-0 text-black" />
                    <span>First word on new drops</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-black" />
                    <span>Wishlist and orders in one place</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-black/[0.08] pt-5">
                <button
                  type="button"
                  onClick={handleGoToAuth}
                  className="btn-bagify btn-bagify-dark flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em]"
                >
                  <span>SIGN IN / JOIN</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="cursor-pointer py-1 text-center text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/45 transition-colors hover:text-black"
                >
                  Continue Browsing
                </button>
              </div>
            </div>

            {/* Right Column: Editorial Photo */}
            <div className="relative order-first h-52 w-full bg-neutral-300 sm:order-none sm:h-auto sm:min-h-[520px]">
              <Image
                src="/hero-1-new.jpg"
                alt="BAGIFYYYY Archive"
                fill
                sizes="(max-width: 639px) 100vw, 440px"
                className="object-cover object-top contrast-[1.05]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
              <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                  EST. 2024
                </span>
                <p className="font-sans text-base font-bold uppercase leading-tight tracking-tight">
                  VINTAGE + STREETWEAR
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
