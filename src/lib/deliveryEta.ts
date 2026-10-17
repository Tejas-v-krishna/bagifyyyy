/**
 * Checkout delivery estimate. The windows include the 24–48h dispatch time
 * the shipping page promises, so they are counted from the order date in
 * plain calendar days:
 *
 *   Kerala 2–4 · South India 3–5 · rest of India 4–7 · remote areas 5–8
 *
 * Pure and deterministic — `now` is injectable so tests can pin real dates,
 * and formatting is hand-rolled (no Intl) so the server and the client always
 * render the exact same string.
 */

const SOUTH_INDIA = new Set([
  'tamil nadu',
  'karnataka',
  'andhra pradesh',
  'telangana',
  'puducherry',
  'goa',
]);

const REMOTE_AREAS = new Set([
  'andaman & nicobar islands',
  'andaman and nicobar islands',
  'lakshadweep',
  'ladakh',
  'jammu & kashmir',
  'jammu and kashmir',
  'arunachal pradesh',
  'assam',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'sikkim',
  'tripura',
]);

export type DeliveryEta = {
  minDays: number;
  maxDays: number;
  from: Date;
  to: Date;
};

export function estimateDeliveryEta(
  state: string | null | undefined,
  now: Date = new Date()
): DeliveryEta {
  const normalized = (state ?? '').trim().toLowerCase();

  let minDays = 4;
  let maxDays = 7;
  if (REMOTE_AREAS.has(normalized)) {
    minDays = 5;
    maxDays = 8;
  } else if (normalized === 'kerala') {
    minDays = 2;
    maxDays = 4;
  } else if (SOUTH_INDIA.has(normalized)) {
    minDays = 3;
    maxDays = 5;
  }

  const from = new Date(now);
  from.setDate(from.getDate() + minDays);
  const to = new Date(now);
  to.setDate(to.getDate() + maxDays);

  return { minDays, maxDays, from, to };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mon, 19 Oct – Wed, 21 Oct" — compact range for checkout copy. */
export function formatEtaRange(eta: DeliveryEta): string {
  const fmt = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${fmt(eta.from)} – ${fmt(eta.to)}`;
}
