"use client";

import { useState } from "react";
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
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  if (product.isSoldOut) {
    return null;
  }

  const handleAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      className={`group/bagbtn flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
        added
          ? "bg-[#232D3B] text-white"
          : "bg-white/90 hover:bg-white text-y2k-gunmetal hover:text-black shadow-sm"
      } ${className}`}
    >
      {added ? (
        <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-50 duration-200" strokeWidth={2.5} />
      ) : (
        <ShoppingBag className="w-3.5 h-3.5 transition-transform duration-300 group-hover/bagbtn:scale-110" strokeWidth={1.75} />
      )}
    </button>
  );
}
