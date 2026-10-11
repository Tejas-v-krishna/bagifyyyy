"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Share2, X, MessageCircle } from "lucide-react";
import { getShortProductPath, getProductPath } from "@/lib/productSlug";

type ProductShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    images?: string[];
  };
};

export default function ProductShareModal({
  isOpen,
  onClose,
  product,
}: ProductShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shortPath = getShortProductPath(product.id);
  const fullSlugPath = getProductPath(product);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bagifyyyy.in";

  const shortUrl = `${origin}${shortPath}`;
  const canonicalUrl = `${origin}${fullSlugPath}`;

  const shareText = `Check out "${product.name}" on BAGIFYYYY — 1-of-1 archival drop:`;

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shortUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shortUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${product.name} · BAGIFYYYY`,
        text: shareText,
        url: shortUrl,
      });
    } catch {
      // User cancelled or aborted
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n${shortUrl}`
  )}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shortUrl)}`;

  const displayImage =
    (product.images && product.images[0]) || product.image || "/placeholder.jpg";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container: centered in screen viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md my-auto overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-black stroke-[2.2]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-black">
                  Share Piece
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-black/10 bg-black/5 hover:bg-black hover:text-white transition-colors flex items-center justify-center cursor-pointer text-black/60"
                aria-label="Close share dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Preview Card */}
            <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-black/8 bg-[#fafafa] p-3">
              <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-cover object-center"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-tight text-black truncate font-sans">
                  {product.name}
                </p>
                <p className="text-[11px] font-mono font-semibold text-black/60 mt-0.5">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
                <span className="inline-block text-[9px] font-mono uppercase tracking-[0.14em] text-black/40 mt-1">
                  1-OF-1 ARCHIVAL DROP
                </span>
              </div>
            </div>

            {/* Short Link Display & Copy Input */}
            <div className="mt-4">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/60 mb-1.5">
                Clean Short Link
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-white p-1.5 pl-3 focus-within:border-black transition-colors">
                <span className="text-xs font-mono text-black/80 truncate flex-1 select-all">
                  {shortUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10.5px] font-mono font-bold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-black text-white hover:bg-black/85"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Apps */}
            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-black/50">
                Direct Share
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-[#f7f7f7] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] px-3.5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-black transition-all group cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-white transition-colors" />
                  <span>WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-[#f7f7f7] hover:bg-black hover:text-white hover:border-black px-3.5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-black transition-all group cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-black group-hover:fill-white transition-colors"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X (Twitter)</span>
                </a>
              </div>

              {/* Native OS Share Button (Mobile/Supported Browsers) */}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white hover:bg-black hover:text-white px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-black transition-all cursor-pointer shadow-2xs mt-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More Sharing Options (AirDrop, Apps)</span>
                </button>
              )}
            </div>

            {/* Subtle footer notice */}
            <div className="mt-5 pt-3 border-t border-black/5 text-center">
              <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-black/40">
                BAGIFYYYY · 1-OF-1 EXCLUSIVE ARCHIVE
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
