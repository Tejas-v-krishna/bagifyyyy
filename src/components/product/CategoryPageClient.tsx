"use client";

import { useState, useEffect, useMemo } from "react";
import ProductCard, { Product } from "@/components/product/ProductCard";
import { SlidersHorizontal, LayoutGrid, List, RotateCcw } from "lucide-react";

export default function CategoryPageClient({
  category,
  title,
}: {
  category?: string;
  title: string;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState("Newest");
  const [sizeFilter, setSizeFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("All Prices");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const url = category
      ? `/api/products?category=${category}`
      : "/api/products";
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
  }, [category]);

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
      {/* Header */}
      <div className="mb-10 shrink-0 px-4 sm:px-6 lg:px-12 w-full max-w-[1800px] mx-auto">
        <h1 className="font-display font-medium text-5xl md:text-6xl uppercase tracking-[-0.06em] leading-[0.85] mb-2">
          {title}
        </h1>
        <p className="text-y2k-gunmetal/70 font-medium uppercase tracking-widest text-sm">
          {loading
            ? "Loading archive..."
            : `${title} — ${filteredAndSortedProducts.length} Items`}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-y border-y2k-gunmetal/20 mb-12 gap-4 px-4 sm:px-6 lg:px-12 w-full max-w-[1800px] mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-sm mr-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </div>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="border border-y2k-gunmetal/30 bg-transparent text-xs font-semibold uppercase tracking-wider px-3.5 py-2.5 rounded-none outline-none cursor-pointer"
          >
            <option value="">All Sizes</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="border border-y2k-gunmetal/30 bg-transparent text-xs font-semibold uppercase tracking-wider px-3.5 py-2.5 rounded-none outline-none cursor-pointer"
          >
            <option value="All Prices">All Prices</option>
            <option value="Under ₹500">Under ₹500</option>
            <option value="₹500–₹1500">₹500–₹1500</option>
            <option value="Over ₹1500">Over ₹1500</option>
          </select>

          {(sizeFilter || priceFilter !== "All Prices") && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-y2k-slate hover:text-y2k-gunmetal transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-y2k-gunmetal/30 bg-transparent text-xs font-semibold uppercase tracking-wider px-3.5 py-2.5 rounded-none outline-none cursor-pointer"
            >
              <option value="Newest">Newest</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-y2k-gunmetal/20 pl-6">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 ${
                viewMode === "grid"
                  ? "text-y2k-gunmetal"
                  : "text-y2k-gunmetal/50 hover:text-y2k-gunmetal"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="sr-only">Grid View</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 ${
                viewMode === "list"
                  ? "text-y2k-gunmetal"
                  : "text-y2k-gunmetal/50 hover:text-y2k-gunmetal"
              }`}
            >
              <List className="w-5 h-5" />
              <span className="sr-only">List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid / Empty State */}
      <div
        className={`flex-1 w-full ${
          viewMode === "grid"
            ? "border-t border-l border-y2k-gunmetal/15 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid grid-cols-1 gap-y-8 max-w-4xl mx-auto px-4 w-full"
        }`}
      >
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-32 text-y2k-gunmetal/50 uppercase tracking-widest font-bold">
            Loading archive...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-70">
            <p className="text-y2k-gunmetal uppercase tracking-widest font-bold text-lg mb-2">
              No drops match your filters
            </p>
            <p className="text-y2k-gunmetal/70 text-xs font-medium uppercase tracking-widest mb-6">
              Try adjusting your price or size filter.
            </p>
            <button
              onClick={resetFilters}
              className="btn-bagify px-6 py-3 font-bold text-xs uppercase tracking-widest"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          displayedProducts.map((product) => (
            <div
              key={product.id}
              className={
                viewMode === "list"
                  ? "flex gap-6 border-b border-y2k-gunmetal/20 pb-8"
                  : "w-full bg-[#f4f4f4] border-r border-b border-y2k-gunmetal/15"
              }
            >
              {viewMode === "list" ? (
                <>
                  <div className="w-48 shrink-0">
                    <ProductCard product={product} />
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <p className="text-xs text-y2k-gunmetal/60 uppercase tracking-widest mb-2">
                      {product.brand}
                    </p>
                    <h3 className="font-bold text-xl uppercase tracking-wide mb-2">
                      {product.name}
                    </h3>
                    <p className="font-medium text-lg mb-4">
                      ₹{product.price.toFixed(2)}
                    </p>
                    <p className="text-y2k-gunmetal/70 text-sm max-w-md mb-6">
                      {product.description ||
                        "A staple piece featuring signature Y2K aesthetic details. Designed for a relaxed, oversized fit."}
                    </p>
                  </div>
                </>
              ) : (
                <ProductCard product={product} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {!loading &&
        displayedProducts.length < filteredAndSortedProducts.length && (
          <div className="mt-24 mb-16 shrink-0 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="bg-[#232D3B] text-[#F8F5E9] rounded-none px-8 py-3 font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Load More ({filteredAndSortedProducts.length - displayedProducts.length} remaining)
            </button>
          </div>
        )}
    </div>
  );
}
