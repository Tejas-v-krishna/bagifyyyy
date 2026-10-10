"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/components/product/ProductCard";
import AddToBagButton from "@/components/ui/AddToBagButton";
import { LayoutGrid, List, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import FilterPopover, { DEFAULT_COLOR_SWATCHES } from "@/components/product/FilterPopover";
import CustomDropdown, { DropdownOption } from "@/components/ui/CustomDropdown";

const NO_PRODUCTS: Product[] = [];

const SORT_OPTIONS: DropdownOption[] = [
  { value: "Newest", label: "Newest", shortLabel: "Newest" },
  { value: "Price: Low to High", label: "Price: Low → High", shortLabel: "Price: Low → High" },
  { value: "Price: High to Low", label: "Price: High → Low", shortLabel: "Price: High → Low" },
];

function EditorialGridCard({ product }: { product: Product }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const imageList = product.images && product.images.length > 0 ? product.images : [product.image];

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => stop, []);

  const start = () => {
    if (imageList.length < 2 || timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % imageList.length);
    }, 1200);
  };

  const reset = () => {
    stop();
    setActiveIdx(0);
  };

  return (
    <article className="group" role="listitem" data-animate="scroll-reveal">
      <Link
        href={`/product/${product.id}`}
        aria-label={product.name}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-[#e9e9ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
        onMouseEnter={start}
        onMouseLeave={reset}
        onFocus={start}
        onBlur={reset}
      >
        {imageList.map((src, i) => (
          <Image
            key={`${product.id}-${i}`}
            src={src || "/placeholder.jpg"}
            alt={i === 0 ? product.name : `${product.name} view ${i + 1}`}
            fill
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              i === activeIdx ? "opacity-100" : "opacity-0"
            } ${product.isSoldOut ? "saturate-0 blur-[3px] opacity-50" : ""}`}
          />
        ))}

        {product.isNew && !product.isSoldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/85 backdrop-blur-md border border-white/10 shadow-xs">
            New
          </span>
        )}
        {product.isSoldOut ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/45 backdrop-blur-[5px] z-30 pointer-events-none">
            <span className="bg-white/95 text-black text-[9px] px-3 py-1.5 tracking-[0.14em] uppercase rounded-full font-mono font-bold shadow-lg">
              Somebody bought this
            </span>
            <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/80 font-semibold mt-1">
              Out of stock · 1 of 1
            </span>
          </div>
        ) : product.reserved ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-amber-900 backdrop-blur-md border border-amber-500/30 shadow-xs">
            On Hold
          </span>
        ) : null}

        {!product.isSoldOut && !product.reserved && (
          <div
            className="absolute bottom-3 right-3"
            onClick={(e) => e.preventDefault()}
          >
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
              className="h-10 w-10 rounded-full border border-black/10 bg-white/95 p-0 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 hover:scale-105 active:scale-95"
            />
          </div>
        )}
      </Link>

      <div className="flex items-baseline gap-2 px-0.5 pt-3">
        <Link href={`/product/${product.id}`} className="block min-w-0 flex-1">
          <h3 className="truncate text-[12px] font-semibold leading-tight tracking-tight sm:text-[13px] text-black transition-opacity group-hover:opacity-60" title={product.name}>
            {product.name}
          </h3>
        </Link>
        <span className="shrink-0 text-[12px] font-semibold tracking-tight sm:text-[13px] text-black">
          ₹{product.price.toLocaleString("en-IN")}
        </span>
      </div>
    </article>
  );
}

export default function CategoryPageClient({
  category,
  initialProducts,
  filter,
  title,
}: {
  category?: string;
  /** Server-rendered first paint; skips the initial /api/products round trip. */
  initialProducts?: Product[];
  filter?: string;
  title: string;
  subtitle?: string;
  /** Kept for call-site compatibility; micro-kickers are no longer rendered. */
  prefix?: string;
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

  const [sortBy, setSortBy] = useState("Newest");
  const [sizeFilter, setSizeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [availableSubcategories, setAvailableSubcategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(5000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [reloadToken, setReloadToken] = useState(0);

  const queryKey = `${category ?? ""}|${filter ?? ""}|${query}|${reloadToken}`;

  // Fetch admin-defined subcategories for the current category (e.g. bottomwears)
  useEffect(() => {
    if (!category) return;
    let isMounted = true;
    fetch(`/api/subcategories?category=${category}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.subcategories) {
          setAvailableSubcategories(data.subcategories);
        }
      })
      .catch((err) => console.error("Error fetching subcategories:", err));
    return () => {
      isMounted = false;
    };
  }, [category]);

  // Server-rendered first paint: seed the initial catalogue synchronously so
  // the grid paints with the HTML (no skeleton flash, no /api round trip).
  // Later key changes (search, reload) fall through to the normal fetch.
  // An empty seed (build-time DB hiccup) is treated as "no seed" so the
  // client fetch can recover instead of showing a permanently empty grid.
  const hasSeed = Boolean(initialProducts && initialProducts.length > 0 && !query);
  const seededKey = hasSeed ? `${category ?? ""}|${filter ?? ""}||0` : null;
  const seededProducts = seededKey ? initialProducts : null;
  const [result, setResult] = useState<{
    key: string;
    products: Product[];
    failed: boolean;
  } | null>(
    seededProducts
      ? { key: seededKey as string, products: seededProducts, failed: false }
      : null
  );
  const seededKeyRef = useRef<string | null>(seededKey);

  const isCurrent = result?.key === queryKey;
  const loading = !isCurrent;
  const loadFailed = isCurrent && result.failed;
  const products = isCurrent ? result.products : NO_PRODUCTS;

  useEffect(() => {
    // Initial data already seeded from the server for this exact key.
    if (seededKeyRef.current === queryKey) return;

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

    if (subcategoryFilter) {
      const subLower = subcategoryFilter.toLowerCase();
      result = result.filter((p) => {
        const prodSub = (p.subcategory || "").toLowerCase();
        const prodName = (p.name || "").toLowerCase();
        const prodDesc = (p.description || "").toLowerCase();
        return (
          prodSub === subLower ||
          prodSub.includes(subLower) ||
          prodName.includes(subLower) ||
          prodDesc.includes(subLower)
        );
      });
    }

    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, sortBy, selectedMaxPrice, maxCatalogPrice, sizeFilter, colorFilter, categoryFilter, subcategoryFilter]);

  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount);
  }, [filteredAndSortedProducts, visibleCount]);

  const resetFilters = () => {
    setSizeFilter("");
    setColorFilter("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setSelectedMaxPrice(maxCatalogPrice);
    setSortBy("Newest");
  };

  const hasActiveFilters = Boolean(
    sizeFilter ||
    colorFilter ||
    categoryFilter ||
    subcategoryFilter ||
    selectedMaxPrice < maxCatalogPrice ||
    sortBy !== "Newest"
  );

  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-3 sm:px-6 lg:px-10 py-4 sm:py-8 font-sans text-black selection:bg-black selection:text-white">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Navigation Bar matching Wishlist page */}
        <div className="mb-4 sm:mb-6 flex items-center justify-start border-b border-black/10 pb-2.5">
          <Link
            href="/"
            className="editorial-back inline-flex items-center gap-2 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
        </div>

        {/* Monumental Editorial Header */}
        <header className="editorial-page-header mb-0 pb-4 sm:pb-6">
          <div className="max-w-2xl">
            <h1 className="max-w-[16ch] font-microgramma text-[clamp(1.8rem,5vw,4.5rem)] font-bold uppercase leading-[0.9] tracking-tight text-[#050505]">
              {cleanTitle}
            </h1>
            {query && (
              <p className="mt-3 max-w-xl text-xs leading-relaxed text-black/60 sm:text-sm">
                {loading
                   ? "Searching the catalogue…"
                  : `${filteredAndSortedProducts.length} ${
                      filteredAndSortedProducts.length === 1 ? "piece" : "pieces"
                    } matching “${query}”`}
              </p>
            )}
          </div>
        </header>

        {/* Dynamic Horizontal Sliding Subcategories Bar (Bootcut, Baggy, Cargos, etc.) */}
        {availableSubcategories.length > 0 && (
          <div className="relative mb-6 sm:mb-8">
            <div className="relative group/rail flex items-center">
              {/* Left Scroll Trigger Button for desktop */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("subcategory-scroll-rail");
                  el?.scrollBy({ left: -260, behavior: "smooth" });
                }}
                aria-label="Scroll categories left"
                className="hidden md:flex absolute -left-3.5 z-10 w-8 h-8 rounded-full bg-white border border-black/15 shadow-md items-center justify-center text-black/70 hover:text-black hover:scale-105 transition-all opacity-0 group-hover/rail:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Horizontal Scroll Track */}
              <div
                id="subcategory-scroll-rail"
                className="w-full flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 -mx-1"
                style={{ scrollSnapType: "x mandatory" }}
              >
                <button
                  type="button"
                  onClick={() => setSubcategoryFilter("")}
                  style={{ scrollSnapAlign: "start" }}
                  className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    !subcategoryFilter
                      ? "bg-black text-white border-black shadow-sm ring-1 ring-black/20"
                      : "bg-white/90 text-black/75 border-black/15 hover:border-black hover:text-black hover:bg-white"
                  }`}
                >
                  All Bottomwear
                </button>
                {availableSubcategories.map((sub) => {
                  const isActive = subcategoryFilter === sub.slug;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubcategoryFilter(isActive ? "" : sub.slug)}
                      style={{ scrollSnapAlign: "start" }}
                      className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                        isActive
                          ? "bg-black text-white border-black shadow-sm ring-1 ring-black/20"
                          : "bg-white/90 text-black/75 border-black/15 hover:border-black hover:text-black hover:bg-white"
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Trigger Button for desktop */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("subcategory-scroll-rail");
                  el?.scrollBy({ left: 260, behavior: "smooth" });
                }}
                aria-label="Scroll categories right"
                className="hidden md:flex absolute -right-3.5 z-10 w-8 h-8 rounded-full bg-white border border-black/15 shadow-md items-center justify-center text-black/70 hover:text-black hover:scale-105 transition-all opacity-0 group-hover/rail:opacity-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Sticky toolbar — tools stay in reach while scrolling the rail */}
        <div className="sticky top-[56px] lg:top-[60px] z-30 -mx-3 sm:-mx-6 lg:-mx-10 border-y border-black/10 bg-[#f5f5f2]/90 px-3 sm:px-6 lg:px-10 backdrop-blur-md mb-6 sm:mb-8">
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-end gap-3 py-2 sm:py-2.5">
            {/* Right: Actions bar (Filter button + View toggle + Sort) */}
            <div className="flex items-center gap-3 sm:gap-4">
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
                availableCategories={category ? [] : contextualCategories}
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

              {/* View Toggle — segmented control in the site's CTA language */}
              <div
                className="hidden sm:flex items-center gap-1 rounded-[0.35rem] border border-black/15 bg-white p-1"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Grid view"
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-[0.35rem] transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 ${
                    viewMode === "grid"
                      ? "bg-black text-white"
                      : "bg-transparent text-black/50 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label="List view"
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-[0.35rem] transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 ${
                    viewMode === "list"
                      ? "bg-black text-white"
                      : "bg-transparent text-black/50 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <List className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full pb-32">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="aspect-[4/5] w-full animate-pulse rounded-[15px] bg-black/[0.06]" />
                  <div className="mt-4 h-2.5 w-2/3 animate-pulse rounded bg-black/[0.08]" />
                  <div className="mt-2 h-2.5 w-1/3 animate-pulse rounded bg-black/[0.05]" />
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
                    ? "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6"
                    : "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-14 xl:gap-16"
                }
                role="list"
                aria-label={`${filteredAndSortedProducts.length} products`}
              >
                {viewMode === "grid" ? (
                  displayedProducts.map((product) => (
                    <EditorialGridCard key={product.id} product={product} />
                  ))
                ) : (
                  <>
                    <div className="min-w-0 border-t border-black/10 pt-5 pr-4 lg:sticky lg:top-24 lg:h-fit">
                      <h2 className="w-full max-w-full font-microgramma text-[clamp(1.4rem,2vw,2.1rem)] font-bold uppercase leading-[0.92] tracking-tight text-black break-words">
                        {cleanTitle}
                      </h2>
                      <p className="mt-5 max-w-[15rem] text-[11.5px] leading-[1.5] tracking-[0.04em] text-black/50">
                         {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? "piece" : "pieces"} in this run.
                      </p>
                      <Link href="/size-guide" className="mt-10 inline-flex items-center gap-2 border-b border-black pb-1 text-[11px] font-semibold tracking-[0.08em] text-black">
                        Size Guide <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="min-w-0 overflow-hidden border-t border-black/10">
                      <div className="flex min-w-0 flex-col" role="list" aria-label={`${filteredAndSortedProducts.length} products in catalogue list`}>
                        {displayedProducts.map((product) => {
                          return (
                            <Link
                              key={product.id}
                              role="listitem"
                              href={`/product/${product.id}`}
                              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-black/10 py-4 transition-colors hover:bg-black/[0.02] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-6 sm:px-2"
                            >
                              <span className="relative block h-20 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[#e9e9ec] sm:h-24 sm:w-[4.75rem]">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt=""
                                    fill
                                    draggable={false}
                                    sizes="80px"
                                    className={`object-contain p-1.5 transition-transform duration-500 group-hover:scale-[1.05] ${
                                      product.isSoldOut ? "opacity-50 saturate-0" : "opacity-100"
                                    }`}
                                  />
                                ) : null}
                              </span>
                              <span className="block min-w-0 truncate text-[13px] font-semibold tracking-tight text-black sm:text-sm">
                                {product.name}
                              </span>
                              <span className="shrink-0 text-[13px] font-semibold tracking-tight text-black sm:text-sm">
                                ₹{product.price.toLocaleString("en-IN")}
                              </span>
                              <ArrowRight className="hidden h-4 w-4 -translate-x-1 text-black opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:block" aria-hidden="true" />
                            </Link>
                          );
                        })}
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
                    aria-label={`Load 12 more products, ${filteredAndSortedProducts.length - visibleCount} remaining`}
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
