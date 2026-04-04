import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import logger from '../config/logger';

// Extended user type for authenticated requests
interface AuthenticatedUser extends Omit<TokenPayload, 'role'> {
  id: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    permissions: Array<{ module: string; actions: string[] }>;
  };
  mfaEnabled: boolean;
  mfaSecret: string | null;
  backupCodes: string[] | null;
  lastLoginAt: Date | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      relations: ['role'],
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is deactivated',
        },
      });
      return;
    }

    // Check if account is temporarily locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account is locked until ${user.lockedUntil.toISOString()}`,
        },
      });
      return;
    }

    // Merge user data with token payload, excluding the conflicting 'role' property
    const { role: _role, ...tokenData } = decoded;
    req.user = { ...user, ...tokenData } as AuthenticatedUser;
    next();
  } catch (error) {
    // Handle specific JWT error types
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token format',
        },
      });
      return;
    }
    
    // Log unexpected errors for debugging
    logger.error('Authentication error', { error: (error as Error).message, stack: error instanceof Error ? error.stack : undefined });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
      },
    });
  }
};