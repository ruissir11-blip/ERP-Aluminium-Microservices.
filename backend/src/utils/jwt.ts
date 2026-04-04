import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET_RAW = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate JWT_SECRET at module load time
if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET_RAW.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

// After validation, we can safely assert it's a string
const JWT_SECRET: Secret = JWT_SECRET_RAW;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Generate an access token
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
};

/**
 * Generate a refresh token
 */
export const generateRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
  );
};

/**
 * Verify and decode a token
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Decode a token without verification
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (
  payload: Omit<TokenPayload, 'type'>
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};