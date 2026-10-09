"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";

type SearchResult = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  price: number;
  image: string;
};

const NO_RESULTS: SearchResult[] = [];
const MIN_QUERY_LENGTH = 2;
const POPULAR_SEARCHES = [
  "Hoodies",
  "Cargo Pants",
  "Denim Jeans",
  "T-Shirts",
  "Jackets",
  "Accessories",
  "Bundles",
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchOverlay({
  variant = "text",
  dark = false,
}: {
  variant?: "text" | "pill" | "icon" | "morph";
  dark?: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);

  useEffect(() => {
    setMounted(true);
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const debouncedQuery = useDebounce(query, 220);

  const [search, setSearch] = useState<{ key: string; results: SearchResult[] } | null>(null);

  const tooShort = debouncedQuery.length < MIN_QUERY_LENGTH;
  const hasCurrentResults = !tooShort && search?.key === debouncedQuery;
  const results = hasCurrentResults ? search.results : NO_RESULTS;
  const loading = !tooShort && !hasCurrentResults;
  const activeIndex = highlighted < results.length ? highlighted : -1;

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setSearch({ key: debouncedQuery, results: data.results ?? NO_RESULTS });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setSearch({ key: debouncedQuery, results: NO_RESULTS });
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSearch(null);
    setHighlighted(-1);
    triggerRef.current?.focus();
  }, []);

  // Body scroll lock — ref-counted via scrollLock so overlapping overlays
  // don't stomp each other's lock/restore.
  useEffect(() => {
    if (!isOpen) return;
    acquireScrollLock();
    return () => releaseScrollLock();
  }, [isOpen]);

  // Global keyboard shortcut — Ctrl/Cmd+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
      if (e.key === "Escape" && isOpen) close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        const target = `/product/${results[activeIndex].id}`;
        close();
        router.push(target);
      } else if (query.trim().length >= 2) {
        close();
        router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <>
      {/* Trigger button */}
      {variant === "text" ? (
        <button
          ref={triggerRef}
          onClick={open}
          aria-label="Search products"
          aria-expanded={isOpen}
          className="text-[13px] md:text-[13.5px] font-normal tracking-tight text-current hover:opacity-60 transition-opacity cursor-pointer"
        >
          Search
        </button>
      ) : variant === "pill" ? (
        <button
          ref={triggerRef}
          onClick={open}
          aria-label="Search products"
          aria-expanded={isOpen}
          className="bg-[#EFEFEF] hover:bg-neutral-200 text-black rounded-[0.35rem] h-9 px-3 flex items-center gap-2 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-black" />
          <span className="hidden xl:inline">Search</span>
          <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-black/40 bg-black/5 rounded">
            ⌘K
          </kbd>
        </button>
      ) : variant === "morph" ? (
        <button
          ref={triggerRef}
          onClick={open}
          aria-label="Search products"
          aria-expanded={isOpen}
          className={`group relative inline-flex h-9 min-w-9 items-center justify-center overflow-hidden rounded-full border border-transparent px-2 transition-all duration-300 hover:backdrop-blur-md cursor-pointer text-current ${
            dark ? "hover:border-white/25 hover:bg-white/10" : "hover:border-black/10 hover:bg-black/[0.04]"
          }`}
        >
          <span className="text-[13px] md:text-[13.5px] font-normal tracking-tight whitespace-nowrap transition-all duration-300 group-hover:-translate-y-5 group-hover:opacity-0">
            Search
          </span>
          <span className="absolute inset-0 flex translate-y-5 items-center justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true">
            <Search className="w-[18px] h-[18px]" />
          </span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={open}
          aria-label="Search products"
          aria-expanded={isOpen}
          className="text-current hover:opacity-60 transition-opacity cursor-pointer p-1.5 flex items-center justify-center"
        >
          <Search className="w-4 h-4 text-current" />
        </button>
      )}

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div key="search-portal-root">
                {/* 1. Backdrop */}
                <motion.div
                  key="search-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 z-[9990] bg-black/45 backdrop-blur-sm"
                  onClick={close}
                  aria-hidden="true"
                />

                {/* 2. Compact Floating Search Modal (does not cover whole page) */}
                <motion.div
                  key="search-modal"
                  initial={{ opacity: 0, y: -20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search products"
                  data-lenis-prevent="true"
                  className="fixed top-16 sm:top-24 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[10000] w-auto sm:w-full sm:max-w-xl bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] text-black font-sans overflow-hidden"
                >
                  {/* Top Search Input Bar */}
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-black/8">
                    <Search className="w-4 h-4 text-black/40 shrink-0" />

                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search archive..."
                      className="search-dialog-input flex-1 !bg-transparent text-sm font-mono tracking-wide text-black placeholder:text-black/35 outline-none border-0"
                      autoComplete="off"
                      aria-label="Search input"
                    />

                    {loading && (
                      <Loader2
                        className="w-4 h-4 text-black/40 animate-spin shrink-0"
                        aria-label="Searching"
                      />
                    )}

                    {query.length > 0 && !loading && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        className="text-[10px] font-mono uppercase tracking-wider text-black/40 hover:text-black transition-colors px-1 cursor-pointer"
                        aria-label="Clear query"
                      >
                        Clear
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close search"
                      className="h-7 w-7 rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5">
                    <AnimatePresence mode="wait">
                      {/* 1. Results List */}
                      {results.length > 0 && (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between pb-2 mb-1 px-1">
                            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-black/40">
                              {results.length} {results.length === 1 ? "result" : "results"}
                            </span>
                            <Link
                              href={`/products?q=${encodeURIComponent(debouncedQuery)}`}
                              onClick={close}
                              className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-black/70 hover:text-black flex items-center gap-1"
                            >
                              <span>View all</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>

                          <div className="space-y-1" role="listbox">
                            {results.slice(0, 6).map((item, idx) => (
                              <Link
                                key={item.id}
                                href={`/product/${item.id}`}
                                onClick={close}
                                role="option"
                                aria-selected={activeIndex === idx}
                                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                                  activeIndex === idx
                                    ? "bg-black text-white"
                                    : "hover:bg-black/5 text-black"
                                }`}
                                onMouseEnter={() => setHighlighted(idx)}
                              >
                                <div className="relative h-12 w-10 rounded-lg bg-[#e9e9ec] shrink-0 overflow-hidden">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover object-center"
                                    sizes="48px"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="truncate text-xs font-semibold uppercase tracking-tight">
                                    {item.name}
                                  </p>
                                  <p className={`text-[10px] font-mono uppercase tracking-wider ${
                                    activeIndex === idx ? "text-white/60" : "text-black/40"
                                  }`}>
                                    {item.category}
                                  </p>
                                </div>
                                <span className="font-mono text-xs font-bold shrink-0 tabular-nums">
                                  ₹{item.price.toLocaleString("en-IN")}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* 2. Empty State */}
                      {!loading && debouncedQuery === query && debouncedQuery.length >= 2 && results.length === 0 && (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-8 text-center"
                        >
                          <p className="text-xs font-mono uppercase tracking-wider text-black mb-1">
                            No pieces found for &ldquo;{debouncedQuery}&rdquo;
                          </p>
                          <p className="text-[11px] font-mono text-black/40">
                            Try denim, cargos, or tees.
                          </p>
                        </motion.div>
                      )}

                      {/* 3. Idle State — compact tags only */}
                      {query.length < 2 && (
                        <motion.div
                          key="hint"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div>
                            <p className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-black/40 mb-2.5">
                              Popular
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {POPULAR_SEARCHES.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    setQuery(tag);
                                    inputRef.current?.focus();
                                  }}
                                  className="px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black hover:text-white transition-colors text-[10.5px] font-mono tracking-tight text-black/75 cursor-pointer"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-black/8 flex items-center justify-between text-[10px] font-mono text-black/35">
                            <span>Type to search</span>
                            <span>Esc to close</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
