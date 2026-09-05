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
