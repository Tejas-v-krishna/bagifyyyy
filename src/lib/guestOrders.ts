export type SavedOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
};

export type SavedOrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  trackingId: string | null;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: {
    fullName: string;
    street?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  } | null;
  items: SavedOrderItem[];
};

const GUEST_ORDERS_STORAGE_KEY = "bagify_guest_orders";
const MAX_SAVED_GUEST_ORDERS = 25;

export function getGuestOrders(): SavedOrderSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error("Failed to read guest orders from localStorage:", err);
    return [];
  }
}

export function saveGuestOrder(order: SavedOrderSummary): void {
  if (typeof window === "undefined" || !order || !order.id) return;
  try {
    const existing = getGuestOrders();
    // Deduplicate by ID or orderNumber
    const filtered = existing.filter(
      (o) => o.id !== order.id && o.orderNumber !== order.orderNumber
    );
    // Put newest at the front
    const updated = [order, ...filtered].slice(0, MAX_SAVED_GUEST_ORDERS);
    window.localStorage.setItem(GUEST_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save guest order to localStorage:", err);
  }
}

export function removeGuestOrder(orderIdOrNumber: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getGuestOrders();
    const updated = existing.filter(
      (o) => o.id !== orderIdOrNumber && o.orderNumber !== orderIdOrNumber
    );
    window.localStorage.setItem(GUEST_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to remove guest order from localStorage:", err);
  }
}

export function clearGuestOrders(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_ORDERS_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear guest orders:", err);
  }
}
