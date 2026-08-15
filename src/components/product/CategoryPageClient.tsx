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

    // Filter by Price
    if (priceFilter === "Under ₹500") {
      result = result.filter((p) => p.price < 500);
    } else if (priceFilter === "₹500–₹1500") {
      result = result.filter((p) => p.price >= 500 && p.price <= 1500);
    } else if (priceFilter === "Over ₹1500") {
      result = result.filter((p) => p.price > 1500);
    }

    // Filter by Size
    if (sizeFilter) {
      result = result.filter(
        (p) =>
          p.sizes &&
          p.sizes.some((s) => s.toLowerCase() === sizeFilter.toLowerCase())
      );
    }

    // Sort
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

  return (
    <div className="w-full min-h-screen flex flex-col pt-12 bg-y2k-ice">
      {/* Header with Split Left Info & Right-Side Product Numbering */}
      <div className="mb-8 shrink-0 px-4 sm:px-6 lg:px-12 w-full max-w-[1800px] mx-auto">
        <div className="flex flex-row items-end justify-between gap-4 border-b border-y2k-gunmetal/10 pb-6">
          {/* Left: Category Title */}
          <div className="flex flex-col">
            <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl uppercase tracking-[-0.03em] leading-none py-1 text-y2k-gunmetal">
              {title}
            </h1>
          </div>

          {/* Right: Clean Minimalist Numbering Counter */}
          <div className="flex items-baseline gap-1.5 shrink-0 select-none pb-0.5">
            <span className="font-display font-medium text-3xl sm:text-4xl md:text-5xl text-y2k-gunmetal leading-none tracking-tight">
              {loading ? "--" : String(filteredAndSortedProducts.length).padStart(2, "0")}
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-y2k-gunmetal/60 font-sans">
              {filteredAndSortedProducts.length === 1 ? "PIECE" : "PIECES"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center py-3.5 border-b border-y2k-gunmetal/10 mb-10 gap-4 px-4 sm:px-6 lg:px-12 w-full max-w-[1800px] mx-auto">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-[0.14em] text-[11px] text-y2k-gunmetal mr-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </div>

          {/* Size Filter Dropdown */}
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="bg-transparent border border-y2k-gunmetal/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal focus:outline-none focus:border-y2k-gunmetal cursor-pointer"
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

          {/* Price Filter Dropdown */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="bg-transparent border border-y2k-gunmetal/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal focus:outline-none focus:border-y2k-gunmetal cursor-pointer"
          >
            <option value="All Prices">Price: All</option>
            <option value="Under ₹500">Under ₹500</option>
            <option value="₹500–₹1500">₹500 – ₹1500</option>
            <option value="Over ₹1500">Over ₹1500</option>
          </select>

          {/* Reset Filters Button */}
          {(sizeFilter || priceFilter !== "All Prices" || sortBy !== "Newest") && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70 hover:text-black transition-colors ml-2 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Right Side: Product Count & View Mode & Sort Dropdown */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Subtle Live Counter */}
          <div className="hidden sm:flex items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-y2k-gunmetal/60 pr-3 border-r border-y2k-gunmetal/15">
            <span>{filteredAndSortedProducts.length} AVAILABLE</span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-y2k-gunmetal/20">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-y2k-gunmetal text-white"
                  : "bg-transparent text-y2k-gunmetal hover:bg-black/5"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-y2k-gunmetal text-white"
                  : "bg-transparent text-y2k-gunmetal hover:bg-black/5"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border border-y2k-gunmetal/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-y2k-gunmetal focus:outline-none focus:border-y2k-gunmetal cursor-pointer"
          >
            <option value="Newest">Sort: Newest First</option>
            <option value="Price: Low to High">Sort: Price Low → High</option>
            <option value="Price: High to Low">Sort: Price High → Low</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 sm:px-6 lg:px-12 w-full max-w-[1800px] mx-auto pb-24">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col">
                <div className="bg-black/5 aspect-[4/5] w-full mb-3" />
                <div className="h-3 bg-black/5 w-3/4 mb-1" />
                <div className="h-3 bg-black/5 w-1/4" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-y2k-gunmetal/20">
            <h3 className="font-display font-medium text-2xl uppercase tracking-wider mb-2 text-y2k-gunmetal">
              No Archive Pieces Found
            </h3>
            <p className="text-xs text-y2k-gunmetal/60 mb-6 uppercase tracking-wider">
              Try adjusting your active filters or clear them to view all items.
            </p>
            <button
              onClick={resetFilters}
              className="btn-bagify px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12"
                  : "flex flex-col gap-4"
              }
            >
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredAndSortedProducts.length && (
              <div className="flex justify-center mt-16">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="btn-bagify border border-y2k-gunmetal/30 hover:border-y2k-gunmetal px-10 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-y2k-gunmetal/90 transition-all shadow-md cursor-pointer"
                >
                  Load More Verified Pieces ({filteredAndSortedProducts.length - visibleCount} Remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
