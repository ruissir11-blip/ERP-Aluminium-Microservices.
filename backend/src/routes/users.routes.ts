import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

// T045: Add user routes with RBAC protection
const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes requiring 'users' read permission
router.get('/', requirePermission('users', 'read'), userController.listUsers);
router.get('/me', userController.getCurrentUser);
router.get('/:id', requirePermission('users', 'read'), userController.getUserById);

// Routes requiring 'users' create permission
router.post('/', requirePermission('users', 'create'), userController.createUser);

// Routes requiring 'users' update permission
router.put('/:id', requirePermission('users', 'update'), userController.updateUser);

// Routes requiring 'users' delete permission
router.delete('/:id', requirePermission('users', 'delete'), userController.deleteUser);

export default router;
