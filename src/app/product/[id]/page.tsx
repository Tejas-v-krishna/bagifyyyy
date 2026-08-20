"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import RecentlyViewed from "@/components/ui/RecentlyViewed";
import NotifyMeSection from "@/components/product/NotifyMeSection";
import SimilarProducts from "@/components/product/SimilarProducts";
import ReviewSection from "@/components/product/ReviewSection";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import { Heart, Ruler, Sparkles, ShoppingBag, ShieldCheck, Truck, ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { addItem, items } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

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
      image: product.images?.[activeImageIndex]?.url || product.images?.[0]?.url || product.images?.[0] || product.image || "/placeholder.jpg",
      quantity: 1,
      size: selectedSize || (product.sizes?.[0] ?? "One Size"),
      color: selectedColor || (product.colors?.[0] ?? "Default"),
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleWishlistClick = () => {
    if (id) toggleItem(id);
  };

  const totalBagValue = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center bg-y2k-ice text-[9.5px] uppercase tracking-[0.22em] text-y2k-gunmetal/40 font-sans">
        Loading product details…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-y2k-ice font-sans px-4 text-center">
        <div className="w-px h-16 bg-y2k-gunmetal/15 mb-12" />
        <h1 className="font-display text-4xl uppercase tracking-[-0.04em] mb-3 text-y2k-gunmetal">
          PRODUCT NOT FOUND
        </h1>
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/50 mb-10">
          This product is currently unavailable.
        </p>
        <Link
          href="/products"
          className="btn-bagify px-10 py-4 text-[10px] uppercase tracking-[0.18em]"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  const collectionTag = product.brand || "BAGIFYYYY";
  const productImages = product.images || [];

  return (
    <div className="w-full bg-white text-y2k-gunmetal min-h-screen pt-12 pb-32 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Breadcrumb */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/40">
            <Link href="/" className="hover:text-y2k-gunmetal transition-colors">HOME</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-y2k-gunmetal transition-colors">DROPS</Link>
            <span>/</span>
            <Link href={`/${product.category?.toLowerCase() || "products"}`} className="hover:text-y2k-gunmetal transition-colors">
              {product.category || "COLLECTION"}
            </Link>
            <span>/</span>
            <span className="text-y2k-gunmetal/70 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.8fr_1.1fr] gap-10 lg:gap-14 xl:gap-20">
          
          {/* Left Column: Garment Details & Sizing */}
          <div className="flex flex-col order-2 lg:order-1 pt-0 lg:pt-10">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="section-label text-y2k-slate">
                {collectionTag}
              </span>
              <span className="text-[8.5px] font-mono text-y2k-gunmetal/30">· {product.id.substring(0, 8).toUpperCase()}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-[1.06] tracking-[-0.04em] text-y2k-gunmetal mb-5">
              {product.name}
            </h1>

            <p className="text-[12.5px] text-y2k-gunmetal/65 leading-loose mb-8">
              {product.description ||
                "A signature piece crafted with heavyweight construction and tailored modern streetwear silhouette."}
            </p>

            {/* Scarcity Indicator */}
            <div className="flex items-center gap-2.5 py-3 px-4 bg-y2k-ice border border-y2k-gunmetal/[0.1] text-[9px] uppercase tracking-[0.2em] text-y2k-gunmetal/70 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-y2k-gunmetal animate-pulse shrink-0" />
              <span>LIMITED QUANTITY · 100% AUTHENTIC QUALITY</span>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label text-y2k-gunmetal/60">
                    SELECT SIZE
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.16em] text-y2k-gunmetal/50 hover:text-y2k-gunmetal transition-colors cursor-pointer"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`text-[10.5px] uppercase tracking-wider px-4 py-2.5 border transition-all cursor-pointer ${
                        selectedSize === s
                          ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                          : "border-y2k-gunmetal/[0.15] text-y2k-gunmetal hover:border-y2k-gunmetal/50 bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <span className="section-label text-y2k-gunmetal/60 block mb-3">
                  FINISH / COLOR
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`text-[10.5px] uppercase tracking-wider px-4 py-2.5 border transition-all cursor-pointer ${
                        selectedColor === c
                          ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                          : "border-y2k-gunmetal/[0.15] text-y2k-gunmetal hover:border-y2k-gunmetal/50 bg-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Material & Provenance Notes */}
            <div className="text-[10.5px] text-y2k-gunmetal/55 space-y-3 pt-6 border-t border-y2k-gunmetal/[0.07]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal/50" strokeWidth={1.5} />
                <span>100% Verified Heavyweight Quality Standard</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-3.5 h-3.5 text-y2k-gunmetal/50" strokeWidth={1.5} />
                <span>Complimentary Shipping Over ₹2000</span>
              </div>
            </div>
          </div>

          {/* Center Column: Image & Gallery */}
          <div className="flex flex-col items-center order-1 lg:order-2">
            <div className="w-full aspect-[3/4] md:aspect-[4/5] relative bg-[#F8F8F8] border border-y2k-gunmetal/[0.07] overflow-hidden group">
              {productImages.length > 0 ? (
                <>
                  <Image
                    src={
                      productImages[activeImageIndex]?.url ||
                      productImages[activeImageIndex] ||
                      productImages[0]?.url ||
                      productImages[0]
                    }
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    className="object-contain object-center transition-all duration-300"
                  />

                  {/* Arrow Controls */}
                  {productImages.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                        }}
                        className="w-8 h-8 rounded-full bg-white/85 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                        title="Previous Photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                        }}
                        className="w-8 h-8 rounded-full bg-white/85 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                        title="Next Photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9.5px] uppercase tracking-[0.2em] text-y2k-gunmetal/30">
                  No Image Available
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2.5 mt-5 flex-wrap justify-center">
                {productImages.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1.5 border transition-all cursor-pointer font-mono text-[10px] ${
                      activeImageIndex === idx
                        ? "bg-y2k-gunmetal text-white border-y2k-gunmetal"
                        : "bg-white text-y2k-gunmetal/50 border-y2k-gunmetal/[0.12] hover:border-y2k-gunmetal/40"
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Price & Add to Bag */}
          <div className="flex flex-col order-3 lg:order-3 pt-0 lg:pt-10">
            <h2 className="font-display text-4xl sm:text-5xl tracking-[-0.04em] text-y2k-gunmetal mb-8 lg:text-right">
              ₹{product.price.toLocaleString("en-IN")}
            </h2>

            {product.isSoldOut ? (
              <NotifyMeSection productId={product.id} />
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="btn-bagify w-full py-5 px-5 text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] flex items-center justify-between cursor-pointer"
                >
                  <span>{addedAnimation ? "✓ ADDED TO BAG" : `ADD TO BAG${selectedSize ? ` (${selectedSize})` : ""}`}</span>
                  <span className="text-[9px] text-white/55">
                    BAG: ₹{totalBagValue.toLocaleString("en-IN")}
                  </span>
                </button>

                <button
                  onClick={handleWishlistClick}
                  className="w-full py-4 border border-y2k-gunmetal/[0.12] text-y2k-gunmetal hover:border-y2k-gunmetal/40 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.16em] transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      wishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : ""
                    }`}
                    strokeWidth={1.5}
                  />
                  <span>{wishlisted ? "SAVED IN WISHLIST" : "SAVE TO WISHLIST"}</span>
                </button>
              </div>
            )}

            {/* Quick Policy Notice */}
            <div className="mt-10 pt-6 border-t border-y2k-gunmetal/[0.07] space-y-3">
              <p className="section-label text-y2k-gunmetal/70">7-DAY RETURNS &amp; VERIFIED QUALITY</p>
              <p className="text-[11px] text-y2k-gunmetal/50 leading-loose">
                Every piece is inspected for fabric density, hardware integrity, and provenance.
              </p>
            </div>
          </div>

        </div>

        {/* Similar Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <SimilarProducts products={product.relatedProducts} />
        )}

        {/* Reviews */}
        <ReviewSection productId={id} />

        {/* Recently Viewed */}
        <div className="mt-20 pt-10 border-t border-y2k-gunmetal/[0.07]">
          <RecentlyViewed productId={id} />
        </div>

      </div>

      {/* ── Size Guide Modal ────────────────────────────────────────────── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />

      {/* ── Mobile Sticky Buy Bar ───────────────────────────────────────── */}
      {!product.isSoldOut && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-y2k-gunmetal/[0.1] p-4 flex lg:hidden items-center justify-between shadow-xl">
          <div className="min-w-0 pr-4">
            <p className="text-[10.5px] uppercase tracking-[0.12em] truncate text-y2k-gunmetal">{product.name}</p>
            <p className="font-display text-lg tracking-tight text-y2k-gunmetal">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="btn-bagify px-6 py-3.5 text-[10px] uppercase tracking-[0.18em] shrink-0 cursor-pointer"
          >
            {addedAnimation ? "✓ ADDED" : "ADD TO BAG"}
          </button>
        </div>
      )}
    </div>
  );
}
