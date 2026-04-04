import { Request, Response } from 'express';
import { MaintenancePlanService } from '../../services/maintenance/MaintenancePlanService';
import { MaintenanceFrequency } from '../../models/maintenance/MaintenancePlan';
import { isValidUUID } from '../../utils/validators';

export class MaintenancePlanController {
  private maintenancePlanService: MaintenancePlanService;

  constructor() {
    this.maintenancePlanService = new MaintenancePlanService();
  }

  /**
   * GET /api/v1/maintenance/plans
   * List all maintenance plans with optional filtering
   */
  async listPlans(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        machineId: req.query.machineId as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        upcoming: req.query.upcoming === 'true',
      };

      const plans = await this.maintenancePlanService.findAll(filters);
      res.json({ data: plans });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch maintenance plans', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/plans/due
   * Get plans due within days
   */
  async listDuePlans(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const plans = await this.maintenancePlanService.findDueWithinDays(days);
      res.json({ data: plans });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch due plans', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/plans/:id
   * Get maintenance plan by ID
   */
  async getPlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid plan ID format' });
        return;
      }

      const plan = await this.maintenancePlanService.findById(id);

      if (!plan) {
        res.status(404).json({ error: 'Maintenance plan not found' });
        return;
      }

      res.json({ data: plan });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch maintenance plan', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/plans
   * Create new maintenance plan
   */
  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const { machineId, description, taskType, frequency, frequencyDays, estimatedDurationHours, nextDueDate, assignedTechnicianId } = req.body;

      // Basic validation
      if (!machineId || !isValidUUID(machineId)) {
        res.status(400).json({ error: 'Valid machine ID is required' });
        return;
      }

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json({ error: 'Description is required and must be a non-empty string' });
        return;
      }

      if (!taskType || typeof taskType !== 'string' || taskType.trim().length === 0) {
        res.status(400).json({ error: 'Task type is required and must be a non-empty string' });
        return;
      }

      if (!frequency || !Object.values(MaintenanceFrequency).includes(frequency)) {
        res.status(400).json({ error: `Frequency must be one of: ${Object.values(MaintenanceFrequency).join(', ')}` });
        return;
      }

      const plan = await this.maintenancePlanService.create({
        machineId,
        description,
        taskType,
        frequency,
        frequencyDays,
        estimatedDurationHours,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        assignedTechnicianId,
      });

      res.status(201).json({ data: plan });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create maintenance plan', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/maintenance/plans/:id
   * Update maintenance plan
   */
  async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid plan ID format' });
        return;
      }

      const plan = await this.maintenancePlanService.update(id, req.body);
      res.json({ data: plan });
    } catch (error) {
      if ((error as Error).message === 'Maintenance plan not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update maintenance plan', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/plans/:id/deactivate
   * Deactivate maintenance plan
   */
  async deactivatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid plan ID format' });
        return;
      }

      const plan = await this.maintenancePlanService.deactivate(id);
      res.json({ data: plan });
    } catch (error) {
      if ((error as Error).message === 'Maintenance plan not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to deactivate maintenance plan', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/plans/:id/reactivate
   * Reactivate maintenance plan
   */
  async reactivatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid plan ID format' });
        return;
      }

      const plan = await this.maintenancePlanService.reactivate(id);
      res.json({ data: plan });
    } catch (error) {
      if ((error as Error).message === 'Maintenance plan not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to reactivate maintenance plan', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/plans/:id/complete
   * Complete a maintenance task and schedule next
   */
  async completeAndScheduleNext(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { completedDate } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid plan ID format' });
        return;
      }

      const completed = completedDate ? new Date(completedDate) : new Date();
      const plan = await this.maintenancePlanService.completeAndScheduleNext(id, completed);
      res.json({ data: plan });
    } catch (error) {
      if ((error as Error).message === 'Maintenance plan not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to complete and schedule next', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/plans/generate-work-orders
   * Generate work orders for all due plans
   */
  async generateWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const workOrders = await this.maintenancePlanService.generateDueWorkOrders();
      res.json({ 
        message: `${workOrders.length} work orders generated`,
        data: workOrders 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate work orders', details: (error as Error).message });
    }
  }
}
