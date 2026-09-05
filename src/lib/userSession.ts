import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * Signed user sessions — replaces the old `user-session = user.id` plain UUID.
 * Mirrors src/lib/adminSession.ts but with per-user subject.
 */

export const USER_SESSION_COOKIE = 'user-session';
export const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MIN_SECRET_LENGTH = 16;

type UserSessionPayload = {
  sub: string; // userId
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

async function getSigningKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;

  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createUserSessionToken(
  userId: string,
  maxAgeSeconds: number = USER_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const key = await getSigningKey();
  if (!key) {
    throw new Error('AUTH_SECRET is missing or too short for user sessions.');
  }

  const payload: UserSessionPayload = {
    sub: userId,
    exp: Date.now() + maxAgeSeconds * 1000,
  };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyUserSessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const key = await getSigningKey();

  // Missing or weak configuration invalidates all sessions.
  if (!key) return null;

  // Signed token format: payload.signature
  const separator = token.indexOf('.');
  if (separator > 0) {
    const encodedPayload = token.slice(0, separator);
    const encodedSignature = token.slice(separator + 1);
    try {
      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        base64UrlToBytes(encodedSignature),
        new TextEncoder().encode(encodedPayload)
      );
      if (!valid) return null;
      const payload = JSON.parse(
        new TextDecoder().decode(base64UrlToBytes(encodedPayload))
      ) as Partial<UserSessionPayload> | null;
      if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
      if (!Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }

  // Grace period fallback: legacy raw UUIDs are accepted only in development.
  if (process.env.NODE_ENV !== 'production' && /^[0-9a-fA-F-]{36}$/.test(token)) {
    return token;
  }

  return null;
}

export function userSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: USER_SESSION_MAX_AGE_SECONDS,
    path: '/',
  };
}

/**
 * Helper to get authenticated user from cookie, with verification.
 * Returns User or null.
 */
export async function getAuthedUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const userId = await verifyUserSessionToken(raw);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

/**
 * Helper for route handlers to get userId quickly without DB hit.
 */
export async function getAuthedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_SESSION_COOKIE)?.value;
  return verifyUserSessionToken(raw);
}
