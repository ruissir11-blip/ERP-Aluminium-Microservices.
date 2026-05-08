import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Session } from '../models/Session';
import { AuditLog } from '../models/AuditLog';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { hashPassword, comparePassword, generateToken } from '../utils/crypto';
import { generateTokenPair, verifyToken, TokenPayload } from '../utils/jwt';
import { isValidEmail, isValidPassword } from '../utils/validators';
import logger from '../config/logger';
import { sendEmail } from '../config/email';
import { redis, cacheSet, cacheGet, cacheDelete, CACHE_TTL } from '../config/redis';

// MFA token TTL: 5 minutes in seconds
const MFA_TOKEN_TTL = 5 * 60;

// In-memory store fallback for MFA temp tokens (used only if Redis is unavailable)
const mfaTempTokensFallback = new Map<string, { userId: string; email: string; expiresAt: Date }>();

// Cleanup expired tokens from fallback storage every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [token, data] of mfaTempTokensFallback.entries()) {
    if (data.expiresAt < now) {
      mfaTempTokensFallback.delete(token);
    }
  }
}, 5 * 60 * 1000);

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    mfaEnabled: boolean;
  };
  tokens: TokenResponse;
}

export class AuthService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private sessionRepository: Repository<Session>;
  private auditLogRepository: Repository<AuditLog>;
  private passwordResetTokenRepository: Repository<PasswordResetToken>;

  constructor() {
    // Get repositories - they will throw if database is not initialized
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.sessionRepository = AppDataSource.getRepository(Session);
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
    this.passwordResetTokenRepository = AppDataSource.getRepository(PasswordResetToken);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Validate email format
    if (!isValidEmail(dto.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!isValidPassword(dto.password)) {
      throw new Error(
        'Password must be at least 12 characters long and contain uppercase, lowercase, digit, and special character'
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Get default user role
    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    });

    if (!defaultRole) {
      throw new Error('Default role not found. Please run database seeds.');
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password);

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: defaultRole,
      isActive: true,
      failedLoginAttempts: 0,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.createSession(user, dto.ipAddress, dto.userAgent);

    // Log audit event
    await this.createAuditLog(user.id, 'USER_REGISTERED', 'auth', {
      email: user.email,
      ipAddress: dto.ipAddress,
    });

    logger.info(`User registered: ${user.email}`, { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: defaultRole.name,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse | { requiresMfa: true; tempToken: string }> {
    // Validate email format
    if (!isValidEmail(dto.email)) {
      throw new Error('Invalid credentials');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: ['role'],
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      await this.createAuditLog(user.id, 'LOGIN_FAILED_INACTIVE', 'auth', {
        ipAddress: dto.ipAddress,
      });
      throw new Error('Account is deactivated');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.createAuditLog(user.id, 'LOGIN_FAILED_LOCKED', 'auth', {
        ipAddress: dto.ipAddress,
        lockedUntil: user.lockedUntil,
      });
      throw new Error(`Account is locked until ${user.lockedUntil.toISOString()}`);
    }

    // Verify password
    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        logger.warn(`Account locked due to failed login attempts: ${user.email}`, {
          userId: user.id,
        });
      }

      await this.userRepository.save(user);

      await this.createAuditLog(user.id, 'LOGIN_FAILED_PASSWORD', 'auth', {
        ipAddress: dto.ipAddress,
        attempts: user.failedLoginAttempts,
      });

      throw new Error('Invalid credentials');
    }

    // Check if MFA is required
    if (user.mfaEnabled) {
      const tempToken = generateToken(32);
      const tokenData = {
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
      
      // Try to store in Redis, fallback to in-memory if Redis is unavailable
      try {
        await cacheSet(`mfa:temp:${tempToken}`, tokenData, MFA_TOKEN_TTL);
      } catch {
        // Fallback to in-memory storage
        mfaTempTokensFallback.set(tempToken, { 
          userId: tokenData.userId, 
          email: tokenData.email, 
          expiresAt: new Date(tokenData.expiresAt) 
        });
      }
      
      logger.info(`MFA required for login: ${user.email}`, { userId: user.id });
      return { requiresMfa: true, tempToken };
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.createSession(
      user,
      dto.ipAddress,
      dto.userAgent,
      dto.rememberMe
    );

    // Log audit event
    await this.createAuditLog(user.id, 'LOGIN_SUCCESS', 'auth', {
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async logout(userId: string, token: string): Promise<void> {
    // Find and revoke session
    const session = await this.sessionRepository.findOne({
      where: { tokenHash: token },
    });

    if (session) {
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);
    }

    await this.createAuditLog(userId, 'LOGOUT', 'auth', {});
    logger.info(`User logged out: ${userId}`, { userId });
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify session exists and is not revoked
      const session = await this.sessionRepository.findOne({
        where: { refreshTokenHash: refreshToken },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new Error('Session expired or revoked');
      }

      // Generate new token pair
      const tokens = generateTokenPair({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      // Update session with new refresh token
      session.refreshTokenHash = tokens.refreshToken;
      await this.sessionRepository.save(session);

      logger.info(`Token refreshed for user: ${decoded.userId}`, { userId: decoded.userId });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      };
    } catch (error) {
      logger.warn('Token refresh failed', { error: (error as Error).message });
      throw new Error('Invalid or expired refresh token');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = generateToken(32);
    const tokenHash = await hashPassword(resetToken); // Store hash, not plain token

    // Create password reset token
    const passwordResetToken = this.passwordResetTokenRepository.create({
      user,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
    });

    await this.passwordResetTokenRepository.save(passwordResetToken);

    // Send password reset email with the plain token
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - AluTech ERP',
        text: `You requested a password reset for your AluTech ERP account.\n\nUse the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your AluTech ERP account.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Log error but don't expose to user - token is still valid
      logger.error('Failed to send password reset email', { 
        userId: user.id, 
        error: (emailError as Error).message 
      });
    }

    logger.info(`Password reset requested for: ${email}`, { userId: user.id });

    await this.createAuditLog(user.id, 'PASSWORD_RESET_REQUESTED', 'auth', {
      email,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password strength
    if (!isValidPassword(newPassword)) {
      throw new Error(
        'Password must be at least 12 characters long and contain uppercase, lowercase, digit, and special character'
      );
    }

    // Find valid reset token by comparing token hash
    // We need to find the token that matches the provided token
    // Since we store the hash, we need to find all unused tokens and compare
    const resetTokens = await this.passwordResetTokenRepository.find({
      where: { usedAt: IsNull() },
      relations: ['user'],
    });

    let resetToken = null;
    for (const rt of resetTokens) {
      const isValidToken = await comparePassword(token, rt.tokenHash);
      if (isValidToken && rt.expiresAt > new Date()) {
        resetToken = rt;
        break;
      }
    }

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Update user password
    const passwordHash = await hashPassword(newPassword);
    resetToken.user.passwordHash = passwordHash;
    await this.userRepository.save(resetToken.user);

    // Mark token as used
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    // Revoke all existing sessions for security
    await this.sessionRepository.update(
      { userId: resetToken.user.id, revokedAt: IsNull() },
      { revokedAt: new Date() }
    );

    logger.info(`Password reset completed for: ${resetToken.user.email}`, {
      userId: resetToken.user.id,
    });

    await this.createAuditLog(resetToken.user.id, 'PASSWORD_RESET_COMPLETED', 'auth', {});
  }

  /**
   * Verify MFA token during login
   * Validates temp token and MFA code, returns final auth tokens
   */
  async verifyMfaLogin(tempToken: string, mfaToken: string): Promise<AuthResponse> {
    // Validate temp token - try Redis first, then fallback
    let tokenData: { userId: string; email: string; expiresAt: string } | null = null;
    
    try {
      tokenData = await cacheGet(`mfa:temp:${tempToken}`);
    } catch {
      // Fallback to in-memory storage
      tokenData = mfaTempTokensFallback.get(tempToken) as { userId: string; email: string; expiresAt: string } | undefined || null;
    }
    
    if (!tokenData) {
      throw new Error('Invalid or expired temp token');
    }
    
    if (new Date(tokenData.expiresAt) < new Date()) {
      // Clean up expired token
      try {
        await cacheDelete(`mfa:temp:${tempToken}`);
      } catch {
        mfaTempTokensFallback.delete(tempToken);
      }
      throw new Error('Temp token has expired');
    }
    
    // Get user
    const user = await this.userRepository.findOne({
      where: { id: tokenData.userId },
      relations: ['role'],
    });
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    // Verify MFA token using MfaService
    const { MfaService } = await import('./mfa.service');
    const mfaService = new MfaService();
    const isValid = await mfaService.verifyMfaToken(user.id, mfaToken);
    
    if (!isValid) {
      await this.createAuditLog(user.id, 'LOGIN_FAILED_MFA', 'auth', {
        email: user.email,
      });
      throw new Error('Invalid MFA verification code');
    }
    
    // Clear temp token after successful verification
    try {
      await cacheDelete(`mfa:temp:${tempToken}`);
    } catch {
      mfaTempTokensFallback.delete(tempToken);
    }
    
    // Reset failed attempts and update last login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    
    // Generate final tokens
    const tokens = await this.createSession(user);
    
    // Log successful login
    await this.createAuditLog(user.id, 'LOGIN_SUCCESS_MFA', 'auth', {});
    logger.info(`User logged in with MFA: ${user.email}`, { userId: user.id });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  private async createSession(
    user: User,
    ipAddress?: string,
    userAgent?: string,
    rememberMe?: boolean
  ): Promise<TokenResponse> {
    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    // Calculate expiry
    const expiresIn = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days or 24 hours

    // Create session
    const session = this.sessionRepository.create({
      user,
      tokenHash: tokens.accessToken,
      refreshTokenHash: tokens.refreshToken,
      expiresAt: new Date(Date.now() + expiresIn),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      isRememberMe: rememberMe || false,
    });

    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: Math.floor(expiresIn / 1000),
    };
  }

  private async createAuditLog(
    userId: string | null,
    action: string,
    module: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      module,
      details,
      severity: 'info',
    });

    await this.auditLogRepository.save(auditLog);
  }
}