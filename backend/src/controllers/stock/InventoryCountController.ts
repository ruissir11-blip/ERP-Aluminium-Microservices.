import { Request, Response } from 'express';
import { InventoryCountService } from '../../services/stock/InventoryCountService';
import { InventoryCountStatus } from '../../models/stock/InventoryCount';
import { CountType } from '../../models/stock/InventoryCount';
import { isValidUUID } from '../../utils/validators';

export class InventoryCountController {
  private countService: InventoryCountService;

  constructor() {
    this.countService = new InventoryCountService();
  }

  /**
   * GET /api/v1/inventory-counts
   * List all inventory counts
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as InventoryCountStatus | undefined;
      const counts = await this.countService.findAll(status);
      res.json({ data: counts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory counts', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/inventory-counts/:id
   * Get inventory count by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const count = await this.countService.findById(id);

      if (!count) {
        res.status(404).json({ error: 'Inventory count not found' });
        return;
      }

      res.json({ data: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory count', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts
   * Create new inventory count
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId, countType, notes } = req.body;
      const userId = (req as any).user?.id || 'system';

      // Validation
      if (!warehouseId || !isValidUUID(warehouseId)) {
        res.status(400).json({ error: 'Valid warehouse ID is required' });
        return;
      }

      if (!countType || !Object.values(CountType).includes(countType)) {
        res.status(400).json({ error: 'Valid count type is required (FULL, CYCLE, SPOT)' });
        return;
      }

      const count = await this.countService.create({
        warehouseId,
        countType,
        notes,
        initiatedBy: userId,
      });

      res.status(201).json({ data: count });
    } catch (error) {
      res.status(400).json({ error: 'Failed to create inventory count', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts/:id/start
   * Start inventory count
   */
  async start(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const count = await this.countService.startCount(id);
      res.json({ data: count });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('already started')) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to start inventory count', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/inventory-counts/:id/lines
   * Get count lines
   */
  async getLines(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const lines = await this.countService.getLines(id);
      res.json({ data: lines });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch count lines', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts/:id/lines/:lineId
   * Record counted quantity
   */
  async recordCount(req: Request, res: Response): Promise<void> {
    try {
      const { lineId } = req.params;
      const { countedQuantity, notes } = req.body;
      const userId = (req as any).user?.id || 'system';

      if (!isValidUUID(lineId)) {
        res.status(400).json({ error: 'Invalid line ID format' });
        return;
      }

      if (countedQuantity === undefined || countedQuantity < 0) {
        res.status(400).json({ error: 'Counted quantity is required and must be non-negative' });
        return;
      }

      const line = await this.countService.recordCount(lineId, countedQuantity, userId, notes);
      res.json({ data: line });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to record count', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts/:id/submit
   * Submit count for review
   */
  async submitForReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const count = await this.countService.submitForReview(id);
      res.json({ data: count });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts/:id/approve
   * Approve adjustments
   */
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const count = await this.countService.approveAdjustments(id, userId);
      res.json({ data: count });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts/:id/complete
   * Complete inventory count
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const count = await this.countService.complete(id);
      res.json({ data: count });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory-counts/:id/cancel
   * Cancel inventory count
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const count = await this.countService.cancel(id);
      res.json({ data: count });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/inventory-counts/:id/statistics
   * Get count statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory count ID format' });
        return;
      }

      const stats = await this.countService.getStatistics(id);
      res.json({ data: stats });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch statistics', details: (error as Error).message });
    }
  }
}
