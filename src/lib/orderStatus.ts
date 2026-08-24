/**
 * The order status vocabulary, and the one place that decides whether a row in
 * the Order table is a real order yet.
 *
 * A Razorpay order has to exist in our database before the payment sheet can
 * open, because the receipt Razorpay hands back only carries our order id. That
 * row used to be written as PROCESSING, so a shopper who opened the payment
 * sheet and closed it left behind something indistinguishable from a paid
 * order: it showed up in their account, drew a fulfilment timeline on the
 * tracking page, sat in the studio's queue waiting to be shipped, and counted
 * towards the studio's revenue figure.
 */

/** A checkout was started, the money has not arrived. Razorpay orders only. */
export const AWAITING_PAYMENT = "AWAITING_PAYMENT";

/** The statuses a fulfilment operator sets by hand, in lifecycle order. */
export const FULFILMENT_STATUSES = [
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

/** Every value that may legally be stored on Order.orderStatus. */
export const ORDER_STATUSES = [AWAITING_PAYMENT, ...FULFILMENT_STATUSES] as const;

const LABELS: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PROCESSING: "Processing at hub",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** A human label, falling back to the raw value rather than inventing one. */
export function orderStatusLabel(status?: string | null): string {
  if (!status) return "Unknown";
  return LABELS[status] ?? status.replace(/_/g, " ");
}

type OrderState = {
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
};

/** True while a checkout was started but the payment never came through. */
export function isAwaitingPayment(order: Pick<OrderState, "orderStatus" | "paymentStatus">): boolean {
  return order.orderStatus === AWAITING_PAYMENT && order.paymentStatus !== "PAID";
}

/**
 * Whether an order belongs in the revenue figure. Card orders count once the
 * money is captured; cash on delivery counts as a commitment until cancelled.
 * The old test was `paid || not cancelled`, which counted every abandoned
 * payment sheet as a sale.
 */
export function countsAsRevenue(order: OrderState): boolean {
  if (order.paymentStatus === "PAID") return true;
  return order.paymentMethod === "COD" && order.orderStatus !== "CANCELLED";
}
