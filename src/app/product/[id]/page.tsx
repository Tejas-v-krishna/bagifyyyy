"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import NotifyMeSection from "@/components/product/NotifyMeSection";
import SimilarProducts from "@/components/product/SimilarProducts";
import { Heart } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { addItem, items } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const wishlisted = id ? isInWishlist(id) : false;

  useEffect(() => {
    if (id) {
      fetch(`/api/products/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setProduct(data);
            if (data.sizes && data.sizes.length > 0) {
              setSelectedSize(data.sizes[0]);
            }
            if (data.colors && data.colors.length > 0) {
              setSelectedColor(data.colors[0]);
            }
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching product:", err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image || "/placeholder.jpg",
      quantity: 1,
      size: selectedSize || (product.sizes?.[0] ?? "One Size"),
      color: selectedColor || (product.colors?.[0] ?? "Default"),
    });
  };

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    toggleItem(id);
  };

  const totalBagValue = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
        Loading archive piece...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="font-display text-4xl uppercase mb-4 text-y2k-gunmetal">
          Product Not Found
        </h1>
        <Link
          href="/products"
          className="text-xs font-bold uppercase tracking-wider text-y2k-slate hover:text-black"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const collectionTag = product.brand || "BAGIFYYYY AW24";

  return (
    <div className="w-full bg-white text-black min-h-screen pt-12 pb-24 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumbs */}
        <div className="mb-10">
          <nav className="flex text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Link href="/products" className="hover:text-black transition-colors">
              MENS
            </Link>
            <span className="mx-2 text-gray-300">&gt;</span>
            <Link href="/products" className="hover:text-black transition-colors">
              {product.category || "ARCHIVE"}
            </Link>
            <span className="mx-2 text-gray-300">&gt;</span>
            <span className="text-black font-bold">BAGIFYYYY</span>
          </nav>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-12 lg:gap-8 xl:gap-16">
          {/* Left Column: Info */}
          <div className="flex flex-col order-2 lg:order-1 pt-0 lg:pt-16">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-4">
              {collectionTag} | ART: {product.id.substring(0, 8).toUpperCase()}
            </p>
            <h1 className="font-sans font-medium text-4xl lg:text-5xl leading-[1.1] tracking-tight text-black mb-6">
              {product.name}
            </h1>

            <p className="text-sm text-black/80 leading-relaxed font-normal mb-8">
              {product.description ||
                "A signature archival piece crafted with heavyweight construction and tailored modern silhouette."}
            </p>

            {/* Size Selector if available */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`text-xs font-bold uppercase tracking-wider px-4 py-2 border transition-all ${
                        selectedSize === s
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-black hover:border-black"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector if available */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Color / Finish
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`text-xs font-bold uppercase tracking-wider px-4 py-2 border transition-all ${
                        selectedColor === c
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-black hover:border-black"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs font-normal text-gray-600 space-y-1 mt-4">
              <p>100% heavyweight premium cotton.</p>
              <p>Crafted in India.</p>
            </div>
          </div>

          {/* Center Column: Image & Pagination */}
          <div className="flex flex-col items-center order-1 lg:order-2">
            <div className="w-full aspect-[3/4] md:aspect-[4/5] relative bg-white">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain object-top mix-blend-multiply"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs uppercase tracking-wider">
                  No Image
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-4 md:gap-8 mt-12 text-xs font-bold uppercase tracking-wider text-gray-400">
                {product.images.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`${
                      activeImageIndex === idx
                        ? "text-black bg-gray-100 px-3 py-1.5 border border-gray-200"
                        : "hover:text-black px-3 py-1.5"
                    } transition-all`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="flex flex-col order-3 lg:order-3 pt-0 lg:pt-16">
            <h2 className="text-4xl lg:text-[42px] font-medium tracking-tight text-black mb-12 lg:text-right">
              ₹
              {product.price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </h2>

            {product.isSoldOut ? (
              <NotifyMeSection productId={product.id} />
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full bg-black text-white rounded-none flex items-center justify-between px-5 py-4 hover:opacity-90 transition-opacity mb-4"
              >
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  ADD TO BAG {selectedSize ? `(${selectedSize})` : ""}
                </span>
                <span className="text-xs uppercase tracking-wider text-gray-300">
                  BAG: ₹{totalBagValue.toLocaleString("en-IN")}
                </span>
              </button>
            )}

            <div className="w-full text-center mt-4">
              <button
                onClick={handleWishlistClick}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    wishlisted ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {wishlisted ? "WISHLISTED" : "ADD TO WISHLIST"}
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <SimilarProducts products={product.relatedProducts} />
        )}

        {/* Recently Viewed */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <RecentlyViewed productId={id} />
        </div>
      </div>
    </div>
  );
}
