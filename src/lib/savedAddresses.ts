/**
 * Saved checkout addresses. The account page owns the CRUD (/api/account/
 * addresses); the checkout only needs this small read-only shape plus a way
 * to collapse the duplicates past orders used to create (an order snapshot
 * row is written per order, so the same street can appear many times).
 */

export type SavedCheckoutAddress = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  /** "house" | "office" | "other" — the segmented picker on checkout. */
  label?: string | null;
  /** Google-formatted area text picked in the checkout Area picker. */
  area?: string | null;
};

export const ADDRESS_LABELS = ['house', 'office', 'other'] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

/** Accepts only the three known labels, case-insensitively. */
export function normalizeAddressLabel(value: unknown): AddressLabel | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return (ADDRESS_LABELS as readonly string[]).includes(v) ? (v as AddressLabel) : null;
}

/**
 * The checkout stores one `street` line but shows two inputs (Building/Floor
 * and Street). Saved rows — including pre-split ones — hold the combined
 * line, so applying one splits at the first comma; composing mirrors it.
 */
export function splitStreetAddress(street: string): { building: string; street: string } {
  const s = (street || '').trim();
  if (!s) return { building: '', street: '' };
  const comma = s.indexOf(',');
  if (comma === -1) return { building: s, street: '' };
  return { building: s.slice(0, comma).trim(), street: s.slice(comma + 1).trim() };
}

/** Recombines the checkouts's two address inputs into the stored street line. */
export function composeStreetAddress(building: string, street: string): string {
  return [building.trim(), street.trim()].filter(Boolean).join(', ');
}

/** Same street + PIN + phone ⇒ same place: keep the first (newest) copy. */
export function dedupeSavedAddresses(
  addresses: SavedCheckoutAddress[]
): SavedCheckoutAddress[] {
  const seen = new Set<string>();
  const unique: SavedCheckoutAddress[] = [];

  for (const address of addresses) {
    if (!address || typeof address.street !== 'string' || !address.street.trim()) continue;
    const key = [
      address.street.trim().toLowerCase(),
      (address.pincode ?? '').trim(),
      (address.phone ?? '').replace(/\D/g, '').slice(-10),
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(address);
  }

  return unique;
}
