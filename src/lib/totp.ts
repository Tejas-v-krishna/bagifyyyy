import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes an RFC 4648 Base32 string into a Buffer.
 */
export function base32Decode(base32: string): Buffer {
  const clean = base32.replace(/=+$/, '').toUpperCase().replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) {
      throw new Error(`Invalid Base32 character encountered: ${clean[i]}`);
    }
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Encodes a buffer into an RFC 4648 Base32 string (without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generates a fresh random Base32 secret suitable for TOTP (default: 20 bytes / 32 Base32 chars).
 */
export function generateTotpSecret(numBytes = 20): string {
  const randomBytes = crypto.randomBytes(numBytes);
  return base32Encode(randomBytes);
}

/**
 * Calculates the current 6-digit TOTP token for a given Base32 secret.
 * @param secret Base32-encoded secret key
 * @param timeStepOffset Relative window offset (-1, 0, 1) for clock drift compensation
 * @param timeStepSeconds Default: 30 seconds
 */
export function generateTOTP(
  secret: string,
  timeStepOffset = 0,
  timeStepSeconds = 30
): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepSeconds) + timeStepOffset;

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep));

  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verifies a 6-digit TOTP token against a secret.
 * Checks the current time window as well as +/- 1 window (30 seconds) to account for slight clock differences.
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  try {
    for (let i = -window; i <= window; i++) {
      if (generateTOTP(secret, i) === cleanToken) {
        return true;
      }
    }
  } catch (err) {
    console.error('TOTP verification error:', err);
    return false;
  }

  return false;
}

/**
 * Builds the standard `otpauth://` URI recognized by Google Authenticator, 1Password, Authy, Apple Passwords.
 */
export function buildOtpauthUri(
  secret: string,
  accountName = 'admin@bagifyyyy.com',
  issuer = 'BAGIFYYYY'
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
