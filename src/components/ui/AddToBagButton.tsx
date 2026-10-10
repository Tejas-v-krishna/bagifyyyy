"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check, X, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { triggerPinataBurst } from "@/lib/confetti";

interface AddToBagButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    image: string;
    isSoldOut?: boolean;
    sizes?: string[];
    colors?: string[];
  };
  className?: string;
}

export default function AddToBagButton({ product, className = "" }: AddToBagButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickSize, setPickSize] = useState<string | null>(null);
  const [pickColor, setPickColor] = useState<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  // Cancel the "added ✓" reset if the card unmounts (grid re-render, route
  // change) so it never setStates after teardown.
  useEffect(() => {
    return () => {
      if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!picking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPicking(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picking]);

  if (product.isSoldOut) {
    return null;
  }

  const sizes = Array.isArray(product.sizes) ? product.sizes : null;
  const colors = Array.isArray(product.colors) ? product.colors : null;
  const needsPick = (sizes !== null && sizes.length > 1) || (colors !== null && colors.length > 1);

  const doAdd = (size: string, color: string, e?: React.MouseEvent) => {
    triggerPinataBurst(e);

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.compareAtPrice ?? null,
      image: product.image,
      quantity: 1,
      size,
      color,
    });

    setAdded(true);
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => {
      addedTimerRef.current = null;
      setAdded(false);
    }, 1200);
  };

  const handleAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Options unknown (data not passed) — can't pick, go choose on the page.
    if (sizes === null && colors === null) {
      router.push(`/product/${product.id}`);
      return;
    }

    // Single option each — add straight to the bag, no guessing involved.
    if (!needsPick) {
      doAdd(sizes?.[0] || "OS", colors?.[0] || "Default", e);
      return;
    }

    // Multiple options — let the shopper pick size (required) and colour.
    setPickSize(sizes !== null && sizes.length > 1 ? null : (sizes?.[0] ?? null));
    setPickColor(colors?.[0] ?? null);
    setPicking(true);
  };

  const showSizeRow = sizes !== null && sizes.length > 1;
  const showColorRow = colors !== null && colors.length > 1;
  const canConfirm = pickSize !== null;

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canConfirm) return;
    doAdd(pickSize, pickColor ?? colors?.[0] ?? "Default", e);
    setPicking(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAddToBag}
        aria-label={`Add ${product.name} to bag`}
        title="Add to bag"
        className={`group/bagbtn relative flex items-center justify-center min-h-11 min-w-11 border-0 bg-transparent text-black shadow-none outline-none transition-all duration-300 hover:opacity-70 active:scale-85 cursor-pointer focus-visible:outline-black focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      >
        <span
          className={`flex items-center justify-center transition-transform duration-300 ${
            added ? "scale-110 text-emerald-600" : "group-hover/bagbtn:scale-115 text-black"
          }`}
        >
          {added ? (
            <span className="relative flex items-center justify-center">
              <span className="absolute -inset-1.5 rounded-full bg-emerald-500/15 animate-ping" />
              <Check className="h-4 w-4 animate-in zoom-in-75 duration-200 stroke-[2.5]" />
            </span>
          ) : (
            <ShoppingBag className="h-4 w-4 transition-transform duration-200" />
          )}
        </span>
      </button>

      {picking &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label={`Select options for ${product.name}`}
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              onClick={() => setPicking(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-sm rounded-[15px] border border-black/10 bg-white p-6 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
              <div className="mb-1 flex items-start justify-between gap-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                  Select options
                </p>
                <button
                  type="button"
                  onClick={() => setPicking(false)}
                  aria-label="Close size picker"
                  className="flex h-8 w-8 -mr-2 -mt-2 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <h3 className="truncate text-sm font-bold tracking-tight text-black" title={product.name}>
                {product.name}
              </h3>

              {showSizeRow && (
                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/60">
                    Size <span className="text-black">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sizes!.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPickSize(size)}
                        aria-pressed={pickSize === size}
                        className={`min-h-11 min-w-11 cursor-pointer border px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                          pickSize === size
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white text-black hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showColorRow && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/60">
                    Colour
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colors!.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPickColor(color)}
                        aria-pressed={pickColor === color}
                        className={`min-h-11 cursor-pointer border px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                          pickColor === color
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white text-black hover:border-black"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="btn-bagify btn-bagify-dark mt-6 w-full text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <span>Add to bag</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
