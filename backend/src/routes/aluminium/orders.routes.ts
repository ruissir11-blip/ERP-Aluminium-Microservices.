import { Router } from 'express';
import { orderController } from '../../controllers/aluminium/OrderController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// GET /api/v1/orders - List all orders
router.get('/', (req, res) => orderController.getAll(req, res));

// GET /api/v1/orders/:id - Get order by ID
router.get('/:id', (req, res) => orderController.getById(req, res));

// POST /api/v1/orders - Create new order
router.post('/', (req, res) => orderController.create(req, res));

// PATCH /api/v1/orders/:id/status - Update order status
router.patch('/:id/status', (req, res) => orderController.updateStatus(req, res));

// PATCH /api/v1/orders/:id - Update order details
router.patch('/:id', (req, res) => orderController.update(req, res));

// GET /api/v1/orders/:id/delivery-note - Generate BL PDF
router.get('/:id/delivery-note', (req, res) => orderController.downloadDeliveryNote(req, res));

export default router;
