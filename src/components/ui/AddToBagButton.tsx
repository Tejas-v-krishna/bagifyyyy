"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

interface AddToBagButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
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

  if (product.isSoldOut) {
    return null;
  }

  const handleAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product requires size/color selection, go to product page instead of guessing
    const hasUnknownOptions = !Array.isArray(product.sizes) || !Array.isArray(product.colors);
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 1;
    const hasColors = Array.isArray(product.colors) && product.colors.length > 1;
    if (hasUnknownOptions || hasSizes || hasColors) {
      router.push(`/product/${product.id}`);
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      size: product.sizes?.[0] || "OS",
      color: product.colors?.[0] || "Default",
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  return (
    <button
      type="button"
      onClick={handleAddToBag}
      aria-label={`Add ${product.name} to bag`}
      title="Add to bag"
      className={`group/bagbtn flex items-center justify-center min-h-11 min-w-11 border-0 bg-transparent text-black shadow-none outline-none transition-opacity duration-300 hover:opacity-55 active:scale-90 cursor-pointer focus-visible:outline-black focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      {added ? (
        <Check className="h-4 w-4 animate-in zoom-in-50 text-black duration-200" strokeWidth={2.5} />
      ) : (
        <ShoppingBag className="h-4 w-4 text-black transition-transform duration-300 group-hover/bagbtn:scale-110" strokeWidth={1.8} />
      )}
    </button>
  );
}
