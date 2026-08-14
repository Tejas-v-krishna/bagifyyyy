import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WishlistStore = {
  items: string[];
  toggleItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (id: string) =>
        set((state) => {
          const exists = state.items.includes(id);
          if (exists) {
            return { items: state.items.filter((itemId) => itemId !== id) };
          } else {
            return { items: [...state.items, id] };
          }
        }),
      isInWishlist: (id: string) => get().items.includes(id),
    }),
    {
      name: 'bagify-wishlist-storage',
    }
  )
);
