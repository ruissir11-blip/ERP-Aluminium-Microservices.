import { Request, Response } from 'express';
import { InvoiceService } from '../../services/aluminium/InvoiceService';
import { InvoiceStatus } from '../../models/aluminium/Invoice';
import { isValidUUID } from '../../utils/validators';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  /**
   * GET /api/v1/invoices
   * List all invoices
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        customerId: req.query.customerId as string | undefined,
        status: req.query.status as InvoiceStatus | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const invoices = await this.invoiceService.findAll(filters);
      res.json({ data: invoices });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/invoices/:id
   * Get invoice by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid invoice ID format' });
        return;
      }

      const invoice = await this.invoiceService.findById(id);

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      res.json({ data: invoice });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoice', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/invoices/from-order
   * Create invoice from order
   */
  async createFromOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerId, invoiceDate, dueDate, vatRate, notes } = req.body;

      // Validation
      if (!orderId || !isValidUUID(orderId)) {
        res.status(400).json({ error: 'Valid order ID is required' });
        return;
      }

      if (!customerId || !isValidUUID(customerId)) {
        res.status(400).json({ error: 'Valid customer ID is required' });
        return;
      }

      const invoice = await this.invoiceService.createFromOrder({
        orderId,
        customerId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        vatRate,
        notes,
      });

      res.status(201).json({ data: invoice });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create invoice', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/invoices/:id
   * Update invoice
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid invoice ID format' });
        return;
      }

      const invoice = await this.invoiceService.update(id, req.body);
      res.json({ data: invoice });
    } catch (error) {
      if ((error as Error).message === 'Invoice not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update invoice', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/invoices/:id/validate
   * Validate invoice
   */
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid invoice ID format' });
        return;
      }

      const invoice = await this.invoiceService.validate(id);
      res.json({ data: invoice });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/invoices/:id/send
   * Send invoice to customer
   */
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid invoice ID format' });
        return;
      }

      const invoice = await this.invoiceService.send(id);
      res.json({ data: invoice });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/invoices/:id/payment
   * Record payment
   */
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, paymentDate, paymentReference } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid invoice ID format' });
        return;
      }

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      if (!paymentMethod) {
        res.status(400).json({ error: 'Payment method is required' });
        return;
      }

      const invoice = await this.invoiceService.recordPayment(
        id,
        amount,
        paymentMethod,
        paymentDate ? new Date(paymentDate) : new Date(),
        paymentReference
      );

      res.json({ data: invoice });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/invoices/:id/cancel
   * Cancel invoice
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid invoice ID format' });
        return;
      }

      const invoice = await this.invoiceService.cancel(id);
      res.json({ data: invoice });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/invoices/overdue
   * Get overdue invoices
   */
  async getOverdue(req: Request, res: Response): Promise<void> {
    try {
      const invoices = await this.invoiceService.getOverdueInvoices();
      res.json({ data: invoices });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch overdue invoices', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/invoices/statistics
   * Get invoice statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const statistics = await this.invoiceService.getStatistics(startDate, endDate);
      res.json({ data: statistics });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statistics', details: (error as Error).message });
    }
  }
}
