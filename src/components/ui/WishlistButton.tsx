"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";

import { useRouter } from "next/navigation";

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
      className={`absolute top-4 right-4 bg-white/90 p-2 rounded-full z-20 hover:bg-white transition-all shadow-sm cursor-pointer ${
        wishlisted ? "text-red-500 hover:text-red-600" : "text-y2k-slate hover:text-y2k-gunmetal"
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
