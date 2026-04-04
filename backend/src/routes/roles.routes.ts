import { Router } from 'express';
import roleController from '../controllers/role.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All routes require authentication and admin/role management permissions
router.use(authenticate);
router.use(requirePermission('roles', 'read'));

// List all roles
router.get('/', roleController.listRoles);

// Get single role
router.get('/:id', roleController.getRoleById);

// Create role (requires create permission)
router.post('/', requirePermission('roles', 'create'), roleController.createRole);

// Update role (requires update permission)
router.put('/:id', requirePermission('roles', 'update'), roleController.updateRole);

// Delete role (requires delete permission)
router.delete('/:id', requirePermission('roles', 'delete'), roleController.deleteRole);

export default router;
