"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import Button from "@/components/ui/Button";

export type HomeBundleItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  defaultVariant: { size: string; color: string } | null;
};

export type HomeBundle = {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  products: HomeBundleItem[];
  originalTotal: number;
  bundlePrice: number;
  savings: number;
};

export default function HomeBundlesSection({ bundles }: { bundles: HomeBundle[] }) {
  const { addItem } = useCartStore();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);
  const [addingBundleId, setAddingBundleId] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  if (!bundles || bundles.length === 0) return null;

  const handleAddBundle = (bundle: HomeBundle) => {
    // A set is priced as a whole, so it is added as a whole. Dropping the
    // sold-out pieces and adding the rest used to charge full price for a
    // partial set while the card still advertised the set discount.
    if (
      addingBundleId ||
      bundle.products.some((p) => p.isSoldOut) ||
      bundle.products.length === 0
    ) return;

    setAddingBundleId(bundle.id);
    const bundleSize = new Set(bundle.products.map((p) => p.id)).size;
    window.setTimeout(() => {
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
      setAddingBundleId(null);
      setAddedBundleId(bundle.id);
      resetTimerRef.current = setTimeout(() => setAddedBundleId(null), 2500);
    }, 280);
  };

  return (
    <section
      className="w-full bg-white py-24 md:py-32 border-t border-black/10"
      aria-labelledby="bundles-heading"
    >
      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-16 md:mb-20">
          <div>
            <p className="section-label text-y2k-gunmetal/45 mb-3">Fits that work together</p>
            <h2
              id="bundles-heading"
              className="font-microgramma uppercase text-2xl sm:text-3xl md:text-4xl tracking-tight leading-none text-y2k-gunmetal animate-fade-up"
            >
              The full fit
            </h2>
          </div>
          <Link
            href="/bundles"
            className="h-10 inline-flex items-center gap-2 rounded-[0.35rem] bg-[#111111] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Bundle cards keep every garment visible and all copy below imagery. */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-14">
          {bundles.slice(0, 3).map((bundle, i) => {
            const isAdded = addedBundleId === bundle.id;
            const isAdding = addingBundleId === bundle.id;
            // The set price only applies to a complete set, so one sold-out
            // piece makes the whole set unbuyable.
            const isUnavailable =
              bundle.products.some((p) => p.isSoldOut) || bundle.products.length === 0;

            return (
              <article
                key={bundle.id}
                className={`group animate-fade-up delay-${(i + 1) * 100}`}
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
                      <p className="text-xs font-medium leading-none text-black sm:text-sm">₹{Math.round(bundle.bundlePrice).toLocaleString("en-IN")}</p>
                      <p className="mt-1 text-[9px] text-black/35 line-through">₹{Math.round(bundle.originalTotal).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-black/15 pt-3">
                    <span className="text-[10px] font-medium tracking-[0.04em] text-black/50">
                      Save ₹{Math.round(bundle.savings).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] tracking-[0.04em] text-black/35">−{bundle.discount}%</span>
                  </div>

                  <Button
                    variant="dark"
                    onClick={() => handleAddBundle(bundle)}
                    disabled={isUnavailable || Boolean(addingBundleId)}
                    aria-live="polite"
                    aria-label={
                      isUnavailable
                        ? `${bundle.name} set is unavailable`
                        : isAdding
                          ? `Adding ${bundle.products.length} pieces from ${bundle.name} to bag`
                        : isAdded
                          ? `${bundle.products.length} pieces added to bag`
                          : `Add ${bundle.name} set to bag for ₹${bundle.bundlePrice.toLocaleString("en-IN")}`
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

      </div>
    </section>
  );
}
