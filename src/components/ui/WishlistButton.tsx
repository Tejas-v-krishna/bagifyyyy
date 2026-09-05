"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";

type Props = {
  productId: string;
  className?: string;
};

export default function WishlistButton({ productId, className = "" }: Props) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const wishlisted = isInWishlist(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(productId);
      }}
      className={`absolute top-4 right-4 z-20 rounded-full border border-black/10 bg-white/90 p-2 transition-all cursor-pointer hover:bg-white ${
        wishlisted ? "text-black" : "text-black/45 hover:text-black"
      } ${className}`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        strokeWidth={1.5}
        className={`w-4 h-4 transition-transform active:scale-125 ${wishlisted ? "fill-current" : ""}`}
      />
    </button>
  );
}
