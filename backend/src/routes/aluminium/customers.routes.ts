import { Router } from 'express';
import { CustomerController } from '../../controllers/aluminium/CustomerController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const customerController = new CustomerController();

// Apply authentication to all customer routes
router.use(authenticate);

// GET /api/customers - List all customers with pagination
router.get('/', (req, res) => customerController.list(req, res));

// GET /api/customers/active - Get all active customers (for dropdowns)
router.get('/active', (req, res) => customerController.getActive(req, res));

// GET /api/customers/:id - Get customer by ID
router.get('/:id', (req, res) => customerController.getById(req, res));

// POST /api/customers - Create new customer
router.post('/', (req, res) => customerController.create(req, res));

// PUT /api/customers/:id - Update customer
router.put('/:id', (req, res) => customerController.update(req, res));

// DELETE /api/customers/:id - Deactivate customer (soft delete)
router.delete('/:id', (req, res) => customerController.deactivate(req, res));

// POST /api/customers/:id/reactivate - Reactivate customer
router.post('/:id/reactivate', (req, res) => customerController.reactivate(req, res));

export default router;
