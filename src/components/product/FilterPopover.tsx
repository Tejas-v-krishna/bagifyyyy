"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal, X, RotateCcw, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  aliases?: string[];
}

export interface FilterPopoverProps {
  // Colors
  availableColors?: ColorOption[];
  selectedColor?: string;
  onColorChange: (colorId: string) => void;

  // Sizes
  availableSizes?: string[];
  selectedSize?: string;
  onSizeChange: (size: string) => void;

  // Price
  minPrice?: number;
  maxPrice?: number;
  selectedMaxPrice?: number;
  onPriceChange: (price: number) => void;

  // Categories
  availableCategories?: { id: string; label: string }[];
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;

  // State
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  totalFilteredCount?: number;
}

export const DEFAULT_COLOR_SWATCHES: ColorOption[] = [
  {
    id: "black",
    name: "Obsidian Black",
    hex: "#101012",
    aliases: ["black", "acid black", "shadow black", "obsidian black", "matte black", "chrome black", "faded black"],
  },
  {
    id: "charcoal",
    name: "Gunmetal Charcoal",
    hex: "#2d3035",
    aliases: ["charcoal", "mineral charcoal", "gunmetal grey", "gunmetal", "dark grey", "grey"],
  },
  {
    id: "silver",
    name: "Chrome Silver",
    hex: "#cfd3d8",
    aliases: ["silver", "liquid silver", "chrome silver", "metallic", "chrome"],
  },
  {
    id: "blue",
    name: "Washed Indigo",
    hex: "#3d5069",
    aliases: ["blue", "acid tint blue", "washed blue", "vintage indigo", "denim", "indigo"],
  },
  {
    id: "bone",
    name: "Bone / Off-White",
    hex: "#e8e5dc",
    aliases: ["bone", "bone white", "beige", "sand", "cream", "white", "stark white"],
  },
  {
    id: "olive",
    name: "Distressed Olive",
    hex: "#565f4d",
    aliases: ["olive", "faded olive", "green", "army"],
  },
  {
    id: "pink",
    name: "Cyber Pink",
    hex: "#bf587f",
    aliases: ["pink", "cyber pink", "metallic pink"],
  },
];

export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "OS"];

