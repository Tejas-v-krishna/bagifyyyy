/**
 * Signed studio/admin sessions.
 *
 * The studio cookie used to be the literal string `authenticated`, which meant
 * anyone who typed `document.cookie` once — or simply guessed — could set it and
 * walk into the admin: order records, customer addresses, product writes and the
 * marketing broadcast endpoint. The cookie now carries an HMAC-SHA256 signature
 * over its own expiry, so it can only be minted by something holding
 * AUTH_SECRET.
 *
 * Uses Web Crypto rather than node:crypto so the same code runs in middleware
 * (Edge runtime) and in route handlers (Node runtime).
 */

export const ADMIN_SESSION_COOKIE = 'studio-auth';

/** 12 hours. Short enough that a leaked cookie stops working the same day. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const SUBJECT = 'studio';
const MIN_SECRET_LENGTH = 16;

type AdminSessionPayload = {
  sub: string;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Returns null when AUTH_SECRET is missing or too short to be a real secret.
 * Every caller treats null as "nobody is an admin" — failing closed, because the
 * alternative is a site whose admin panel is open when a variable is unset.
 */
async function getSigningKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export function isAdminSessionConfigured(): boolean {
  const secret = process.env.AUTH_SECRET;
  return Boolean(secret && secret.length >= MIN_SECRET_LENGTH);
}

/** Mints a signed session token, or null if AUTH_SECRET is not usable. */
export async function createAdminSessionToken(
  maxAgeSeconds: number = ADMIN_SESSION_MAX_AGE_SECONDS
): Promise<string | null> {
  const key = await getSigningKey();
  if (!key) return null;

  const payload: AdminSessionPayload = {
    sub: SUBJECT,
    exp: Date.now() + maxAgeSeconds * 1000,
  };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload)
  );

  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/**
 * True only for a token this server signed that has not expired.
 * `crypto.subtle.verify` does the comparison, so no timing-unsafe string
 * equality is involved.
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const key = await getSigningKey();
  if (!key) return false;

  const separator = token.indexOf('.');
  if (separator <= 0 || separator === token.length - 1) return false;

  const encodedPayload = token.slice(0, separator);
  const encodedSignature = token.slice(separator + 1);

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(encodedPayload)
    );
    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload))
    ) as Partial<AdminSessionPayload> | null;

    if (!payload || payload.sub !== SUBJECT) return false;
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return false;
    return payload.exp > Date.now();
  } catch {
    // Malformed base64 or JSON — not a token we issued.
    return false;
  }
}

/** Cookie options shared by every place that sets the studio session. */
export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/',
  };
}

/**
 * Compares two secrets without leaking their contents through timing. Digesting
 * first means the loop always runs over 32 bytes, so length is not a side
 * channel either.
 */
export async function secretsMatch(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);

  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let difference = 0;
  for (let i = 0; i < bytesA.length; i += 1) {
    difference |= bytesA[i] ^ bytesB[i];
  }
  return difference === 0;
}
