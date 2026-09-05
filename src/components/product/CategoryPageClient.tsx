"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard, { Product } from "@/components/product/ProductCard";
import AddToBagButton from "@/components/ui/AddToBagButton";
import { LayoutGrid, List, ArrowLeft } from "lucide-react";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import FilterPopover, { DEFAULT_COLOR_SWATCHES } from "@/components/product/FilterPopover";
import CustomDropdown, { DropdownOption } from "@/components/ui/CustomDropdown";

const NO_PRODUCTS: Product[] = [];

const SORT_OPTIONS: DropdownOption[] = [
  { value: "Newest", label: "Newest", shortLabel: "Newest" },
  { value: "Price: Low to High", label: "Price: Low → High", shortLabel: "Price: Low → High" },
  { value: "Price: High to Low", label: "Price: High → Low", shortLabel: "Price: High → Low" },
];

function CatalogueRailCard({ product }: { product: Product }) {
  return (
    <article className="group w-[min(58vw,18rem)] shrink-0 sm:w-[min(34vw,20rem)]" role="listitem">
      <Link href={`/product/${product.id}`} className="block">
        <div className="media-card relative aspect-[4/5] w-full overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              draggable={false}
              sizes="(max-width: 639px) 58vw, 320px"
              className="object-contain p-4 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--surface-panel)]" />
          )}
          {product.isSoldOut && (
            <span className="absolute left-3 top-3 bg-black px-2 py-1 text-[9px] font-semibold tracking-[0.12em] text-white">
              Sold Out
            </span>
          )}
          {!product.isSoldOut && (
            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <AddToBagButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  isSoldOut: product.isSoldOut,
                  sizes: product.sizes,
                  colors: product.colors,
                }}
                className="h-9 w-9 rounded-full border border-black/10 bg-white/90 p-0"
              />
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-3 border-b border-black/10 py-3">
        <Link href={`/product/${product.id}`} className="min-w-0">
          <h3 className="truncate text-[12px] font-medium leading-tight tracking-[-0.025em] text-black sm:text-[13px]" title={product.name}>
            {product.name}
          </h3>
          <p className="mt-1 text-[10px] tracking-[0.08em] text-black/50">
            {product.isSoldOut ? "Sold out" : "Available now"}
          </p>
        </Link>
        <span className="shrink-0 text-[12px] font-medium tracking-[-0.025em] text-black sm:text-[13px]">
          ₹{product.price.toLocaleString("en-IN")}
        </span>
      </div>
    </article>
  );
}

