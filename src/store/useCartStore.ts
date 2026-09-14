import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeBundleSavings } from '@/lib/bundlePricing';
import { syncCartHolds } from '@/lib/cartHolds';
import { showToast } from '@/lib/toast';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  /**
   * Studio-set original MRP snapshot for this line. Falls back to price when
   * absent (older saved bags) — so a missing MRP never invents a discount.
   * Counted only when it exceeds price.
   */
  mrp?: number | null;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
  cartItemId?: string;
  /**
   * Set this line was added as part of. Carried through to checkout so the
   * server can charge the set price. The three fields below are copies of the
   * set's database values, kept only so the bag can display a total that
   * matches what the server will charge.
   */
  bundleId?: string;
  bundleName?: string;
  bundleDiscount?: number;
  bundleSize?: number;
};

export const VALID_PROMOS: Record<string, number> = { BAGIFY10: 0.1 };

type CartStore = {
  isOpen: boolean;
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string) => { ok: boolean; error?: string };
  clearPromo: () => void;
  /** Sum of every line at its normal price, before set or promo discounts. */
  cartSubtotal: () => number;
  /** Sum of every line at studio MRP (falls back to price). Display only. */
  mrpTotal: () => number;
  /** Rupees off MRP before set/promo discounts. Display only. */
  mrpDiscount: () => number;
  /** Rupees off for complete curated sets in the bag. */
  bundleDiscount: () => number;
  /** What the goods actually cost: subtotal minus set discounts. */
  cartTotal: () => number;
  /** Promo amount off goods total */
  promoAmount: () => number;
  /** Final total after bundle + promo */
  finalTotal: () => number;
};

export const getItemKey = (item: {
  id: string;
  size?: string;
  color?: string;
  cartItemId?: string;
  bundleId?: string;
}) => {
  if (item.cartItemId) return item.cartItemId;
  // A piece bought as part of a set is a different line from the same piece
  // bought on its own, because only one of them carries the set discount.
  const bundlePart = item.bundleId ? `-set:${item.bundleId}` : '';
  return `${item.id}-${item.size || 'OS'}-${item.color || 'default'}${bundlePart}`;
};

/**
 * Push the current bag to the server so its pieces are held for this shopper.
 * First-to-bag wins: a line another session already holds is removed from the
 * bag and surfaced with a notice instead of failing silently at checkout.
 */
export async function syncCartHoldsAndApply(): Promise<void> {
  if (typeof window === 'undefined') return;
  const { items } = useCartStore.getState();
  const results = await syncCartHolds(
    items.map((item) => ({
      id: item.id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    }))
  );

  const blockedIds = new Set(
    results.filter((result) => result.status === 'blocked').map((result) => result.productId)
  );
  if (blockedIds.size === 0) return;

  const current = useCartStore.getState();
  const lost = current.items.filter((item) => blockedIds.has(item.id));
  if (lost.length === 0) return;

  useCartStore.setState({
    items: current.items.filter((item) => !blockedIds.has(item.id)),
  });
  showToast(
    lost.length === 1
      ? `${lost[0].name} was just claimed by another collector`
      : 'Some pieces in your bag were just claimed by other collectors'
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      items: [],
      promoCode: null,
      promoDiscount: 0,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (item) => {
        set((state) => {
          const MAX_QTY = 10;
          const MAX_ITEMS = 50;
          if (state.items.length >= MAX_ITEMS && !state.items.some((i) => getItemKey(i) === getItemKey(item))) {
            return state;
          }
          const safeQty = Math.max(1, Math.min(MAX_QTY, Math.round(item.quantity) || 1));
          const itemKey = getItemKey(item);
          const fullItem: CartItem = { ...item, quantity: safeQty, cartItemId: itemKey };
          const existingIndex = state.items.findIndex(
            (i) => getItemKey(i) === itemKey
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: Math.min(MAX_QTY, updatedItems[existingIndex].quantity + safeQty),
            };
            return { items: updatedItems, isOpen: true };
          }
          return { items: [...state.items, fullItem], isOpen: true };
        });
        void syncCartHoldsAndApply();
      },
      // Both of these match on the full line key only. They used to also accept
      // a bare product id, which meant removing one size silently removed every
      // size of that product.
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => getItemKey(i) !== cartItemId),
        }));
        void syncCartHoldsAndApply();
      },
      updateQuantity: (cartItemId, quantity) => {
        const q = Math.max(1, Math.min(10, Math.round(quantity) || 1));
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i) === cartItemId ? { ...i, quantity: q } : i
          ),
        }));
        void syncCartHoldsAndApply();
      },
      clearCart: () => {
        set({ items: [], promoCode: null, promoDiscount: 0 });
        void syncCartHoldsAndApply();
      },
      applyPromo: (code: string) => {
        const upper = code.trim().toUpperCase();
        const discount = VALID_PROMOS[upper];
        if (!discount) return { ok: false, error: "Invalid promo code." };
        set({ promoCode: upper, promoDiscount: discount });
        return { ok: true };
      },
      clearPromo: () => set({ promoCode: null, promoDiscount: 0 }),
      cartSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      mrpTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.mrp && item.mrp > item.price ? item.mrp : item.price) * item.quantity, 0);
      },
      mrpDiscount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + ((item.mrp && item.mrp > item.price ? item.mrp : item.price) - item.price) * item.quantity, 0);
      },
      bundleDiscount: () => {
        const { items } = get();
        return computeBundleSavings(
          items.map((item) => ({
            productId: item.id,
            price: item.price,
            quantity: item.quantity,
            bundleId: item.bundleId,
            bundleName: item.bundleName,
            bundleDiscount: item.bundleDiscount,
            bundleSize: item.bundleSize,
          }))
        ).total;
      },
      cartTotal: () => {
        const { cartSubtotal, bundleDiscount } = get();
        return Math.max(0, Math.round((cartSubtotal() - bundleDiscount()) * 100) / 100);
      },
      promoAmount: () => {
        const { cartTotal, promoDiscount } = get();
        return Math.round(cartTotal() * promoDiscount * 100) / 100;
      },
      finalTotal: () => {
        const { cartTotal, promoAmount } = get();
        return Math.max(0, Math.round((cartTotal() - promoAmount()) * 100) / 100);
      },
    }),
    {
      name: 'bagify-cart-storage',
      partialize: (state) => ({ items: state.items, promoCode: state.promoCode, promoDiscount: state.promoDiscount }),
    }
  )
);
