import { Request, Response } from 'express';
import { LotService } from '../../services/stock/LotService';
import { LotQualityStatus } from '../../models/stock/Lot';
import { isValidUUID } from '../../utils/validators';

export class LotController {
  private lotService: LotService;

  constructor() {
    this.lotService = new LotService();
  }

  /**
   * GET /api/v1/lots
   * List all lots
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.query.profileId as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const qualityStatus = req.query.qualityStatus as LotQualityStatus | undefined;

      const lots = await this.lotService.findAll(profileId, supplierId, qualityStatus);
      res.json({ data: lots });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lots', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/lots/:id
   * Get lot by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid lot ID format' });
        return;
      }

      const lot = await this.lotService.findById(id);

      if (!lot) {
        res.status(404).json({ error: 'Lot not found' });
        return;
      }

      res.json({ data: lot });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lot', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/lots
   * Create new lot
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { lotNumber, profileId, supplierId, receiptDate, initialQuantity, remainingQuantity, unitCost, certificateOfConformity, expiryDate, notes } = req.body;

      // Validation
      if (!lotNumber || typeof lotNumber !== 'string') {
        res.status(400).json({ error: 'Lot number is required' });
        return;
      }

      if (!profileId || !isValidUUID(profileId)) {
        res.status(400).json({ error: 'Valid profile ID is required' });
        return;
      }

      if (!supplierId || !isValidUUID(supplierId)) {
        res.status(400).json({ error: 'Valid supplier ID is required' });
        return;
      }

      if (!receiptDate) {
        res.status(400).json({ error: 'Receipt date is required' });
        return;
      }

      if (!initialQuantity || initialQuantity <= 0) {
        res.status(400).json({ error: 'Initial quantity must be greater than 0' });
        return;
      }

      if (!unitCost || unitCost < 0) {
        res.status(400).json({ error: 'Unit cost is required and must be non-negative' });
        return;
      }

      const lot = await this.lotService.create({
        lotNumber,
        profileId,
        supplierId,
        receiptDate: new Date(receiptDate),
        initialQuantity,
        remainingQuantity: remainingQuantity || initialQuantity,
        unitCost,
        certificateOfConformity,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        notes,
      });

      res.status(201).json({ data: lot });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create lot', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/lots/:id
   * Update lot
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid lot ID format' });
        return;
      }

      const lot = await this.lotService.update(id, req.body);
      res.json({ data: lot });
    } catch (error) {
      if ((error as Error).message === 'Lot not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update lot', details: (error as Error).message });
    }
  }

  /**
   * PATCH /api/v1/lots/:id/quality-status
   * Update lot quality status
   */
  async updateQualityStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid lot ID format' });
        return;
      }

      if (!status || !Object.values(LotQualityStatus).includes(status)) {
        res.status(400).json({ error: 'Valid quality status is required' });
        return;
      }

      const lot = await this.lotService.updateQualityStatus(id, status);
      res.json({ data: lot });
    } catch (error) {
      if ((error as Error).message === 'Lot not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update quality status', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/lots/:id/traceability
   * Get traceability history
   */
  async getTraceability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid lot ID format' });
        return;
      }

      const history = await this.lotService.getTraceabilityHistory(id);
      res.json({ data: history });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch traceability', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/lots/expiring
   * Get expiring lots
   */
  async getExpiring(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const lots = await this.lotService.getExpiringLots(days);
      res.json({ data: lots });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expiring lots', details: (error as Error).message });
    }
  }
}
