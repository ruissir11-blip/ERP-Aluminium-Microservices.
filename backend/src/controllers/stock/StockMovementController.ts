import { Request, Response } from 'express';
import { StockMovementService } from '../../services/stock/StockMovementService';
import { MovementType } from '../../models/stock/StockMovement';
import { AppDataSource } from '../../config/database';
import { AluminumProfile } from '../../models/aluminium/AluminumProfile';
import { Warehouse } from '../../models/stock/Warehouse';
import { isValidUUID } from '../../utils/validators';

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
      const limit = req.query.perPage ? Number(req.query.perPage) : (req.query.limit ? Number(req.query.limit) : 20);

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
        profileId: bodyProfileId,
        stockItemId, 
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

      const profileId = bodyProfileId || stockItemId;

      if (!profileId) {
        res.status(400).json({ error: 'L\'identifiant de l\'article (profileId) est requis' });
        return;
      }
      if (!warehouseId) {
        res.status(400).json({ error: 'L\'identifiant de l\'entrepôt (warehouseId) est requis' });
        return;
      }
      if (!movementType) {
        res.status(400).json({ error: 'Le type de mouvement est requis' });
        return;
      }
      if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
        res.status(400).json({ error: 'La quantité doit être un nombre valide' });
        return;
      }

      // Verify existence first (handles both UUID and numeric IDs automatically)
      try {
        const profileExist = await AppDataSource.getRepository(AluminumProfile).findOne({ where: { id: profileId } });
        if (!profileExist) {
          res.status(404).json({ error: `Article (Profile) introuvable pour l'ID: ${profileId}` });
          return;
        }

        const warehouseExist = await AppDataSource.getRepository(Warehouse).findOne({ where: { id: warehouseId } });
        if (!warehouseExist) {
          res.status(404).json({ error: `Entrepôt introuvable pour l'ID: ${warehouseId}` });
          return;
        }
      } catch (err) {
        // If database rejects the ID format, return clear error
        if ((err as any).code === '22P02' || (err as Error).message.includes('uuid')) {
          res.status(400).json({ 
            error: `Identifiant invalide: « ${profileId} ». Veuillez sélectionner un article dans la liste.`,
            details: 'Format UUID attendu'
          });
          return;
        }
        res.status(400).json({ 
          error: 'Erreur lors de la vérification des données', 
          details: (err as Error).message,
          received: { profileId, warehouseId } 
        });
        return;
      }

      // Get user ID from authenticated request (middleware guarantees this exists)
      const performedBy = req.user!.id;

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
        performedAt: (performedAt && !isNaN(new Date(performedAt).getTime())) ? new Date(performedAt) : new Date(),
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      console.error('SERVER ERROR IN CREATE MOVEMENT:', error);
      res.status(500).json({ 
        error: 'Failed to create movement', 
        details: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      });
    }
  }
}
