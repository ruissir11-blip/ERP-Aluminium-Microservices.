import { Router } from 'express';
import { InvoiceController } from '../../controllers/aluminium/InvoiceController';

const router = Router();
const invoiceController = new InvoiceController();

// List all invoices
router.get('/', invoiceController.list.bind(invoiceController));

// Get invoice by ID
router.get('/:id', invoiceController.getById.bind(invoiceController));

// Create invoice from order
router.post('/from-order', invoiceController.createFromOrder.bind(invoiceController));

// Update invoice
router.put('/:id', invoiceController.update.bind(invoiceController));

// Validate invoice
router.post('/:id/validate', invoiceController.validate.bind(invoiceController));

// Send invoice to customer
router.post('/:id/send', invoiceController.send.bind(invoiceController));

// Record payment
router.post('/:id/payment', invoiceController.recordPayment.bind(invoiceController));

// Cancel invoice
router.post('/:id/cancel', invoiceController.cancel.bind(invoiceController));

// Get overdue invoices
router.get('/overdue/list', invoiceController.getOverdue.bind(invoiceController));

// Get invoice statistics
router.get('/statistics/summary', invoiceController.getStatistics.bind(invoiceController));

export default router;
