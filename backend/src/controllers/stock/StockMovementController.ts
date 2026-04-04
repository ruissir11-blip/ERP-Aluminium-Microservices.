import { Request, Response } from 'express';
import { StockMovementService } from '../../services/stock/StockMovementService';
import { MovementType } from '../../models/stock/StockMovement';

export class StockMovementController {
  private movementService: StockMovementService;

  constructor() {
    this.movementService = new StockMovementService();
  }

  /**
   * GET /api/v1/stock-movements
   * List all stock movements
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const filters = {
        profileId: req.query.profileId as string | undefined,
        warehouseId: req.query.warehouseId as string | undefined,
        locationId: req.query.locationId as string | undefined,
        movementType: req.query.movementType as MovementType | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        referenceType: req.query.referenceType as string | undefined,
        referenceId: req.query.referenceId as string | undefined,
      };

      const result = await this.movementService.findAll(filters, page, limit);
      res.json({
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movements', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/stock-movements/:id
   * Get movement by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const movement = await this.movementService.findById(id);

      if (!movement) {
        res.status(404).json({ error: 'Stock movement not found' });
        return;
      }

      res.json({ data: movement });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movement', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/stock-movements/history/:profileId/:warehouseId
   * Get movement history for an item
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, warehouseId } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const history = await this.movementService.getHistory(profileId, warehouseId, limit);
      res.json({ data: history });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/stock-movements/summary/:profileId/:warehouseId
   * Get movement summary
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, warehouseId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const summary = await this.movementService.getMovementSummary(profileId, warehouseId, startDate, endDate);
      res.json({ data: summary });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch summary', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/stock-movements/rotation/:profileId
   * Calculate stock rotation rate
   */
  async getRotation(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const warehouseId = req.query.warehouseId as string | undefined;
      const days = req.query.days ? Number(req.query.days) : 90;

      const rotation = await this.movementService.calculateRotationRate(profileId, warehouseId, days);
      res.json({ data: { profileId, warehouseId, rotationRate: rotation, periodDays: days } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate rotation', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/stock-movements
   * Create a new stock movement
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { 
        profileId, 
        warehouseId, 
        locationId,
        lotId,
        movementType, 
        quantity, 
        notes, 
        referenceType, 
        referenceId,
        unitCost,
        performedAt
      } = req.body;

      if (!profileId || !warehouseId || !movementType || quantity === undefined) {
        res.status(400).json({ error: 'Missing required fields: profileId, warehouseId, movementType, quantity' });
        return;
      }

      // Get user ID from authenticated request
      const performedBy = (req as any).user?.id || req.body.performedBy;
      if (!performedBy) {
        res.status(400).json({ error: 'User not authenticated' });
        return;
      }

      const movement = await this.movementService.create({
        profileId,
        warehouseId,
        locationId,
        lotId,
        movementType,
        quantity,
        unitCost,
        notes,
        referenceType: referenceType || 'MANUAL',
        referenceId: referenceId || `MOV-${Date.now()}`,
        performedBy,
        performedAt: performedAt ? new Date(performedAt) : new Date(),
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create movement', details: (error as Error).message });
    }
  }
}
