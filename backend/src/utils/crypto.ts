import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

if (isNaN(SALT_ROUNDS) || SALT_ROUNDS < 10) {
  throw new Error('BCRYPT_ROUNDS must be a number >= 10');
}

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a cryptographically secure random token
 * Returns a hex string of specified byte length (default 32 bytes = 64 hex chars)
 */
export const generateToken = (byteLength: number = 32): string => {
  return randomBytes(byteLength).toString('hex');
};

/**
 * Hash a token for storage (using bcrypt for tokens that need verification)
 */
export const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, SALT_ROUNDS);
};

/**
 * Compare a token with its hash
 */
export const compareToken = async (
  token: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(token, hash);
};