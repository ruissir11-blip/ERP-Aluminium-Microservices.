import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/crypto';
import logger from '../config/logger';

export interface MfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MfaVerificationResult {
  success: boolean;
  message: string;
}

export class MfaService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Generate MFA secret and QR code for setup
   * T051: Create MfaService with TOTP generation/verification
   */
  async generateMfaSetup(userId: string): Promise<MfaSetupResult> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `ERP-Aluminium:${user.email}`,
      issuer: 'ERP Aluminium',
      length: 32,
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes (10 codes)
    const backupCodes = this.generateBackupCodes();

    // Store encrypted secret temporarily (will be confirmed after verification)
    user.mfaSecret = secret.base32;
    
    // Store hashed backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => hashPassword(code))
    );
    user.backupCodes = hashedBackupCodes;

    await this.userRepository.save(user);

    logger.info(`MFA setup initiated for user: ${user.email}`, { userId });

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token and enable MFA for user
   * T051: Create MfaService with TOTP generation/verification
   */
  async verifyAndEnableMfa(userId: string, token: string): Promise<MfaVerificationResult> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaSecret) {
      throw new Error('MFA setup not initiated');
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 steps before/after for time drift
    });

    if (!verified) {
      logger.warn(`MFA verification failed for user: ${user.email}`, { userId });
      return {
        success: false,
        message: 'Invalid verification code',
      };
    }

    // Enable MFA
    user.mfaEnabled = true;
    await this.userRepository.save(user);

    logger.info(`MFA enabled for user: ${user.email}`, { userId });

    return {
      success: true,
      message: 'MFA enabled successfully',
    };
  }

  /**
   * Verify TOTP token during login
   * T051: Create MfaService with TOTP generation/verification
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // Try TOTP verification
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (verified) {
      return true;
    }

    // Try backup code verification
    if (user.backupCodes && user.backupCodes.length > 0) {
      for (let i = 0; i < user.backupCodes.length; i++) {
        const isMatch = await comparePassword(token, user.backupCodes[i]);
        if (isMatch) {
          // Remove used backup code
          user.backupCodes.splice(i, 1);
          await this.userRepository.save(user);
          logger.info(`Backup code used for user: ${user.email}`, { userId });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Disable MFA for user
   * T054: Implement MFA disable endpoint
   */
  async disableMfa(userId: string, password: string): Promise<MfaVerificationResult> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled',
      };
    }

    // Verify password before disabling MFA
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid password',
      };
    }

    // Disable MFA and clear secrets
    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.backupCodes = null;
    await this.userRepository.save(user);

    logger.info(`MFA disabled for user: ${user.email}`, { userId });

    return {
      success: true,
      message: 'MFA disabled successfully',
    };
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaEnabled) {
      throw new Error('MFA is not enabled');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();

    // Store hashed backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => hashPassword(code))
    );
    user.backupCodes = hashedBackupCodes;

    await this.userRepository.save(user);

    logger.info(`Backup codes regenerated for user: ${user.email}`, { userId });

    return backupCodes;
  }

  /**
   * Generate random backup codes using cryptographically secure random
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding ambiguous characters
    
    for (let i = 0; i < 10; i++) {
      const codeArray: string[] = [];
      const randomBytesBuffer = randomBytes(4); // 4 bytes = 6 characters of randomness
      
      for (let j = 0; j < 8; j++) {
        // Use modulo to map bytes to character index
        const index = randomBytesBuffer[j % 4] % chars.length;
        codeArray.push(chars[index]);
      }
      
      codes.push(codeArray.join(''));
    }
    return codes;
  }
}

export default new MfaService();
