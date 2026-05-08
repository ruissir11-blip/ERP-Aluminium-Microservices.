import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { MfaService } from '../services/mfa.service';
import logger from '../config/logger';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

export class AuthController {
  private authService: AuthService;
  private mfaService: MfaService;
  private userRepository = AppDataSource.getRepository(User);

  constructor() {
    try {
      this.authService = new AuthService();
    } catch (serviceError) {
      logger.error('AuthService initialization failed', { error: (serviceError as Error).message });
      // Service will be lazily initialized on first request
      this.authService = null as unknown as AuthService;
    }
    this.mfaService = new MfaService();
  }

  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService();
    }
    return this.authService;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required: email, password, firstName, lastName',
          },
        });
        return;
      }

      const authService = this.getAuthService();
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Registration error', { error: (error as Error).message });
      
      if ((error as Error).message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        });
        return;
      }

      if ((error as Error).message.includes('Invalid email')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
          },
        });
        return;
      }

      if ((error as Error).message.includes('Password must be')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: (error as Error).message,
          },
        });
        return;
      }

      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        });
        return;
      }

      const authService = this.getAuthService();
      const result = await authService.login({
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        rememberMe,
      });

      // Check if MFA is required
      if ('requiresMfa' in result && result.requiresMfa) {
        res.status(200).json({
          success: true,
          data: {
            requiresMfa: true,
            tempToken: result.tempToken,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Login error', { error: (error as Error).message });

      if ((error as Error).message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
        return;
      }

      if ((error as Error).message === 'Account is deactivated') {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Account is deactivated',
          },
        });
        return;
      }

      if ((error as Error).message.includes('Account is locked')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: (error as Error).message,
          },
        });
        return;
      }

      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const userId = (req as Request & { user?: { id: string } }).user?.id;

      const authService = this.getAuthService();
      await authService.logout(userId || '', token);

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      logger.error('Logout error', { error: (error as Error).message });
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
          },
        });
        return;
      }

      const authService = this.getAuthService();
      const tokens = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      logger.error('Token refresh error', { error: (error as Error).message });

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required',
          },
        });
        return;
      }

      const authService = this.getAuthService();
      await authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        data: {
          message: 'If an account exists with this email, you will receive a password reset link',
        },
      });
    } catch (error) {
      logger.error('Password reset request error', { error: (error as Error).message });
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token and new password are required',
          },
        });
        return;
      }

      const authService = this.getAuthService();
      await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        data: {
          message: 'Password has been reset successfully',
        },
      });
    } catch (error) {
      logger.error('Password reset error', { error: (error as Error).message });

      if ((error as Error).message.includes('Password must be')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: (error as Error).message,
          },
        });
        return;
      }

      if ((error as Error).message.includes('Invalid or expired')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired reset token',
          },
        });
        return;
      }

      next(error);
    }
  };

  /**
   * T052: Implement MFA setup endpoint
   * Generate MFA secret and QR code for user
   */
  setupMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const result = await this.mfaService.generateMfaSetup(userId);

      res.status(200).json({
        success: true,
        data: {
          secret: result.secret,
          qrCodeUrl: result.qrCodeUrl,
          // SECURITY: Backup codes are only returned once during setup
          // They should be displayed to user and user should store them securely
          // The server stores hashed versions for verification
          backupCodes: result.backupCodes,
        },
      });

      // TODO: Store backup codes as hashed in the database, not plain text
      // Current implementation stores them, but should hash before storage
    } catch (error) {
      logger.error('MFA setup error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * T053: Implement MFA verification endpoint
   * Verify TOTP token and enable MFA
   */
  verifyMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      const { token } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Verification token is required',
          },
        });
        return;
      }

      const result = await this.mfaService.verifyAndEnableMfa(userId, token);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MFA_TOKEN',
            message: result.message,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
        },
      });
    } catch (error) {
      logger.error('MFA verification error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * T054: Implement MFA disable endpoint
   * Disable MFA for user after password verification
   */
  disableMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      const { password } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password is required',
          },
        });
        return;
      }

      const result = await this.mfaService.disableMfa(userId, password);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.message === 'Invalid password' ? 'INVALID_PASSWORD' : 'MFA_NOT_ENABLED',
            message: result.message,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
        },
      });
    } catch (error) {
      logger.error('MFA disable error', { error: (error as Error).message });
      next(error);
    }
  };

  /**
   * Regenerate MFA backup codes
   */
  regenerateBackupCodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const backupCodes = await this.mfaService.regenerateBackupCodes(userId);

      res.status(200).json({
        success: true,
        data: {
          backupCodes,
        },
      });
    } catch (error) {
      logger.error('Regenerate backup codes error', { error: (error as Error).message });

      if ((error as Error).message === 'MFA is not enabled') {
        res.status(400).json({
          success: false,
          error: {
            code: 'MFA_NOT_ENABLED',
            message: 'MFA is not enabled',
          },
        });
        return;
      }

      next(error);
    }
  };

  /**
   * Verify MFA token during login
   * T051: Complete MFA login flow with temp token validation
   */
  verifyMfaLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tempToken, token } = req.body;

      if (!tempToken || !token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Temp token and verification code are required',
          },
        });
        return;
      }

      const authService = this.getAuthService();
      const result = await authService.verifyMfaLogin(tempToken, token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('MFA login verification error', { error: (error as Error).message });

      if ((error as Error).message.includes('Invalid') || (error as Error).message.includes('expired')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_MFA_TOKEN',
            message: (error as Error).message,
          },
        });
        return;
      }

      next(error);
    }
  };

  /**
   * Get current authenticated user
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role?.name?.toUpperCase() || 'ADMIN',
          mfaEnabled: user.mfaEnabled,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      logger.error('Get current user error', { error: (error as Error).message });
      next(error);
    }
  };
}