export default function CategoryPageClient({
  category,
  filter,
  prefix = "Collection",
  title,
  subtitle,
  badge,
}: {
  category?: string;
  filter?: string;
  prefix?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  // Monumental uppercase title and kicker matching Wishlist page design
  const cleanTitle = useMemo(() => {
    if (query) return `“${query}”`;
    if (title) {
      return title.replace(/^Collection\s*\/?\s*/i, "").trim().toUpperCase();
    }
    if (category) return category.toUpperCase();
    return "ALL DROPS";
  }, [title, category, query]);

  const displayEyebrow = useMemo(() => {
    if (badge) return badge.toUpperCase();
     if (query) return "SEARCH RESULTS";
     if (category === "topwears") return "TOPS";
     if (category === "bottomwears") return "BOTTOMS";
     if (category === "accessories") return "ACCESSORIES";
     if (category === "unisex") return "UNISEX";
     if (filter === "new") return "JUST IN";
     if (filter === "curated-grails") return "HARD-TO-FIND PIECES";
     return "ALL PIECES";
  }, [badge, query, category, filter]);

  const [sortBy, setSortBy] = useState("Newest");
  const [sizeFilter, setSizeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(5000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [reloadToken, setReloadToken] = useState(0);

  const queryKey = `${category ?? ""}|${filter ?? ""}|${query}|${reloadToken}`;
  const [result, setResult] = useState<{
    key: string;
    products: Product[];
    failed: boolean;
  } | null>(null);

  const isCurrent = result?.key === queryKey;
  const loading = !isCurrent;
  const loadFailed = isCurrent && result.failed;
  const products = isCurrent ? result.products : NO_PRODUCTS;

  useEffect(() => {
    let url = "/api/products";
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (filter) params.append("filter", filter);
    if (query) params.append("q", query);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setResult({
          key: queryKey,
          products: Array.isArray(data) ? data : NO_PRODUCTS,
          failed: false,
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error fetching products:", err);
        setResult({ key: queryKey, products: NO_PRODUCTS, failed: true });
      });

    return () => controller.abort();
  }, [category, filter, query, queryKey]);

  const contextualCategories = useMemo(() => {
    if (category === "topwears") {
      return [
        { id: "hoodie", label: "Hoodies" },
        { id: "tee", label: "T-Shirts" },
        { id: "jacket", label: "Jackets" },
        { id: "sweater", label: "Sweaters" },
      ];
    }
    if (category === "bottomwears") {
      return [
        { id: "cargo", label: "Cargo Pants" },
        { id: "denim", label: "Denim Jeans" },
        { id: "skater", label: "Skater Pants" },
        { id: "shorts", label: "Shorts" },
      ];
    }
    if (category === "accessories") {
      return [
        { id: "bag", label: "Bags & Slings" },
        { id: "hardware", label: "Hardware" },
        { id: "belt", label: "Belts" },
        { id: "headwear", label: "Headwear" },
      ];
    }
    return [
      { id: "topwears", label: "Topwears" },
      { id: "bottomwears", label: "Bottomwears" },
      { id: "accessories", label: "Accessories" },
      { id: "hoodie", label: "Hoodies" },
      { id: "cargo", label: "Cargos" },
      { id: "denim", label: "Denim" },
    ];
  }, [category]);

  const contextualSizes = useMemo(() => {
    if (category === "bottomwears") {
      return ["28", "30", "32", "34", "36", "S", "M", "L"];
    }
    if (category === "accessories") {
      return ["OS", "S/M", "L/XL"];
    }
    return ["XS", "S", "M", "L", "XL"];
  }, [category]);

  const maxCatalogPrice = useMemo(() => {
    if (!products || products.length === 0) return 5000;
    const max = Math.max(...products.map((p) => p.price));
    return Math.max(5000, Math.ceil(max / 500) * 500);
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (selectedMaxPrice < maxCatalogPrice) {
      result = result.filter((p) => p.price <= selectedMaxPrice);
    }

    if (sizeFilter) {
      result = result.filter(
        (p) =>
          p.sizes &&
          p.sizes.some((s) => s.toLowerCase() === sizeFilter.toLowerCase())
      );
    }

    if (colorFilter) {
      const swatch = DEFAULT_COLOR_SWATCHES.find((s) => s.id === colorFilter);
      const aliases = swatch?.aliases ?? [colorFilter];
      result = result.filter((p) => {
        if (!p.colors || p.colors.length === 0) return false;
        return p.colors.some((col) =>
          aliases.some((alias) => col.toLowerCase().includes(alias.toLowerCase()))
        );
      });
    }

    if (categoryFilter) {
      const catLower = categoryFilter.toLowerCase();
      result = result.filter((p) => {
        const prodCat = (p.category || "").toLowerCase();
        const prodName = (p.name || "").toLowerCase();
        const prodDesc = (p.description || "").toLowerCase();
        return (
          prodCat === catLower ||
          prodCat.includes(catLower) ||
          prodName.includes(catLower) ||
          prodDesc.includes(catLower)
        );
      });
    }

    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, sortBy, selectedMaxPrice, maxCatalogPrice, sizeFilter, colorFilter, categoryFilter]);

  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount);
  }, [filteredAndSortedProducts, visibleCount]);

  const resetFilters = () => {
    setSizeFilter("");
    setColorFilter("");
    setCategoryFilter("");
    setSelectedMaxPrice(maxCatalogPrice);
    setSortBy("Newest");
  };

  const hasActiveFilters = Boolean(
    sizeFilter ||
    colorFilter ||
    categoryFilter ||
    selectedMaxPrice < maxCatalogPrice ||
    sortBy !== "Newest"
  );

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10 selection:bg-black selection:text-white">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Navigation Bar matching Wishlist page */}
        <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-3">
          <Link
            href="/"
            className="editorial-back inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
          <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black/35 sm:block">
            BAGIFYYYY / ARCHIVE
          </span>
        </div>

        {/* Monumental Editorial Header matching Wishlist page */}
        <header className="editorial-page-header mb-8 border-b border-black/10 pb-6 sm:mb-12 sm:pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="editorial-kicker mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">
                {displayEyebrow}
              </p>
              <h1 className="max-w-[16ch] font-microgramma text-[clamp(2rem,5.5vw,5.2rem)] font-bold uppercase leading-[0.88] tracking-tight text-[#050505]">
                {cleanTitle}
              </h1>
              {subtitle ? (
                <p className="mt-5 max-w-xl text-xs leading-relaxed text-black/60 sm:text-sm">
                  {subtitle}
                </p>
              ) : query ? (
                <p className="mt-5 max-w-xl text-xs leading-relaxed text-black/60 sm:text-sm">
                  {loading
                     ? "Searching the catalogue…"
                    : `${filteredAndSortedProducts.length} ${
                        filteredAndSortedProducts.length === 1 ? "piece" : "pieces"
                      } matching “${query}”`}
                </p>
              ) : (
                <p className="mt-5 max-w-xl text-xs leading-relaxed text-black/60 sm:text-sm">
                   Browse the current run. Stock changes as pieces move, and some will not return.
                </p>
              )}
            </div>

            {/* Right: Actions bar (Filter button + View toggle + Sort) */}
            <div className="flex items-center gap-5 sm:gap-7 self-start md:self-end flex-wrap pb-0.5 shrink-0">
              {/* Filter Popover Dropdown */}
              <FilterPopover
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen((prev) => !prev)}
                onClose={() => setIsFilterOpen(false)}
                availableColors={DEFAULT_COLOR_SWATCHES}
                selectedColor={colorFilter}
                onColorChange={setColorFilter}
                availableSizes={contextualSizes}
                selectedSize={sizeFilter}
                onSizeChange={setSizeFilter}
                minPrice={0}
                maxPrice={maxCatalogPrice}
                selectedMaxPrice={selectedMaxPrice}
                onPriceChange={setSelectedMaxPrice}
                availableCategories={contextualCategories}
                selectedCategory={categoryFilter}
                onCategoryChange={setCategoryFilter}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
                totalFilteredCount={filteredAndSortedProducts.length}
              />

              {/* Custom Sort Dropdown */}
              <CustomDropdown
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
                labelPrefix="Sort:"
                ariaLabel="Sort products"
              />

              {/* View Toggle */}
              <div
                className="hidden sm:flex items-center overflow-hidden rounded-[var(--radius-cta)] border border-black/15"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Grid view"
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-black text-white"
                      : "bg-transparent text-black/50 hover:bg-black/5"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label="List view"
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-black text-white"
                      : "bg-transparent text-black/50 hover:bg-black/5"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full pb-32">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="media-card aspect-[4/5] w-full mb-3" />
                  <div className="h-2.5 bg-[#EFEFEF] rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-[#EFEFEF] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : loadFailed ? (
            <div className="flex flex-col items-center justify-center py-32 text-center" role="alert">
              <div className="w-px h-12 bg-black/20 mb-8" aria-hidden="true" />
              <h3 className="font-sans font-bold text-2xl tracking-tight mb-2 text-black">
                Couldn&apos;t Load
              </h3>
              <p className="text-[11px] tracking-[0.06em] text-black/50 mb-8 max-w-sm">
                Something went wrong reaching our catalogue. Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => setReloadToken((prev) => prev + 1)}
                className="btn-bagify btn-bagify-dark px-8 text-[11px] tracking-[0.1em] cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-px h-12 bg-black/20 mb-8" aria-hidden="true" />
              <h3 className="font-sans font-bold text-2xl tracking-tight mb-2 text-black">
                Nothing Found
              </h3>
              <p className="text-[11px] tracking-[0.06em] text-black/50 mb-8">
                 Try removing a filter or widening your price range.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-bagify btn-bagify-dark px-8 text-[11px] tracking-[0.1em] cursor-pointer"
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
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                    : "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-14 xl:gap-16"
                }
                role="list"
                aria-label={`${filteredAndSortedProducts.length} products`}
              >
                {viewMode === "grid" ? (
                  displayedProducts.map((product) => (
                    <div key={product.id} role="listitem">
                      <ProductCard product={product} />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="min-w-0 border-t border-black/10 pt-5 pr-4 lg:sticky lg:top-24 lg:h-fit">
                      <p className="mb-3 text-[10.5px] font-semibold tracking-[0.14em] text-black/45">
                        {displayEyebrow}
                      </p>
                      <h2 className="w-full max-w-full font-microgramma text-[clamp(1.4rem,2vw,2.1rem)] font-bold uppercase leading-[0.92] tracking-tight text-black break-words">
                        {cleanTitle}
                      </h2>
                      <p className="mt-5 max-w-[15rem] text-[11.5px] leading-[1.5] tracking-[0.04em] text-black/50">
                         {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? "piece" : "pieces"} in this run.
                      </p>
                      <Link href="/size-guide" className="mt-10 inline-flex items-center gap-2 border-b border-black pb-1 text-[11px] font-semibold tracking-[0.08em] text-black">
                        Size Guide <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                    <div className="min-w-0 overflow-hidden border-t border-black/10 pt-5">
                      <div className="catalogue-rail flex gap-5 overflow-x-auto pb-5 sm:gap-6" role="list" aria-label={`${filteredAndSortedProducts.length} products in catalogue rail`}>
                        {displayedProducts.map((product) => (
                          <CatalogueRailCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Load More */}
              {visibleCount < filteredAndSortedProducts.length && (
                <div className="flex flex-col items-center mt-20 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="btn-bagify btn-bagify-dark px-12 text-[10.5px] tracking-[0.18em] cursor-pointer"
                    aria-label={`Load 12 more products — ${filteredAndSortedProducts.length - visibleCount} remaining`}
                  >
                    Load More
                  </button>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
                    {filteredAndSortedProducts.length - visibleCount} remaining
                  </span>
                </div>
              )}

              {/* ── Recently Viewed Section (Visible if user has viewed products) ── */}
              <div className="mt-28 pt-12 border-t border-black/10">
                <RecentlyViewed />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
