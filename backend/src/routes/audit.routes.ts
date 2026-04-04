import { Router } from 'express';
import auditController from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

// T078: Create audit routes
const router = Router();

// All audit routes require authentication and audit read permission
router.use(authenticate);
router.use(requirePermission('audit', 'read'));

// Query audit logs
router.get('/', auditController.queryAuditLogs);

// Get unique filter values
router.get('/actions', auditController.getUniqueActions);
router.get('/modules', auditController.getUniqueModules);

// Get statistics
router.get('/statistics', auditController.getStatistics);

// Export to CSV
router.get('/export', auditController.exportAuditLogs);

// Get single audit log
router.get('/:id', auditController.getAuditLogById);

export default router;
