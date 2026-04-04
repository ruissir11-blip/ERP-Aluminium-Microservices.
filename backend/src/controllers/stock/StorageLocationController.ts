import { Request, Response } from 'express';
import { StorageLocationService } from '../../services/stock/StorageLocationService';
import { isValidUUID } from '../../utils/validators';

export class StorageLocationController {
  private locationService: StorageLocationService;

  constructor() {
    this.locationService = new StorageLocationService();
  }

  /**
   * GET /api/v1/locations
   * List all storage locations
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const warehouseId = req.query.warehouseId as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const locations = await this.locationService.findAll(warehouseId, isActive);
      res.json({ data: locations });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch locations', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/locations/:id
   * Get location by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid location ID format' });
        return;
      }

      const location = await this.locationService.findById(id);

      if (!location) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }

      res.json({ data: location });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch location', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/locations
   * Create new location
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId, zone, rack, aisle, level, code, maxWeight, maxVolume } = req.body;

      // Validation
      if (!warehouseId || !isValidUUID(warehouseId)) {
        res.status(400).json({ error: 'Valid warehouse ID is required' });
        return;
      }

      if (!zone || !rack || !aisle || !level) {
        res.status(400).json({ error: 'Zone, rack, aisle, and level are required' });
        return;
      }

      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Code is required' });
        return;
      }

      const location = await this.locationService.create({
        warehouseId,
        zone,
        rack,
        aisle,
        level,
        code: code.toUpperCase(),
        maxWeight,
        maxVolume,
      });

      res.status(201).json({ data: location });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create location', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/locations/:id
   * Update location
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid location ID format' });
        return;
      }

      const location = await this.locationService.update(id, req.body);
      res.json({ data: location });
    } catch (error) {
      if ((error as Error).message === 'Storage location not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update location', details: (error as Error).message });
    }
  }

  /**
   * DELETE /api/v1/locations/:id
   * Deactivate location
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid location ID format' });
        return;
      }

      await this.locationService.deactivate(id);
      res.status(204).send();
    } catch (error) {
      if ((error as Error).message === 'Storage location not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to deactivate location', details: (error as Error).message });
    }
  }
}
