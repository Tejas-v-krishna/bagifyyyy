"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

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
}: {
  variant?: "text" | "pill" | "icon";
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

  // Body scroll lock — stops background scroll including Lenis smooth scrolling
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("lenis-stopped");
      (window as unknown as { __lenis?: { stop: () => void } }).__lenis?.stop();
      return () => {
        document.body.style.overflow = prevOverflow;
        document.documentElement.classList.remove("lenis-stopped");
        (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
      };
    }
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
          className="bg-[#EFEFEF] hover:bg-neutral-200 text-black rounded-md h-9 px-3 flex items-center gap-2 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-black" strokeWidth={2} />
          <span className="hidden xl:inline">Search</span>
          <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-black/40 bg-black/5 rounded">
            ⌘K
          </kbd>
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={open}
          aria-label="Search products"
          aria-expanded={isOpen}
          className="text-current hover:opacity-60 transition-opacity cursor-pointer p-1.5 flex items-center justify-center"
        >
          <Search className="w-4 h-4 text-current" strokeWidth={1.5} />
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

                {/* 2. Full-Width Top Slide-Down Curtain Panel */}
                <motion.div
                  key="search-curtain"
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  role="dialog"
                  aria-modal="true"
                   aria-label="Search products"
                  data-lenis-prevent="true"
                  style={{ backgroundColor: "#f5f5f2" }}
                  className="search-dialog-panel fixed top-0 inset-x-0 z-[10000] bg-[#f5f5f2] border-b border-black/15 shadow-[0_25px_60px_rgba(0,0,0,0.14)] text-black font-sans max-h-[88vh] overflow-y-auto"
                >
                  <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10">
                    {/* Top Search Input Bar */}
                    <div className="flex items-center gap-4 sm:gap-6 py-6 sm:py-8 border-b border-black/10">
                      <Search className="w-6 h-6 sm:w-7 sm:h-7 text-black/40 shrink-0" strokeWidth={1.8} />

                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                         placeholder="SEARCH PRODUCTS, CATEGORIES..."
                        className="search-dialog-input flex-1 bg-transparent text-lg sm:text-xl md:text-2xl font-microgramma font-bold uppercase tracking-tight text-black placeholder:text-black/30 outline-none border-0"
                        autoComplete="off"
                        aria-label="Search input"
                      />

                      {/* Right controls */}
                      <div className="flex items-center gap-3 shrink-0">
                        {loading && (
                          <Loader2
                            className="w-5 h-5 text-black/40 animate-spin"
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
                            className="text-[11px] font-mono uppercase tracking-wider text-black/45 hover:text-black transition-colors px-2 py-1 cursor-pointer"
                            aria-label="Clear query"
                          >
                            Clear
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={close}
                          aria-label="Close search"
                          className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/70 hover:text-black px-3.5 py-2 rounded-full border border-black/15 hover:border-black hover:bg-black hover:text-white transition-all cursor-pointer"
                        >
                          <span className="hidden sm:inline text-[11px]">Close</span>
                          <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="py-6 sm:py-8">
                      <AnimatePresence mode="wait">
                        {/* 1. Results Grid */}
                        {results.length > 0 && (
                          <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center justify-between pb-4 mb-2">
                              <p
                                className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-black/50"
                                aria-live="polite"
                              >
                                {results.length} piece{results.length !== 1 ? "s" : ""} found for &ldquo;{debouncedQuery}&rdquo;
                              </p>
                              <Link
                                href={`/products?q=${encodeURIComponent(debouncedQuery)}`}
                                onClick={close}
                                className="text-xs font-semibold uppercase tracking-[0.12em] text-black hover:opacity-60 transition-opacity inline-flex items-center gap-1"
                              >
                                 <span>See all results</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>

                            {/* Visual Grid matching luxury lookbook */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5" role="listbox">
                              {results.map((item, idx) => (
                                <Link
                                  key={item.id}
                                  href={`/product/${item.id}`}
                                  onClick={close}
                                  role="option"
                                  aria-selected={activeIndex === idx}
                                  className={`group relative flex flex-col rounded-xl p-2.5 transition-all duration-200 ${
                                    activeIndex === idx
                                      ? "bg-black text-white ring-2 ring-black"
                                      : "bg-white hover:bg-white/90 border border-black/10 text-black"
                                  }`}
                                  onMouseEnter={() => setHighlighted(idx)}
                                >
                                  {/* Visual Thumbnail Tile */}
                                  <div className="relative aspect-[3/4] w-full rounded-lg bg-[#EDEDED] overflow-hidden flex items-center justify-center">
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.05]"
                                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                    />
                                  </div>

                                  {/* Information */}
                                  <div className="pt-2.5 flex flex-col flex-1 justify-between">
                                    <div>
                                      <p className={`text-[10px] uppercase font-mono tracking-wider truncate ${
                                        activeIndex === idx ? "text-white/60" : "text-black/45"
                                      }`}>
                                        {item.category}
                                      </p>
                                      <h4 className={`text-xs font-semibold tracking-tight uppercase truncate mt-0.5 ${
                                        activeIndex === idx ? "text-white" : "text-black group-hover:text-black/70"
                                      }`}>
                                        {item.name}
                                      </h4>
                                    </div>
                                    <p className={`text-xs font-mono font-bold mt-2 ${
                                      activeIndex === idx ? "text-white" : "text-black"
                                    }`}>
                                      ₹{item.price.toLocaleString("en-IN")}
                                    </p>
                                  </div>
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
                            className="py-12 text-center max-w-md mx-auto"
                          >
                            <p className="text-base font-bold uppercase tracking-tight text-black mb-1">
                               No products found for &ldquo;{debouncedQuery}&rdquo;
                            </p>
                            <p className="text-xs text-black/50 leading-relaxed mb-6">
                               Try hoodies, denim, cargo, or one of the categories below.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {POPULAR_SEARCHES.slice(0, 5).map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    setQuery(tag);
                                    inputRef.current?.focus();
                                  }}
                                  className="px-3.5 py-1.5 rounded-full bg-white border border-black/15 text-[11px] font-semibold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* 3. Idle / Welcome State (Curated Editorial Directory) */}
                        {query.length < 2 && (
                          <motion.div
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                          >
                            {/* Popular Searches */}
                            <div>
                              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/45 mb-3.5">
                                 Popular searches
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {POPULAR_SEARCHES.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      setQuery(tag);
                                      inputRef.current?.focus();
                                    }}
                                    className="px-4 py-2 rounded-full bg-white border border-black/12 text-xs font-semibold text-black hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer shadow-xs"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Quick Archive Department Links */}
                            <div className="pt-6 border-t border-black/10">
                              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/45 mb-4">
                                 Browse categories
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                  { name: "New Arrivals", href: "/new-arrivals", count: "FW26 Drop" },
                                   { name: "Topwears", href: "/topwears", count: "Tops" },
                                  { name: "Bottomwears", href: "/bottomwears", count: "Denim & Cargos" },
                                   { name: "Bundles", href: "/bundles", count: "Full fits" },
                                ].map((dept) => (
                                  <Link
                                    key={dept.name}
                                    href={dept.href}
                                    onClick={close}
                                    className="p-4 rounded-xl bg-white border border-black/10 hover:border-black transition-all group flex flex-col justify-between"
                                  >
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-black/40">
                                      {dept.count}
                                    </span>
                                    <div className="mt-4 flex items-center justify-between">
                                      <span className="text-xs sm:text-sm font-microgramma font-bold uppercase tracking-tight text-black group-hover:text-black/70">
                                        {dept.name}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-black/30 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-black/40">
                               <span>TYPE AT LEAST 2 CHARACTERS TO SEARCH</span>
                              <span className="hidden sm:inline">PRESS ESC TO DISMISS</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
