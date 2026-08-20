"use client";

import { useState, useEffect, useMemo } from "react";
import ProductCard, { Product } from "@/components/product/ProductCard";
import { SlidersHorizontal, LayoutGrid, List, RotateCcw } from "lucide-react";

export default function CategoryPageClient({
  category,
  filter,
  title,
  subtitle,
  badge,
}: {
  category?: string;
  filter?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState("Newest");
  const [sizeFilter, setSizeFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("All Prices");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    let url = "/api/products";
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (filter) params.append("filter", filter);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, [category, filter]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (priceFilter === "Under ₹500") {
      result = result.filter((p) => p.price < 500);
    } else if (priceFilter === "₹500–₹1500") {
      result = result.filter((p) => p.price >= 500 && p.price <= 1500);
    } else if (priceFilter === "Over ₹1500") {
      result = result.filter((p) => p.price > 1500);
    }

    if (sizeFilter) {
      result = result.filter(
        (p) =>
          p.sizes &&
          p.sizes.some((s) => s.toLowerCase() === sizeFilter.toLowerCase())
      );
    }

    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, sortBy, priceFilter, sizeFilter]);

  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount);
  }, [filteredAndSortedProducts, visibleCount]);

  const resetFilters = () => {
    setSizeFilter("");
    setPriceFilter("All Prices");
    setSortBy("Newest");
  };

  const hasActiveFilters = sizeFilter || priceFilter !== "All Prices" || sortBy !== "Newest";

  return (
    <div className="w-full min-h-screen flex flex-col bg-y2k-ice">

      {/* Page Header — with WCAG-safe fade-up animation */}
      <div className="shrink-0 px-6 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto pt-16 md:pt-20 mb-10">
        <div className="flex flex-row items-end justify-between gap-4 border-b border-y2k-gunmetal/[0.07] pb-8">
          {/* Left: Title block */}
          <div className="flex flex-col">
            {badge && (
              <span className="section-label text-y2k-gunmetal/40 mb-3">{badge}</span>
            )}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] uppercase tracking-[-0.04em] leading-none text-y2k-gunmetal animate-fade-up">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-[0.16em] text-y2k-gunmetal/40 mt-3 animate-fade-up delay-100">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right: Count */}
          <div
            className="flex items-baseline gap-1.5 shrink-0 pb-1 animate-fade-up delay-200"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="font-display text-4xl sm:text-5xl text-y2k-gunmetal leading-none tracking-tight">
              {loading ? "--" : String(filteredAndSortedProducts.length).padStart(2, "0")}
            </span>
            <span className="section-label text-y2k-gunmetal/40">
              {filteredAndSortedProducts.length === 1 ? "PIECE" : "PIECES"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-y2k-gunmetal/[0.06] mb-12 gap-4 px-6 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto"
        role="search"
        aria-label="Filter and sort products"
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-y2k-gunmetal/50 mr-1" aria-hidden="true">
            <SlidersHorizontal className="w-3 h-3" />
            Filter
          </div>

          {/* Size Filter */}
          <label className="sr-only" htmlFor="size-filter">Filter by size</label>
          <select
            id="size-filter"
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="bg-transparent border-b border-y2k-gunmetal/15 px-1 pb-1 text-[10px] uppercase tracking-[0.14em] text-y2k-gunmetal focus:outline-none focus:border-y2k-gunmetal cursor-pointer hover:border-y2k-gunmetal/40 transition-colors"
          >
            <option value="">Size: All</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="28">28</option>
            <option value="30">30</option>
            <option value="32">32</option>
            <option value="34">34</option>
            <option value="36">36</option>
          </select>

          {/* Price Filter */}
          <label className="sr-only" htmlFor="price-filter">Filter by price</label>
          <select
            id="price-filter"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="bg-transparent border-b border-y2k-gunmetal/15 px-1 pb-1 text-[10px] uppercase tracking-[0.14em] text-y2k-gunmetal focus:outline-none focus:border-y2k-gunmetal cursor-pointer hover:border-y2k-gunmetal/40 transition-colors"
          >
            <option value="All Prices">Price: All</option>
            <option value="Under ₹500">Under ₹500</option>
            <option value="₹500–₹1500">₹500 – ₹1500</option>
            <option value="Over ₹1500">Over ₹1500</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-y2k-gunmetal/40 hover:text-y2k-gunmetal transition-colors ml-1 cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-2"
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Reset
            </button>
          )}
        </div>

        {/* Right: count + view toggle + sort */}
        <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
          <div
            className="hidden sm:flex items-center text-[9px] uppercase tracking-[0.2em] text-y2k-gunmetal/35 pr-4 border-r border-y2k-gunmetal/[0.08]"
            aria-live="polite"
          >
            {filteredAndSortedProducts.length} Available
          </div>

          {/* View Toggle */}
          <div
            className="flex items-center border border-y2k-gunmetal/[0.1]"
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
              className={`p-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-y2k-gunmetal ${
                viewMode === "grid"
                  ? "bg-y2k-gunmetal text-white"
                  : "bg-transparent text-y2k-gunmetal/40 hover:bg-y2k-gunmetal/[0.06]"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
              className={`p-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-y2k-gunmetal ${
                viewMode === "list"
                  ? "bg-y2k-gunmetal text-white"
                  : "bg-transparent text-y2k-gunmetal/40 hover:bg-y2k-gunmetal/[0.06]"
              }`}
            >
              <List className="w-3 h-3" />
            </button>
          </div>

          {/* Sort */}
          <label className="sr-only" htmlFor="sort-select">Sort products</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-b border-y2k-gunmetal/15 px-1 pb-1 text-[10px] uppercase tracking-[0.14em] text-y2k-gunmetal focus:outline-none focus:border-y2k-gunmetal cursor-pointer hover:border-y2k-gunmetal/40 transition-colors"
          >
            <option value="Newest">Newest First</option>
            <option value="Price: Low to High">Price: Low → High</option>
            <option value="Price: High to Low">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 sm:px-8 lg:px-16 w-full max-w-[1800px] mx-auto pb-32">
        {loading ? (
          /* Static skeleton — no pulse/flash (WCAG 2.3.1 — no content flashing >3Hz) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-16">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="bg-y2k-pale/25 aspect-[4/5] w-full mb-4" />
                <div className="h-2 bg-y2k-pale/25 w-3/4 mb-2" />
                <div className="h-2 bg-y2k-pale/25 w-1/3" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-px h-16 bg-y2k-gunmetal/12 mb-12" aria-hidden="true" />
            <h3 className="font-display text-3xl uppercase tracking-[-0.03em] mb-3 text-y2k-gunmetal">
              Nothing Found
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-y2k-gunmetal/40 mb-10">
              Adjust your filters to see available pieces.
            </p>
            <button
              onClick={resetFilters}
              className="btn-bagify px-10 py-4 text-[10px] uppercase tracking-[0.2em] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-2"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-16"
                  : "flex flex-col gap-6"
              }
              role="list"
              aria-label={`${filteredAndSortedProducts.length} products`}
            >
              {displayedProducts.map((product) => (
                <div key={product.id} role="listitem">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Load More */}
            {visibleCount < filteredAndSortedProducts.length && (
              <div className="flex flex-col items-center mt-20 gap-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="btn-bagify px-14 py-4 text-[10px] uppercase tracking-[0.22em] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-2"
                  aria-label={`Load 12 more products — ${filteredAndSortedProducts.length - visibleCount} remaining`}
                >
                  Load More
                </button>
                <span className="text-[9px] uppercase tracking-[0.2em] text-y2k-gunmetal/35">
                  {filteredAndSortedProducts.length - visibleCount} remaining
                </span>
                <div className="w-px h-8 bg-y2k-gunmetal/12" aria-hidden="true" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
