import { describe, expect, it } from 'vitest';
import { estimateDeliveryEta, formatEtaRange } from '../deliveryEta';

describe('estimateDeliveryEta', () => {
  // Sat 17 Oct 2026 — a pinned "today" so date math is exact.
  const now = new Date(2026, 9, 17);

  it('gives Kerala the fastest window (2–4 days)', () => {
    const eta = estimateDeliveryEta('Kerala', now);
    expect([eta.minDays, eta.maxDays]).toEqual([2, 4]);
    expect(eta.from.getDate()).toBe(19);
    expect(eta.to.getDate()).toBe(21);
  });

  it('gives South India 3–5 days', () => {
    for (const state of ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry', 'Goa']) {
      const eta = estimateDeliveryEta(state, now);
      expect([eta.minDays, eta.maxDays], state).toEqual([3, 5]);
    }
  });

  it('gives the rest of India 4–7 days', () => {
    for (const state of ['Maharashtra', 'Delhi', 'West Bengal', 'Uttar Pradesh']) {
      const eta = estimateDeliveryEta(state, now);
      expect([eta.minDays, eta.maxDays], state).toEqual([4, 7]);
    }
  });

  it('gives remote areas 5–8 days', () => {
    for (const state of ['Ladakh', 'Assam', 'Andaman & Nicobar Islands', 'Jammu & Kashmir']) {
      const eta = estimateDeliveryEta(state, now);
      expect([eta.minDays, eta.maxDays], state).toEqual([5, 8]);
    }
  });

  it('falls back to the standard window for a missing or unknown state', () => {
    for (const state of [undefined, null, '', 'Atlantis']) {
      const eta = estimateDeliveryEta(state, now);
      expect([eta.minDays, eta.maxDays]).toEqual([4, 7]);
    }
  });

  it('is case- and whitespace-insensitive', () => {
    expect(estimateDeliveryEta('KERALA', now).minDays).toBe(2);
    expect(estimateDeliveryEta('  tamil nadu  ', now).minDays).toBe(3);
  });

  it('does not mutate the date it was given', () => {
    const base = new Date(2026, 9, 17);
    estimateDeliveryEta('Kerala', base);
    expect(base.getDate()).toBe(17);
  });
});

describe('formatEtaRange', () => {
  it('renders a compact weekday range', () => {
    expect(formatEtaRange(estimateDeliveryEta('Kerala', new Date(2026, 9, 17)))).toBe(
      'Mon, 19 Oct – Wed, 21 Oct'
    );
  });

  it('rolls over month boundaries', () => {
    expect(formatEtaRange(estimateDeliveryEta('Kerala', new Date(2026, 9, 30)))).toBe(
      'Sun, 1 Nov – Tue, 3 Nov'
    );
  });
});
