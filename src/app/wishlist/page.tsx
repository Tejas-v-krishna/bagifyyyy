"use client";

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import ProductCard, { Product } from "@/components/product/ProductCard";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { items } = useWishlistStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all products and filter locally for now
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        const wishlisted = data.filter((p) => items.includes(p.id));
        
        // Inject frontend mocks so the demo still works for the homepage items
        const mockProducts = items
          .filter((id) => id.startsWith("drop-") || id.startsWith("prod-"))
          .map((id) => ({
            id,
            name: id.startsWith("drop-") ? `BAGIFYYYY 'DROP ${id.split('-')[1]}'` : `BAGIFYYYY EXCLUSIVE`,
            price: 15000,
            image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1000&auto=format&fit=crop",
            category: "mock",
          }));

        setProducts([...wishlisted, ...mockProducts]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load wishlist products:", err);
        setLoading(false);
      });
  }, [items]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 min-h-[calc(100vh-72px)]">
      <div className="flex flex-col items-center mb-16">
        <h1 className="font-display text-[40px] md:text-[56px] font-bold uppercase tracking-tight text-heading-gradient text-center mb-4">
          YOUR WISHLIST
        </h1>
        <p className="text-sm md:text-base text-y2k-slate font-medium text-center max-w-lg">
          The pieces you've been eyeing. Ready when you are.
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="w-full flex flex-col items-center justify-center py-20 border border-y2k-soft bg-y2k-ice">
          <Heart strokeWidth={1} className="w-16 h-16 text-y2k-slate mb-6 opacity-50" />
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-tight text-y2k-gunmetal mb-2 text-center">
            SIGN IN TO VIEW YOUR WISHLIST
          </h2>
          <button
            onClick={openAuthModal}
            className="btn-bagify px-8 py-4 rounded-none shadow-xl hover:-translate-y-1 transition-transform mt-4"
          >
            <span className="text-bagify font-bold uppercase text-sm tracking-widest">
              SIGN IN
            </span>
          </button>
        </div>
      ) : loading ? (
        <div className="w-full flex justify-center py-20 text-y2k-slate uppercase tracking-widest font-bold">
          LOADING WISHLIST...
        </div>
      ) : products.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-20 border border-y2k-soft bg-y2k-ice">
          <Heart strokeWidth={1} className="w-16 h-16 text-y2k-slate mb-6 opacity-50" />
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-tight text-y2k-gunmetal mb-2">
            NOTHING HERE YET
          </h2>
          <p className="text-sm text-y2k-slate mb-8">
            You haven't added any items to your wishlist.
          </p>
          <Link
            href="/products"
            className="btn-bagify px-8 py-4 rounded-none shadow-xl hover:-translate-y-1 transition-transform"
          >
            <span className="text-bagify font-bold uppercase text-sm tracking-widest">
              DISCOVER PIECES
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
