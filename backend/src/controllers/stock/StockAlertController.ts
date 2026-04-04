import { Request, Response } from 'express';
import { StockAlertService } from '../../services/stock/StockAlertService';
import { isValidUUID } from '../../utils/validators';

export class StockAlertController {
  private alertService: StockAlertService;

  constructor() {
    this.alertService = new StockAlertService();
  }

  /**
   * GET /api/v1/stock-alerts
   * List all stock alerts
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const isTriggered = req.query.isTriggered !== undefined ? req.query.isTriggered === 'true' : undefined;

      const alerts = await this.alertService.findAll(isActive, isTriggered);
      res.json({ data: alerts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/stock-alerts/:id
   * Get alert by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid alert ID format' });
        return;
      }

      const alert = await this.alertService.findById(id);

      if (!alert) {
        res.status(404).json({ error: 'Stock alert not found' });
        return;
      }

      res.json({ data: alert });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alert', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/stock-alerts
   * Create new stock alert
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, warehouseId, minimumThreshold, maximumThreshold, reorderPoint, emailRecipients } = req.body;

      // Validation
      if (!profileId || !isValidUUID(profileId)) {
        res.status(400).json({ error: 'Valid profile ID is required' });
        return;
      }

      if (!minimumThreshold || minimumThreshold < 0) {
        res.status(400).json({ error: 'Minimum threshold is required and must be non-negative' });
        return;
      }

      const alert = await this.alertService.create({
        profileId,
        warehouseId,
        minimumThreshold,
        maximumThreshold,
        reorderPoint,
        emailRecipients,
      });

      res.status(201).json({ data: alert });
    } catch (error) {
      res.status(400).json({ error: 'Failed to create alert', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/stock-alerts/:id
   * Update stock alert
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid alert ID format' });
        return;
      }

      const alert = await this.alertService.update(id, req.body);
      res.json({ data: alert });
    } catch (error) {
      if ((error as Error).message === 'Stock alert not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update alert', details: (error as Error).message });
    }
  }

  /**
   * DELETE /api/v1/stock-alerts/:id
   * Deactivate alert
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid alert ID format' });
        return;
      }

      await this.alertService.deactivate(id);
      res.status(204).send();
    } catch (error) {
      if ((error as Error).message === 'Stock alert not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to deactivate alert', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/stock-alerts/:id/acknowledge
   * Acknowledge an alert
   */
  async acknowledge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid alert ID format' });
        return;
      }

      const alert = await this.alertService.acknowledge(id, userId);
      res.json({ data: alert });
    } catch (error) {
      if ((error as Error).message === 'Stock alert not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to acknowledge alert', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/stock-alerts/check
   * Manually trigger alert check
   */
  async checkAlerts(req: Request, res: Response): Promise<void> {
    try {
      const triggeredAlerts = await this.alertService.checkAlerts();
      res.json({ data: { checked: true, triggeredCount: triggeredAlerts.length, alerts: triggeredAlerts } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check alerts', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/stock-alerts/active
   * Get all active (triggered) alerts
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.alertService.getActiveAlerts();
      res.json({ data: alerts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active alerts', details: (error as Error).message });
    }
  }
}
