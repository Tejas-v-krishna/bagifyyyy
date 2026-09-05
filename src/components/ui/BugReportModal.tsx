"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Bug } from "lucide-react";

export const OPEN_BUG_REPORT_EVENT = "bagifyyyy:open-bug-report";

export function openBugReport() {
  window.dispatchEvent(new CustomEvent(OPEN_BUG_REPORT_EVENT));
}

/** Shopper-facing bug report dialog. Opens from anywhere via openBugReport(). */
export default function BugReportModal() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [page, setPage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const onOpen = () => {
      setPage(window.location.pathname + window.location.search);
      setStatus("idle");
      setError("");
      setIsOpen(true);
    };
    window.addEventListener(OPEN_BUG_REPORT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_BUG_REPORT_EVENT, onOpen);
  }, []);

  const close = useCallback(() => {
    if (status === "sending") return;
    setIsOpen(false);
  }, [status]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, name, email, page, website: honeypot }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not send the report.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      setMessage("");
    } catch {
      setError("Could not send the report. Check your connection and try again.");
      setStatus("error");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="bug-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="bug-panel"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Report a bug"
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-black/10 bg-[#f5f5f2] p-6 sm:p-8 text-black font-sans shadow-[0_24px_55px_rgba(0,0,0,0.25)] max-h-[88dvh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <Bug className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <h2 className="font-microgramma text-lg font-bold uppercase tracking-tight">
                    Report a bug
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer text-black/60 hover:text-black shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-black/55 leading-relaxed mb-5 ml-[46px]">
                Found something broken? Tell us where — it lands straight with the studio team.
              </p>

              {status === "sent" ? (
                <div className="text-center py-6">
                  <p className="font-microgramma text-base font-bold uppercase tracking-tight mb-2">
                    Report received
                  </p>
                  <p className="text-xs text-black/55 leading-relaxed mb-6">
                    Thanks for flagging it. We read every report.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-[0.14em] hover:bg-black/85 transition-colors cursor-pointer rounded-[0.35rem]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />
                  <div>
                    <label htmlFor="bug-message" className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">
                      What went wrong? *
                    </label>
                    <textarea
                      id="bug-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={4}
                      placeholder="e.g. Tapping Add on the denim jacket does nothing on my phone…"
                      className="w-full border border-black/15 focus:border-black bg-white px-4 py-3 text-sm outline-none transition-colors rounded-lg resize-y min-h-[110px] placeholder:text-black/35"
                    />
                  </div>
                  <div>
                    <label htmlFor="bug-page" className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">
                      Page
                    </label>
                    <input
                      id="bug-page"
                      type="text"
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      maxLength={500}
                      className="w-full border border-black/15 focus:border-black bg-white px-4 py-3 text-sm outline-none transition-colors rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bug-name" className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">
                        Name <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        id="bug-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={120}
                        autoComplete="name"
                        className="w-full border border-black/15 focus:border-black bg-white px-4 py-3 text-sm outline-none transition-colors rounded-lg"
                      />
                    </div>
                    <div>
                      <label htmlFor="bug-email" className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/60 mb-1.5 block">
                        Email <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        id="bug-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={254}
                        autoComplete="email"
                        placeholder="for a follow-up"
                        className="w-full border border-black/15 focus:border-black bg-white px-4 py-3 text-sm outline-none transition-colors rounded-lg placeholder:text-black/35"
                      />
                    </div>
                  </div>
                  {status === "error" && error && (
                    <p role="alert" className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-[0.14em] hover:bg-black/85 active:scale-[0.99] transition-all cursor-pointer rounded-[0.35rem] disabled:opacity-50"
                  >
                    {status === "sending" ? "Sending…" : "Send report"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
