/**
 * Small in-memory fixed-window rate limiter for sensitive endpoints
 * (login, password reset, studio auth). Per serverless instance, so it is a
 * speed bump rather than a hard guarantee — enough to break up credential
 * stuffing and reset-spam without adding infrastructure. Swap the Map for
 * Redis/Upstash if multi-instance strictness is ever needed.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    bucket.count += 1;
    if (bucket.count > limit) {
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }
  }

  // Opportunistic sweep so long-lived instances don't grow the map forever.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from platform-set proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}
