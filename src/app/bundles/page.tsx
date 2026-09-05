"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check, LoaderCircle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import FilterPopover from "@/components/product/FilterPopover";
import CustomDropdown, { DropdownOption } from "@/components/ui/CustomDropdown";
import EditorialPageShell from "@/components/layout/EditorialPageShell";
import Button from "@/components/ui/Button";

const BUNDLE_SORT_OPTIONS: DropdownOption[] = [
  { value: "Newest", label: "Newest", shortLabel: "Newest" },
  { value: "Price: Low to High", label: "Price: Low → High", shortLabel: "Price: Low → High" },
  { value: "Price: High to Low", label: "Price: High → Low", shortLabel: "Price: High → Low" },
  { value: "Discount", label: "Highest Discount", shortLabel: "Discount" },
];

type BundleProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  defaultVariant: { size: string; color: string } | null;
};

type Bundle = {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  products: BundleProduct[];
  originalTotal: number;
  bundlePrice: number;
};

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Filters state
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(15000);
  const [bundleType, setBundleType] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetch("/api/bundles")
      .then((r) => r.json())
      .then((d) => {
        const loadedBundles = d.bundles ?? [];
        setBundles(loadedBundles);
        if (loadedBundles.length > 0) {
          const max = Math.max(...loadedBundles.map((b: Bundle) => b.bundlePrice));
          setSelectedMaxPrice(Math.max(10000, Math.ceil(max / 1000) * 1000));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxBundlePrice = useMemo(() => {
    if (bundles.length === 0) return 15000;
    const max = Math.max(...bundles.map((b) => b.bundlePrice));
    return Math.max(10000, Math.ceil(max / 1000) * 1000);
  }, [bundles]);

  const filteredBundles = useMemo(() => {
    let result = [...bundles];

    if (selectedMaxPrice < maxBundlePrice) {
      result = result.filter((b) => b.bundlePrice <= selectedMaxPrice);
    }

    if (bundleType === "2-piece") {
      result = result.filter((b) => b.products.length === 2);
    } else if (bundleType === "3-piece") {
      result = result.filter((b) => b.products.length >= 3);
    } else if (bundleType === "high-discount") {
      result = result.filter((b) => b.discount >= 15);
    }

    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => a.bundlePrice - b.bundlePrice);
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => b.bundlePrice - a.bundlePrice);
    } else if (sortBy === "Discount") {
      result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [bundles, selectedMaxPrice, maxBundlePrice, bundleType, sortBy]);

  const resetFilters = () => {
    setSelectedMaxPrice(maxBundlePrice);
    setBundleType("");
  };

  const hasActiveFilters = selectedMaxPrice < maxBundlePrice || Boolean(bundleType);

  const handleAddBundle = (bundle: Bundle) => {
    if (
      addingId ||
      bundle.products.some((p) => p.isSoldOut) ||
      bundle.products.length === 0
    ) return;

    setAddingId(bundle.id);
    const bundleSize = new Set(bundle.products.map((p) => p.id)).size;
    setTimeout(() => {
      bundle.products.forEach((p) => {
        addItem({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          quantity: 1,
          size: p.defaultVariant?.size || "OS",
          color: p.defaultVariant?.color || "Default",
          bundleId: bundle.id,
          bundleName: bundle.name,
          bundleDiscount: bundle.discount,
          bundleSize,
        });
      });
      setAddingId(null);
      setAddedId(bundle.id);
      resetTimerRef.current = setTimeout(() => setAddedId(null), 2500);
    }, 280);
  };

  return (
    <EditorialPageShell
      wide
       eyebrow="Sets / Easy outfit math"
      title="Bundles"
       description="Pieces that work together, with a little money off when you take the set."
      actions={
        <>
          <FilterPopover
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen((prev) => !prev)}
            onClose={() => setIsFilterOpen(false)}
            minPrice={0}
            maxPrice={maxBundlePrice}
            selectedMaxPrice={selectedMaxPrice}
            onPriceChange={setSelectedMaxPrice}
            availableCategories={[
              { id: "2-piece", label: "2-Piece Sets" },
              { id: "3-piece", label: "3+ Piece Sets" },
              { id: "high-discount", label: "15%+ Off" },
            ]}
            selectedCategory={bundleType}
            onCategoryChange={setBundleType}
            availableColors={[]}
            availableSizes={[]}
            selectedColor=""
            onColorChange={() => {}}
            selectedSize=""
            onSizeChange={() => {}}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            totalFilteredCount={filteredBundles.length}
          />

          {/* Custom Sort Dropdown */}
          <CustomDropdown
            value={sortBy}
            onChange={setSortBy}
            options={BUNDLE_SORT_OPTIONS}
            labelPrefix="Sort:"
            ariaLabel="Sort bundles"
          />

          <div className="flex items-baseline gap-1.5 shrink-0 pl-3 border-l border-black/10">
            <span className="font-microgramma text-xl sm:text-2xl font-bold text-black leading-none tracking-tight">
              {loading ? "--" : String(filteredBundles.length).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold tracking-tight text-black/45">
              Sets
            </span>
          </div>
        </>
      }
    >
      <div className="pb-32 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-14">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-fade-up">
                <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#ededed] p-3 sm:rounded-2xl sm:p-4 animate-pulse" />
                <div className="pt-4 space-y-3">
                  <div className="h-4 bg-black/10 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-black/5 rounded w-1/2 animate-pulse" />
                  <div className="h-12 bg-black/10 rounded mt-4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-2xl border border-black/10 px-4">
            <h3 className="text-2xl font-bold tracking-tight text-black mb-2">
               No sets match those filters
            </h3>
            <p className="text-xs tracking-[0.06em] text-black/45 mb-6">
               Clear a filter or try another price range.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn-bagify btn-bagify-dark px-8 py-3 text-[11px] tracking-[0.1em] cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-14">
            {filteredBundles.map((bundle, i) => {
              const isAdded = addedId === bundle.id;
              const isAdding = addingId === bundle.id;
              const isUnavailable =
                bundle.products.some((p) => p.isSoldOut) || bundle.products.length === 0;
              const displayBundlePrice = Math.round(bundle.bundlePrice);
              const displayOriginalTotal = Math.round(bundle.originalTotal);
              const displaySavings = Math.max(0, displayOriginalTotal - displayBundlePrice);

              return (
                <article
                  key={bundle.id}
                  className={`group animate-fade-up delay-${((i % 4) + 1) * 100}`}
                  aria-label={`${bundle.name} bundle — ${bundle.discount}% off`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#ededed] p-3 sm:rounded-2xl sm:p-4">
                    <div
                      className="grid h-full gap-2"
                      style={{ gridTemplateColumns: `repeat(${Math.min(bundle.products.length || 1, 2)}, minmax(0, 1fr))` }}
                    >
                      {(bundle.products.length ? bundle.products : [{ id: "empty", name: bundle.name, image: "/placeholder.jpg", price: 0, isSoldOut: true }])
                        .slice(0, 4)
                        .map((product, productIndex) => {
                          const imageClassName = `relative min-w-0 overflow-hidden rounded-lg bg-[#e4e7e9] ${bundle.products.length === 3 && productIndex === 2 ? "col-span-2" : ""}`;
                          const image = (
                            <Image
                              src={product.image || "/placeholder.jpg"}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 33vw, 16vw"
                              className="object-contain object-center p-2 transition-transform duration-700 group-hover/product:scale-[1.035] sm:p-3"
                            />
                          );

                          return product.id === "empty" ? (
                            <div key={product.id} className={imageClassName}>{image}</div>
                          ) : (
                            <Link
                              key={product.id}
                              href={`/product/${product.id}`}
                              aria-label={`View ${product.name}`}
                              className={`group/product ${imageClassName} focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2`}
                            >
                              {image}
                              <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black px-3 py-2 text-[8.5px] font-semibold tracking-[0.08em] text-white transition-transform duration-300 group-hover/product:translate-y-0 group-focus-visible/product:translate-y-0">
                                View Piece
                              </span>
                            </Link>
                          );
                        })}
                    </div>

                    <span className="absolute right-5 top-5 bg-white/90 px-2.5 py-1 text-[8.5px] font-semibold tracking-[0.08em] text-black" aria-label={`${bundle.discount}% discount`}>
                      −{bundle.discount}%
                    </span>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <h3 className="truncate text-xs sm:text-sm font-microgramma font-bold uppercase leading-none tracking-tight text-black">
                          {bundle.name}
                        </h3>
                        <p className="mt-2 text-[10px] tracking-[0.04em] text-black/45">
                          {bundle.products.length} Piece Set
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium leading-none text-black sm:text-sm">₹{displayBundlePrice.toLocaleString("en-IN")}</p>
                        <p className="mt-1 text-[9px] text-black/35 line-through">₹{displayOriginalTotal.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-black/15 pt-3">
                      <span className="text-[10px] font-medium tracking-[0.04em] text-black/50">
                        Save ₹{displaySavings.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] tracking-[0.04em] text-black/35">−{bundle.discount}%</span>
                    </div>

                    <Button
                      variant="dark"
                      onClick={() => handleAddBundle(bundle)}
                      disabled={isUnavailable || Boolean(addingId)}
                      aria-live="polite"
                      aria-label={
                        isUnavailable
                          ? `${bundle.name} set is unavailable`
                          : isAdding
                            ? `Adding ${bundle.products.length} pieces from ${bundle.name} to bag`
                          : isAdded
                            ? `${bundle.products.length} pieces added to bag`
                            : `Add ${bundle.name} set to bag for ₹${displayBundlePrice.toLocaleString("en-IN")}`
                      }
                      className="mt-4 w-full px-5 py-3 text-[10px] font-bold tracking-[0.12em]"
                    >
                      {isUnavailable ? (
                        <span>Set unavailable</span>
                      ) : isAdding ? (
                        <><LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /><span>Adding set</span></>
                      ) : isAdded ? (
                        <><Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" /><span>{bundle.products.length} pieces added</span></>
                      ) : (
                        <><ShoppingBag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} aria-hidden="true" /><span>Add the set</span></>
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </EditorialPageShell>
  );
}
