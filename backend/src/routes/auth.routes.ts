import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

// T052, T053, T054: MFA routes
router.post('/mfa/setup', authenticate, authController.setupMfa);
router.post('/mfa/verify', authenticate, authController.verifyMfa);
router.post('/mfa/verify-login', authController.verifyMfaLogin);
router.post('/mfa/disable', authenticate, authController.disableMfa);
router.post('/mfa/backup-codes', authenticate, authController.regenerateBackupCodes);

export default router;