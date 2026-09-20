import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimit } from '../rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to the limit then blocks until the window passes', () => {
    const key = 'test:a';
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('resets after the window elapses', () => {
    const key = 'test:b';
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000);
    expect(rateLimit(key, 3, 60_000).ok).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it('tracks keys independently', () => {
    for (let i = 0; i < 3; i++) rateLimit('test:c1', 3, 60_000);
    expect(rateLimit('test:c1', 3, 60_000).ok).toBe(false);
    expect(rateLimit('test:c2', 3, 60_000).ok).toBe(true);
  });
});
