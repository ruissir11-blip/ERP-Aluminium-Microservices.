import { User } from '../models/User';
import { getRepository } from 'typeorm';
import * as crypto from '../utils/crypto';

export class PasswordService {
  /**
   * Check if the new password matches any of the user's previous passwords
   * This prevents password reuse within the configured history limit
   */
  static async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    const PASSWORD_HISTORY_LIMIT = 5; // Keep last 5 passwords
    
    // In a real implementation, you'd store password history in a separate table
    // For now, we'll implement a simplified version that checks against recent password hashes
    // This would require a password_history table in production
    
    // Placeholder: In production, query password_history table
    // const history = await getRepository(PasswordHistory).find({
    //   where: { userId },
    //   order: { createdAt: 'DESC' },
    //   take: PASSWORD_HISTORY_LIMIT
    // });
    
    // for (const entry of history) {
    //   if (await crypto.compare(newPassword, entry.passwordHash)) {
    //     return false; // Password was used before
    //   }
    // }
    
    return true; // No history match found
  }

  /**
   * Add the new password to user's password history
   */
  static async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    const PASSWORD_HISTORY_LIMIT = 5;
    
    // In production, store in password_history table
    // const history = new PasswordHistory();
    // history.userId = userId;
    // history.passwordHash = passwordHash;
    // history.createdAt = new Date();
    // await getRepository(PasswordHistory).save(history);
    
    // Clean up old entries beyond the limit
    // await getRepository(PasswordHistory)
    //   .createQueryBuilder()
    //   .delete()
    //   .where(`id NOT IN (
    //     SELECT id FROM password_history 
    //     WHERE user_id = :userId 
    //     ORDER BY created_at DESC 
    //     LIMIT :limit
    //   )`, { userId, limit: PASSWORD_HISTORY_LIMIT })
    //   .execute();
  }

  /**
   * Validate password meets strength requirements
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if password is in common password list
   */
  static async isCommonPassword(password: string): Promise<boolean> {
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }
}

export default PasswordService;
