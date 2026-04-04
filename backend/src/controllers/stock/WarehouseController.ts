import { Request, Response } from 'express';
import { WarehouseService } from '../../services/stock/WarehouseService';
import { isValidUUID } from '../../utils/validators';

export class WarehouseController {
  private warehouseService: WarehouseService;

  constructor() {
    this.warehouseService = new WarehouseService();
  }

  /**
   * GET /api/v1/warehouses
   * List all warehouses
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const warehouses = await this.warehouseService.findAll(isActive);
      res.json({ data: warehouses });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch warehouses', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/warehouses/:id
   * Get warehouse by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid warehouse ID format' });
        return;
      }

      const warehouse = await this.warehouseService.findById(id);

      if (!warehouse) {
        res.status(404).json({ error: 'Warehouse not found' });
        return;
      }

      res.json({ data: warehouse });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch warehouse', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/warehouses
   * Create new warehouse
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, address, contactName, contactEmail, contactPhone } = req.body;

      // Validation
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        res.status(400).json({ error: 'Code is required and must be a non-empty string' });
        return;
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Name is required and must be a non-empty string' });
        return;
      }

      const warehouse = await this.warehouseService.create({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address,
        contactName,
        contactEmail,
        contactPhone,
      });

      res.status(201).json({ data: warehouse });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create warehouse', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/warehouses/:id
   * Update warehouse
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid warehouse ID format' });
        return;
      }

      const warehouse = await this.warehouseService.update(id, req.body);
      res.json({ data: warehouse });
    } catch (error) {
      if ((error as Error).message === 'Warehouse not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update warehouse', details: (error as Error).message });
    }
  }

  /**
   * DELETE /api/v1/warehouses/:id
   * Deactivate warehouse
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid warehouse ID format' });
        return;
      }

      await this.warehouseService.deactivate(id);
      res.status(204).send();
    } catch (error) {
      if ((error as Error).message === 'Warehouse not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to deactivate warehouse', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/warehouses/:id/reactivate
   * Reactivate warehouse
   */
  async reactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid warehouse ID format' });
        return;
      }

      const warehouse = await this.warehouseService.reactivate(id);
      res.json({ data: warehouse });
    } catch (error) {
      if ((error as Error).message === 'Warehouse not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to reactivate warehouse', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/warehouses/:id/statistics
   * Get warehouse statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid warehouse ID format' });
        return;
      }

      const statistics = await this.warehouseService.getStatistics(id);
      res.json({ data: statistics });
    } catch (error) {
      if ((error as Error).message === 'Warehouse not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch statistics', details: (error as Error).message });
    }
  }
}
