import { Request, Response } from 'express';
import { InventoryItemService } from '../../services/stock/InventoryItemService';
import { isValidUUID } from '../../utils/validators';

export class InventoryItemController {
  private itemService: InventoryItemService;

  constructor() {
    this.itemService = new InventoryItemService();
  }

  /**
   * GET /api/v1/inventory
   * List all inventory items with pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const perPage = req.query.perPage ? parseInt(req.query.perPage as string, 10) : 10;

      const filters = {
        warehouseId: req.query.warehouseId as string | undefined,
        locationId: req.query.locationId as string | undefined,
        profileId: req.query.profileId as string | undefined,
        lotId: req.query.lotId as string | undefined,
        lowStock: req.query.lowStock === 'true',
        threshold: req.query.threshold ? Number(req.query.threshold) : undefined,
      };

      const result = await this.itemService.findAll(filters, page, perPage);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/inventory/:id
   * Get inventory item by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory item ID format' });
        return;
      }

      const item = await this.itemService.findById(id);

      if (!item) {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }

      res.json({ data: item });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory item', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory
   * Create new inventory item
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, warehouseId, locationId, lotId, quantityOnHand, averageUnitCost } = req.body;
      const userId = (req as any).user?.id || 'system';
      const ipAddress = req.ip;

      // Validation
      if (!profileId || !isValidUUID(profileId)) {
        res.status(400).json({ error: 'Valid profile ID is required' });
        return;
      }

      if (!warehouseId || !isValidUUID(warehouseId)) {
        res.status(400).json({ error: 'Valid warehouse ID is required' });
        return;
      }

      const item = await this.itemService.create({
        profileId,
        warehouseId,
        locationId,
        lotId,
        quantityOnHand,
        averageUnitCost,
      }, userId, ipAddress || undefined);

      res.status(201).json({ data: item });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create inventory item', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/inventory/:id
   * Update inventory item
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory item ID format' });
        return;
      }

      const item = await this.itemService.update(id, req.body);
      res.json({ data: item });
    } catch (error) {
      if ((error as Error).message === 'Inventory item not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update inventory item', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory/:id/adjust
   * Adjust inventory quantity
   */
  async adjust(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { adjustment, reason, referenceType, referenceId } = req.body;
      const userId = (req as any).user?.id || 'system';
      const ipAddress = req.ip;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory item ID format' });
        return;
      }

      if (adjustment === undefined || typeof adjustment !== 'number') {
        res.status(400).json({ error: 'Adjustment value is required and must be a number' });
        return;
      }

      if (!reason) {
        res.status(400).json({ error: 'Reason is required' });
        return;
      }

      const item = await this.itemService.adjustQuantity(
        id,
        adjustment,
        reason,
        userId,
        referenceType || 'MANUAL_ADJUSTMENT',
        referenceId || id,
        ipAddress || undefined
      );

      res.json({ data: item });
    } catch (error) {
      if ((error as Error).message === 'Inventory item not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('Insufficient')) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to adjust inventory', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/inventory/:id/transfer
   * Transfer inventory to another warehouse
   */
  async transfer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { toWarehouseId, toLocationId, quantity, referenceType, referenceId } = req.body;
      const userId = (req as any).user?.id || 'system';
      const ipAddress = req.ip;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid inventory item ID format' });
        return;
      }

      if (!toWarehouseId || !isValidUUID(toWarehouseId)) {
        res.status(400).json({ error: 'Valid destination warehouse ID is required' });
        return;
      }

      if (!quantity || quantity <= 0) {
        res.status(400).json({ error: 'Quantity must be greater than 0' });
        return;
      }

      const result = await this.itemService.transfer(
        id,
        toWarehouseId,
        toLocationId,
        quantity,
        userId,
        referenceType || 'TRANSFER',
        referenceId || id,
        ipAddress || undefined
      );

      res.json({ data: { fromItem: result.fromItem, toItem: result.toItem } });
    } catch (error) {
      if ((error as Error).message === 'Inventory item not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('Insufficient')) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to transfer inventory', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/inventory/low-stock
   * Get low stock items
   */
  async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
      const items = await this.itemService.getLowStockItems(threshold);
      res.json({ data: items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch low stock items', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/inventory/value
   * Get total stock value
   */
  async getTotalValue(req: Request, res: Response): Promise<void> {
    try {
      const warehouseId = req.query.warehouseId as string | undefined;
      const totalValue = await this.itemService.getTotalStockValue(warehouseId);
      res.json({ data: { totalValue } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate stock value', details: (error as Error).message });
    }
  }
}
