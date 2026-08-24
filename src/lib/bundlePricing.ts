/**
 * Bundle ("curated set") discount maths, shared by the server and the browser.
 *
 * The storefront advertises a set price like "₹5,099 instead of ₹5,999, save
 * ₹900". Until now that discount existed only in the marketing copy: adding a
 * set dropped its products into the bag at full price and every downstream
 * total charged the full amount. This module is the single definition of what a
 * set is worth, so the price on the card, the price in the bag and the price
 * Razorpay charges are all produced by the same function.
 *
 * A set discount applies only to a *complete* set. Two of every piece earns the
 * discount twice; a set missing a piece earns nothing, and the leftover pieces
 * are simply charged at their normal price.
 *
 * The server passes values read from the database. The browser passes the copy
 * of those values stored alongside the cart line, purely so the bag can show a
 * total that matches. Nothing here is trusted for the actual charge — see
 * priceCart() in src/lib/cart.ts, which re-derives every input from the
 * database before calling this.
 */

export type BundleLine = {
  productId: string;
  price: number;
  quantity: number;
  bundleId?: string | null;
  /** Percentage off the set, e.g. 15 for 15% off. */
  bundleDiscount?: number | null;
  /** How many distinct products make up a complete set. */
  bundleSize?: number | null;
  bundleName?: string | null;
};

export type BundleSaving = {
  bundleId: string;
  name: string;
  /** Percentage off, as stored on the set. */
  discount: number;
  /** How many complete sets the bag qualifies for. */
  sets: number;
  /** Rupees taken off for this set. */
  amount: number;
};

export type BundleSavingsResult = {
  /** Total rupees taken off across every qualifying set. */
  total: number;
  savings: BundleSaving[];
  /** Sets present in the bag that are missing at least one piece. */
  incompleteBundleIds: string[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Percentages outside 0–90 are treated as no discount rather than trusted. */
function normalizeDiscount(value: unknown): number {
  const pct = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return Math.min(pct, 90);
}

/**
 * Work out what the curated sets in a bag are worth.
 *
 * Lines without a `bundleId` are ignored entirely, so this is safe to call with
 * a whole cart.
 */
export function computeBundleSavings(lines: BundleLine[]): BundleSavingsResult {
  const groups = new Map<
    string,
    { name: string; discount: number; size: number; quantities: Map<string, number>; unitPrices: Map<string, number> }
  >();

  for (const line of lines) {
    if (!line.bundleId) continue;

    const discount = normalizeDiscount(line.bundleDiscount);
    const size = Number(line.bundleSize);
    if (discount === 0 || !Number.isInteger(size) || size < 1) continue;

    let group = groups.get(line.bundleId);
    if (!group) {
      group = {
        name: line.bundleName || 'Curated set',
        discount,
        size,
        quantities: new Map(),
        unitPrices: new Map(),
      };
      groups.set(line.bundleId, group);
    }

    group.quantities.set(line.productId, (group.quantities.get(line.productId) ?? 0) + line.quantity);
    group.unitPrices.set(line.productId, line.price);
  }

  const savings: BundleSaving[] = [];
  const incompleteBundleIds: string[] = [];
  let total = 0;

  for (const [bundleId, group] of groups) {
    // A complete set needs one of every distinct product in it. Anything less
    // and the pieces are just normal products at normal prices.
    if (group.quantities.size < group.size) {
      incompleteBundleIds.push(bundleId);
      continue;
    }

    const sets = Math.min(...group.quantities.values());
    if (sets < 1) {
      incompleteBundleIds.push(bundleId);
      continue;
    }

    let oneSetTotal = 0;
    for (const [productId, unitPrice] of group.unitPrices) {
      if (group.quantities.has(productId)) oneSetTotal += unitPrice;
    }

    const amount = roundMoney(oneSetTotal * sets * (group.discount / 100));
    if (amount <= 0) continue;

    total += amount;
    savings.push({ bundleId, name: group.name, discount: group.discount, sets, amount });
  }

  return { total: roundMoney(total), savings, incompleteBundleIds };
}
