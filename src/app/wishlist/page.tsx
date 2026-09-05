"use client";

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import ProductCard, { Product } from "@/components/product/ProductCard";
import Link from "next/link";
import { Heart } from "lucide-react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export default function WishlistPage() {
  const { items } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    // Fetch only wishlisted IDs
    const ids = items.filter((id) => !id.startsWith("drop-") && !id.startsWith("prod-"));
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load wishlist products:", err);
        setLoading(false);
      });
  }, [items]);

  return (
    <EditorialPageShell
      eyebrow="Saved pieces"
      title="Wishlist"
      description="Keep an eye on pieces you like. Stock can change, especially on one-off items."
      wide
    >
      <div className="w-full">
        {!isAuthenticated && (
          <div className="mb-8 p-4 sm:p-5 bg-white border border-black/10 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black">
                Wishlist saved here
              </p>
              <p className="text-xs text-black/55 mt-0.5">
                These saves live in this browser. Sign in to see them on your other devices.
              </p>
            </div>
            <Link
              href="/login?from=/wishlist"
              className="btn-bagify btn-bagify-dark px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] shrink-0 cursor-pointer"
            >
              Sign In to Sync
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-xl bg-black/[0.04] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-24 sm:py-32 rounded-2xl bg-white border border-black/10 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-[#f2f2f2] flex items-center justify-center mb-5">
              <Heart strokeWidth={1.4} className="w-6 h-6 text-black/40" />
            </div>
            <h2 className="font-microgramma text-lg sm:text-xl font-bold uppercase tracking-tight text-black mb-2">
              YOUR WISHLIST IS EMPTY
            </h2>
            <p className="text-xs text-black/50 max-w-sm mb-8 leading-relaxed">
              Nothing saved yet. Start with the latest pieces.
            </p>
            <Link
              href="/products"
              className="btn-bagify btn-bagify-dark px-8 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.18em]"
            >
              Shop New Pieces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </EditorialPageShell>
  );
}
