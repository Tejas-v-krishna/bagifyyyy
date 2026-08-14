import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
  cartItemId?: string;
};

type CartStore = {
  isOpen: boolean;
  items: CartItem[];
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
};

export const getItemKey = (item: { id: string; size?: string; color?: string; cartItemId?: string }) => {
  return item.cartItemId || `${item.id}-${item.size || 'OS'}-${item.color || 'default'}`;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      items: [],
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (item) =>
        set((state) => {
          const itemKey = getItemKey(item);
          const fullItem: CartItem = { ...item, cartItemId: itemKey };
          const existingIndex = state.items.findIndex(
            (i) => getItemKey(i) === itemKey
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + item.quantity,
            };
            return { items: updatedItems, isOpen: true };
          }
          return { items: [...state.items, fullItem], isOpen: true };
        }),
      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => getItemKey(i) !== cartItemId && i.id !== cartItemId),
        })),
      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i) === cartItemId || i.id === cartItemId
              ? { ...i, quantity }
              : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      cartTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'bagify-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
