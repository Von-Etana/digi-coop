import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(config.encryption.key), iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with the encrypt function
 */
export function decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(config.encryption.key), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Hash password with PBKDF2 (alternative to bcrypt for specific use cases)
 */
export function hashWithSalt(value: string, iterations: number = 100000): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(value, salt, iterations, 64, 'sha512');
    return `${salt.toString('base64')}:${hash.toString('base64')}`;
}

/**
 * Verify a value against its hash
 */
export function verifyHash(value: string, storedHash: string, iterations: number = 100000): boolean {
    const [salt, hash] = storedHash.split(':');
    const saltBuffer = Buffer.from(salt, 'base64');
    const computedHash = crypto.pbkdf2Sync(value, saltBuffer, iterations, 64, 'sha512');
    return computedHash.toString('base64') === hash;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Create a hash of request body for idempotency checks
 */
export function hashRequestBody(body: unknown): string {
    const normalized = JSON.stringify(body, Object.keys(body as object).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
