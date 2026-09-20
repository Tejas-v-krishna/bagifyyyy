import { randomUUID } from 'crypto';

const CHECKOUT_ID_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

/** Read a bounded, opaque idempotency key from the body or standard header. */
export function getCheckoutId(request: Request, body: unknown): string {
  const bodyValue =
    body && typeof body === 'object' && 'checkoutId' in body
      ? (body as { checkoutId?: unknown }).checkoutId
      : undefined;
  const headerValue = request.headers.get('idempotency-key');
  const candidate = typeof bodyValue === 'string' ? bodyValue : headerValue;

  return candidate && CHECKOUT_ID_PATTERN.test(candidate) ? candidate : randomUUID();
}

export function isValidCheckoutId(value: unknown): value is string {
  return typeof value === 'string' && CHECKOUT_ID_PATTERN.test(value);
}

/**
 * Stock-hold sessions are bound to an HttpOnly cookie minted by the server,
 * never to a client-supplied id. A request body value would let anyone who
 * learns a shopper's hold-session id manage (or wipe) that shopper's holds.
 */
export const HOLD_SESSION_COOKIE = 'bagify_hold';

export function holdSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Holds themselves expire in minutes; the identity just needs to outlive
    // a shopping session, not a browser restart.
    maxAge: 30 * 24 * 60 * 60,
  };
}

/** Read the caller's server-minted hold session, if present and well-formed. */
export function readHoldSession(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const pair of cookieHeader.split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    if (pair.slice(0, eq).trim() !== HOLD_SESSION_COOKIE) continue;
    const value = decodeURIComponent(pair.slice(eq + 1).trim());
    return CHECKOUT_ID_PATTERN.test(value) ? value : null;
  }
  return null;
}
