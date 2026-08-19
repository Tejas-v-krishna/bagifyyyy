"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type SearchResult = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  price: number;
  image: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 220);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? []);
        setHighlighted(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setHighlighted(-1);
  }, []);

  // Global keyboard shortcut — Ctrl/Cmd+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? close() : open();
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
    } else if (e.key === "Enter" && highlighted >= 0 && results[highlighted]) {
      close();
      window.location.href = `/product/${results[highlighted].id}`;
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={open}
        aria-label="Search products"
        className="flex items-center text-y2k-gunmetal/75 hover:text-black transition-colors cursor-pointer"
      >
        <Search className="w-5 h-5 lg:w-[18px] lg:h-[18px]" strokeWidth={1.75} />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={close}
            />

            {/* Panel */}
            <motion.div
              key="search-panel"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 right-0 z-[70] bg-y2k-ice border-b border-y2k-gunmetal/15 shadow-2xl"
            >
              {/* Search input row */}
              <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-[72px]">
                <Search className="w-5 h-5 text-y2k-gunmetal/50 shrink-0" strokeWidth={1.5} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pieces, brands, categories…"
                  className="flex-1 bg-transparent text-lg font-medium text-y2k-gunmetal placeholder:text-y2k-gunmetal/30 outline-none tracking-tight"
                  autoComplete="off"
                />
                {loading && <Loader2 className="w-4 h-4 text-y2k-gunmetal/40 animate-spin shrink-0" />}
                <button
                  onClick={close}
                  className="text-y2k-gunmetal/50 hover:text-black transition-colors shrink-0 cursor-pointer p-2 -mr-2"
                >
                  <X className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Results */}
              <AnimatePresence mode="wait">
                {results.length > 0 && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="max-w-3xl mx-auto px-4 sm:px-6 pb-6 overflow-hidden"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/40 mb-3 pt-1">
                      {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{debouncedQuery}&rdquo;
                    </p>
                    <ul className="flex flex-col gap-1">
                      {results.map((item, idx) => (
                        <li key={item.id}>
                          <Link
                            href={`/product/${item.id}`}
                            onClick={close}
                            className={`flex items-center gap-4 px-3 py-2.5 transition-colors group ${
                              highlighted === idx
                                ? "bg-y2k-gunmetal/8"
                                : "hover:bg-y2k-gunmetal/5"
                            }`}
                            onMouseEnter={() => setHighlighted(idx)}
                          >
                            {/* Thumbnail */}
                            <div className="w-10 h-12 relative bg-gray-100 shrink-0 overflow-hidden">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-y2k-gunmetal leading-tight truncate group-hover:text-black">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-y2k-gunmetal/50 uppercase tracking-widest mt-0.5">
                                {item.brand ?? "BAGIFYYYY"} · {item.category}
                              </p>
                            </div>
                            {/* Price */}
                            <span className="text-sm font-bold text-y2k-gunmetal shrink-0">
                              ₹{item.price.toLocaleString("en-IN")}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-y2k-gunmetal/30 group-hover:text-black shrink-0 transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* View all link */}
                    <div className="mt-4 pt-3 border-t border-y2k-gunmetal/10">
                      <Link
                        href={`/products?q=${encodeURIComponent(debouncedQuery)}`}
                        onClick={close}
                        className="text-[10px] font-bold uppercase tracking-widest text-y2k-gunmetal/60 hover:text-black transition-colors flex items-center gap-1.5"
                      >
                        See all results for &ldquo;{debouncedQuery}&rdquo; <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* Empty state */}
                {!loading && debouncedQuery === query && debouncedQuery.length >= 2 && results.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto px-4 sm:px-6 pb-6"
                  >
                    <p className="text-xs text-y2k-gunmetal/50 font-medium py-3">
                      No results for &ldquo;{debouncedQuery}&rdquo; — try a different search term.
                    </p>
                  </motion.div>
                )}

                {/* Hint when empty */}
                {query.length < 2 && (
                  <motion.div
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto px-4 sm:px-6 pb-5 flex items-center justify-between"
                  >
                    <p className="text-[10px] text-y2k-gunmetal/35 uppercase tracking-widest">
                      Type at least 2 characters to search
                    </p>
                    <span className="text-[10px] text-y2k-gunmetal/25 font-mono hidden sm:block">ESC to close</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