export default function FilterPopover({
  availableColors = DEFAULT_COLOR_SWATCHES,
  selectedColor = "",
  onColorChange,
  availableSizes = DEFAULT_SIZES,
  selectedSize = "",
  onSizeChange,
  minPrice = 0,
  maxPrice = 5000,
  selectedMaxPrice = 5000,
  onPriceChange,
  availableCategories = [],
  selectedCategory = "",
  onCategoryChange,
  isOpen,
  onToggle,
  onClose,
  onReset,
  hasActiveFilters,
  totalFilteredCount,
}: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const selectedColorObj = availableColors.find(
    (c) => c.id.toLowerCase() === selectedColor.toLowerCase()
  );

  const selectedCategoryObj = availableCategories.find(
    (c) => c.id.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="relative inline-block text-left">
      {/* ── Filter Trigger Button ── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Toggle filters"
        className={`group relative inline-flex items-center gap-2 py-1 px-2.5 rounded-lg text-[13px] font-medium tracking-tight text-black hover:bg-black/5 transition-all duration-150 cursor-pointer select-none ${
          isOpen ? "bg-black/5" : ""
        }`}
      >
        <span className="underline underline-offset-4 decoration-black/40 group-hover:decoration-black transition-colors">
          Filter
        </span>
        <SlidersHorizontal className="w-3.5 h-3.5 text-black/70 group-hover:text-black transition-transform duration-200" />

        {/* Active Filter Dot */}
        {hasActiveFilters && (
          <span
            className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-black ml-0.5 animate-pulse"
            title="Active filters applied"
          />
        )}
      </button>

      {/* ── Filter Popover Card matching site background (#f5f5f2) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Filter products"
            className="absolute right-0 top-full mt-2.5 z-50 w-[min(94vw,390px)] sm:w-[410px] rounded-2xl border border-black/15 bg-[#f5f5f2] p-5 sm:p-6 shadow-[0_24px_55px_rgba(0,0,0,0.13)] font-sans text-black"
          >
            {/* Header: Title + Active Count + Reset + Close */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-black">
                  Filters
                </span>
                {totalFilteredCount !== undefined && (
                  <span className="text-[10px] font-mono tracking-wider text-black/50 bg-black/[0.04] px-2 py-0.5 rounded-full border border-black/5">
                    {totalFilteredCount} {totalFilteredCount === 1 ? "PIECE" : "PIECES"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider uppercase text-black/50 hover:text-black transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-black/5"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg text-black/45 hover:text-black hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 text-[13px]">
              {/* ── Section 1: Color ── */}
              {availableColors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] font-semibold tracking-[0.14em] uppercase text-black/50">
                    <span>01 // COLOR</span>
                    <span className="text-black/75 normal-case font-medium text-[11px] tracking-normal">
                      {selectedColorObj ? selectedColorObj.name : "All Tones"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                    {availableColors.map((color) => {
                      const isSelected = selectedColor.toLowerCase() === color.id.toLowerCase();
                      const isLight =
                        color.id === "white" ||
                        color.id === "bone" ||
                        color.hex.toLowerCase() === "#ffffff" ||
                        color.hex.toLowerCase() === "#e8e5dc";

                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => onColorChange(isSelected ? "" : color.id)}
                          title={`${color.name}${isSelected ? " (selected)" : ""}`}
                          aria-label={`Filter by color: ${color.name}`}
                          aria-pressed={isSelected}
                          className={`relative w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full border transition-all duration-150 cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? "ring-2 ring-black ring-offset-2 ring-offset-[#f5f5f2] border-black scale-110 shadow-xs"
                              : "border-black/20 hover:border-black/50 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3 h-3 ${isLight ? "text-black" : "text-white"}`}
                              strokeWidth={2.6}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Section 2: Size ── */}
              {availableSizes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] font-semibold tracking-[0.14em] uppercase text-black/50">
                    <span>02 // SIZE</span>
                    <span className="text-black/75 normal-case font-medium text-[11px] tracking-normal">
                      {selectedSize ? `Size: ${selectedSize}` : "All Sizes"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSize.toLowerCase() === size.toLowerCase();
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => onSizeChange(isSelected ? "" : size)}
                          aria-pressed={isSelected}
                          className={`min-w-[38px] px-2.5 py-1.5 text-[11.5px] tracking-tight rounded-lg border transition-all duration-150 cursor-pointer text-center ${
                            isSelected
                              ? "bg-black text-white border-black font-semibold shadow-xs scale-[1.02]"
                              : "bg-white/70 text-black/80 border-black/12 hover:border-black/35 hover:bg-white hover:text-black font-medium"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Section 3: Shop by price ── */}
              <div className="space-y-2.5 pt-0.5">
                <div className="flex items-center justify-between text-[10.5px] font-semibold tracking-[0.14em] uppercase text-black/50">
                  <span>03 // PRICE LIMIT</span>
                  <span className="font-mono text-black text-[11.5px] font-medium tracking-tight">
                    {selectedMaxPrice < maxPrice
                      ? `Up to ₹${selectedMaxPrice.toLocaleString("en-IN")}`
                      : "All Prices"}
                  </span>
                </div>
                <div className="px-0.5 space-y-1.5">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={250}
                    value={selectedMaxPrice}
                    onChange={(e) => onPriceChange(Number(e.target.value))}
                    aria-label="Filter by maximum price"
                    className="w-full h-1.5 bg-black/15 rounded-full appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex items-center justify-between text-[10.5px] font-mono tracking-wider text-black/45">
                    <span>₹{minPrice}</span>
                    <span>₹{maxPrice.toLocaleString("en-IN")}+</span>
                  </div>
                </div>
              </div>

              {/* ── Section 4: Category ── */}
              {availableCategories.length > 0 && (
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between text-[10.5px] font-semibold tracking-[0.14em] uppercase text-black/50">
                    <span>04 // CATEGORY</span>
                    <span className="text-black/75 normal-case font-medium text-[11px] tracking-normal">
                      {selectedCategoryObj ? selectedCategoryObj.label : "All"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {availableCategories.map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => onCategoryChange(isSelected ? "" : cat.id)}
                          aria-pressed={isSelected}
                          className={`px-3 py-2 text-[11.5px] tracking-tight rounded-lg border transition-all duration-150 cursor-pointer text-left flex items-center justify-between truncate ${
                            isSelected
                              ? "bg-black text-white border-black font-semibold shadow-xs"
                              : "bg-white/70 text-black/80 border-black/12 hover:border-black/35 hover:bg-white hover:text-black font-medium"
                          }`}
                          title={cat.label}
                        >
                          <span className="truncate">{cat.label}</span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-white shrink-0 ml-1.5" strokeWidth={2.4} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer: Apply & Done ── */}
            <div className="pt-5 mt-5 border-t border-black/10 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-black text-white text-[11.5px] font-semibold tracking-[0.08em] uppercase hover:bg-black/90 active:scale-[0.99] transition-all cursor-pointer shadow-xs text-center"
              >
                View {totalFilteredCount !== undefined ? `${totalFilteredCount} Pieces` : "Pieces"}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="py-2.5 px-3 rounded-xl border border-black/15 bg-white/70 hover:bg-white text-black text-[11px] font-semibold tracking-[0.06em] uppercase transition-all cursor-pointer"
                  title="Clear all filters"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

