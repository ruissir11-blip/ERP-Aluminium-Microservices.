import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Parse and validate rate limit configuration
const parseRateLimitConfig = (): { windowMs: number; max: number } => {
  // In development, use more permissive limits
  if (process.env.NODE_ENV === 'development') {
    return { windowMs: 60000, max: 1000 };
  }
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

  if (isNaN(windowMs) || windowMs < 1000) {
    throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
  }
  if (isNaN(max) || max < 1) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }

  return { windowMs, max };
};

const rateLimitConfig = parseRateLimitConfig();

// General API rate limiter: 100 requests per minute per user/IP
export const apiRateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Use type-safe access to user property
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    return userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

// Login rate limiter: 5 attempts per minute per IP
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request): string => req.ip || 'unknown',
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later',
      },
    });
  },
});