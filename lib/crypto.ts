import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required for encryption');
  }
  // Derive a 32-byte key from the session secret
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns: iv:authTag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string (iv:authTag:ciphertext format)
 * Returns the original plaintext
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string looks like it's already encrypted (iv:tag:cipher format)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':');
  if (parts.length !== 3) return false;
  // Check that first two parts are valid hex of correct length
  return parts[0].length === IV_LENGTH * 2 && parts[1].length === TAG_LENGTH * 2;
}

/**
 * Safely get the access token - decrypts if encrypted, returns as-is if plaintext
 * This allows gradual migration from plaintext to encrypted tokens
 */
export function getAccessToken(storedToken: string): string {
  if (isEncrypted(storedToken)) {
    return decrypt(storedToken);
  }
  return storedToken;
}

// ============================================
// HMAC TOKENS (for unsubscribe links, etc.)
// ============================================

/**
 * Generate an HMAC token for a given value (e.g., email address)
 * Used for verifying unsubscribe links without storing tokens in DB
 */
export function generateHmacToken(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET required for token generation');
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * Verify an HMAC token for a given value
 */
export function verifyHmacToken(value: string, token: string): boolean {
  const expected = generateHmacToken(value);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

// ============================================
// PASSWORD HASHING (for workspace client passwords)
// ============================================

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_LEN = 16;

/**
 * Hash a password using scrypt (Node.js built-in, no external deps)
 * Returns: salt:hash (both hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SCRYPT_SALT_LEN);
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');

  // If it's not in salt:hash format, it's a legacy plaintext password
  // Do a timing-safe comparison against the plaintext
  if (parts.length !== 2 || parts[0].length !== SCRYPT_SALT_LEN * 2) {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(password, 'utf8'),
        Buffer.from(storedHash, 'utf8')
      );
    } catch {
      // Lengths don't match — passwords are different
      return false;
    }
  }

  const salt = Buffer.from(parts[0], 'hex');
  const originalHash = Buffer.from(parts[1], 'hex');

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      try {
        resolve(crypto.timingSafeEqual(originalHash, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}
