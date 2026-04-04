import { Request, Response } from 'express';
import { QuoteService } from '../../services/aluminium/QuoteService';
import { PdfService } from '../../services/aluminium/PdfService';
import { QuoteStatus } from '../../models/aluminium/Quote';
import { isValidUUID } from '../../utils/validators';

export class QuoteController {
  private quoteService: QuoteService;

  constructor() {
    this.quoteService = new QuoteService();
  }

  /**
   * GET /api/quotes
   * List all quotes with optional filtering
   */
  async listQuotes(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as QuoteStatus,
        customerId: req.query.customerId as string,
        commercialId: req.query.commercialId as string,
      };

      const quotes = await this.quoteService.findAll(filters);
      res.json({ data: quotes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quotes', details: (error as Error).message });
    }
  }

  /**
   * GET /api/quotes/:id
   * Get quote by ID with lines
   */
  async getQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid quote ID format' });
        return;
      }
      
      const quote = await this.quoteService.findById(id);

      if (!quote) {
        res.status(404).json({ error: 'Quote not found' });
        return;
      }

      res.json({ data: quote });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quote', details: (error as Error).message });
    }
  }

  /**
   * POST /api/quotes
   * Create new quote
   */
  async createQuote(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Validate required fields
      const { customerId, validUntil } = req.body;
      
      if (!customerId || !isValidUUID(customerId)) {
        res.status(400).json({ error: 'Customer ID is required and must be a valid UUID' });
        return;
      }
      
      if (validUntil) {
        const validUntilDate = new Date(validUntil);
        if (isNaN(validUntilDate.getTime())) {
          res.status(400).json({ error: 'Valid until must be a valid date' });
          return;
        }
        if (validUntilDate < new Date()) {
          res.status(400).json({ error: 'Valid until date must be in the future' });
          return;
        }
      }
      
      const quote = await this.quoteService.create({
        ...req.body,
        commercialId: userId,
      });
      res.status(201).json({ data: quote });
    } catch (error) {
      res.status(400).json({ error: 'Failed to create quote', details: (error as Error).message });
    }
  }

  /**
   * POST /api/quotes/:id/lines
   * Add line to quote
   */
  async addLine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid quote ID format' });
        return;
      }
      
      // Validate required fields
      const { profileId, quantity, unitLength, unitPrice } = req.body;
      
      if (!profileId || !isValidUUID(profileId)) {
        res.status(400).json({ error: 'Profile ID is required and must be a valid UUID' });
        return;
      }
      
      if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
        res.status(400).json({ error: 'Quantity is required and must be a positive integer' });
        return;
      }
      
      if (typeof unitLength !== 'number' || unitLength <= 0) {
        res.status(400).json({ error: 'Unit length is required and must be a positive number' });
        return;
      }
      
      if (typeof unitPrice !== 'number' || unitPrice < 0) {
        res.status(400).json({ error: 'Unit price is required and must be a non-negative number' });
        return;
      }
      
      const line = await this.quoteService.addLine(id, req.body);
      res.status(201).json({ data: line });
    } catch (error) {
      if ((error as Error).message === 'Quote not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to add line', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/quotes/:id/lines/:lineId
   * Update line in quote
   */
  async updateLine(req: Request, res: Response): Promise<void> {
    try {
      const { id, lineId } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid quote ID format' });
        return;
      }
      
      if (!isValidUUID(lineId)) {
        res.status(400).json({ error: 'Invalid line ID format' });
        return;
      }
      
      // Validate required fields
      const { quantity, unitLength, unitPrice, lineDiscount, description } = req.body;
      
      if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity))) {
        res.status(400).json({ error: 'Quantity must be a positive integer' });
        return;
      }
      
      if (unitLength !== undefined && (typeof unitLength !== 'number' || unitLength <= 0)) {
        res.status(400).json({ error: 'Unit length must be a positive number' });
        return;
      }
      
      if (unitPrice !== undefined && (typeof unitPrice !== 'number' || unitPrice < 0)) {
        res.status(400).json({ error: 'Unit price must be a non-negative number' });
        return;
      }
      
      const line = await this.quoteService.updateLine(id, lineId, req.body);
      res.json({ data: line });
    } catch (error) {
      if ((error as Error).message === 'Quote not found' || (error as Error).message === 'Line not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message === 'Cannot modify quote lines after quote is sent') {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update line', details: (error as Error).message });
    }
  }

  /**
   * DELETE /api/quotes/:id/lines/:lineId
   * Remove line from quote
   */
  async removeLine(req: Request, res: Response): Promise<void> {
    try {
      const { id, lineId } = req.params;
      await this.quoteService.removeLine(id, lineId);
      res.status(204).send();
    } catch (error) {
      if ((error as Error).message === 'Quote not found' || (error as Error).message === 'Line not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to remove line', details: (error as Error).message });
    }
  }

  /**
   * POST /api/quotes/:id/refuse
   * Refuse quote
   */
  async refuseQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quote = await this.quoteService.refuseQuote(id);
      res.json({ data: quote });
    } catch (error) {
      if ((error as Error).message === 'Quote not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to refuse quote', details: (error as Error).message });
    }
  }

  /**
   * POST /api/quotes/:id/send
   * Send quote to customer
   */
  async sendQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quote = await this.quoteService.sendQuote(id);
      res.json({ data: quote });
    } catch (error) {
      if ((error as Error).message === 'Quote not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to send quote', details: (error as Error).message });
    }
  }

  /**
   * POST /api/quotes/:id/accept
   * Accept quote
   */
  async acceptQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quote = await this.quoteService.acceptQuote(id);
      res.json({ data: quote });
    } catch (error) {
      if ((error as Error).message === 'Quote not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to accept quote', details: (error as Error).message });
    }
  }

  /**
   * POST /api/quotes/:id/convert
   * Convert quote to order
   */
  async convertToOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      const order = await this.quoteService.convertToOrder(id, userId);
      res.status(201).json({ data: order });
    } catch (error) {
      if ((error as Error).message === 'Quote not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to convert quote', details: (error as Error).message });
    }
  }

  /**
   * GET /api/quotes/:id/pdf
   * Generate PDF for quote
   */
  async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid quote ID format' });
        return;
      }
      
      const quote = await this.quoteService.findById(id);
      
      if (!quote) {
        res.status(404).json({ error: 'Quote not found' });
        return;
      }
      
      const pdfService = new PdfService();
      const pdfBuffer = await pdfService.generateQuotePdf(quote);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="devis-${quote.quoteNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate PDF', details: (error as Error).message });
    }
  }
}
