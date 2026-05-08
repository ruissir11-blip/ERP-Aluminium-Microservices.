import { Request, Response } from 'express';
import { WorkOrderService } from '../../services/maintenance/WorkOrderService';
import { WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '../../models/maintenance/WorkOrder';
import { BreakdownSeverity } from '../../models/maintenance/BreakdownRecord';
import { isValidUUID } from '../../utils/validators';

export class WorkOrderController {
  private workOrderService: WorkOrderService;

  constructor() {
    this.workOrderService = new WorkOrderService();
  }

  /**
   * GET /api/v1/maintenance/work-orders
   * List all work orders with optional filtering
   */
  async listWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        machineId: req.query.machineId as string,
        status: req.query.status as WorkOrderStatus,
        type: req.query.type as WorkOrderType,
        priority: req.query.priority as WorkOrderPriority,
        assignedTo: req.query.assignedTo as string,
        scheduledDateFrom: req.query.scheduledDateFrom ? new Date(req.query.scheduledDateFrom as string) : undefined,
        scheduledDateTo: req.query.scheduledDateTo ? new Date(req.query.scheduledDateTo as string) : undefined,
      };

      const workOrders = await this.workOrderService.findAll(filters);
      res.json({ data: workOrders });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch work orders', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/work-orders/overdue
   * Get overdue work orders
   */
  async listOverdueWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const workOrders = await this.workOrderService.findOverdue();
      res.json({ data: workOrders });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch overdue work orders', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/work-orders/technician/:userId
   * Get work orders for a specific technician
   */
  async listByTechnician(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const workOrders = await this.workOrderService.findByTechnician(userId);
      res.json({ data: workOrders });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch work orders for technician', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/work-orders/:id
   * Get work order by ID
   */
  async getWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const workOrder = await this.workOrderService.findById(id);

      if (!workOrder) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }

      res.json({ data: workOrder });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch work order', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders
   * Create new work order
   */
  async createWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { machineId, type, priority, title, description, scheduledDate, scheduledStartTime, scheduledEndTime, assignedTo, createdBy } = req.body;

      // Basic validation
      if (!machineId || !isValidUUID(machineId)) {
        res.status(400).json({ error: 'Valid machine ID is required' });
        return;
      }

      if (!type || !Object.values(WorkOrderType).includes(type)) {
        res.status(400).json({ error: `Type must be one of: ${Object.values(WorkOrderType).join(', ')}` });
        return;
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title is required and must be a non-empty string' });
        return;
      }

      const workOrder = await this.workOrderService.create({
        machineId,
        type,
        priority,
        title,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledStartTime,
        scheduledEndTime,
        assignedTo,
        createdBy,
      });

      res.status(201).json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create work order', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/maintenance/work-orders/:id
   * Update work order
   */
  async updateWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const workOrder = await this.workOrderService.update(id, req.body);
      res.json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Work order not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update work order', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/:id/assign
   * Assign work order to technician
   */
  async assignWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      if (!assignedTo || !isValidUUID(assignedTo)) {
        res.status(400).json({ error: 'Valid technician ID is required' });
        return;
      }

      const workOrder = await this.workOrderService.assign(id, assignedTo);
      res.json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Work order not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to assign work order', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/:id/start
   * Start work on work order
   */
  async startWork(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const workOrder = await this.workOrderService.startWork(id);
      res.json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Work order not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/:id/complete
   * Complete work order
   */
  async completeWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { laborHours, laborRate, parts, completionNotes } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const workOrder = await this.workOrderService.complete(id, {
        laborHours,
        laborRate,
        parts,
        completionNotes,
      });

      res.json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Work order not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/:id/close
   * Close work order
   */
  async closeWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const workOrder = await this.workOrderService.close(id);
      res.json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Work order not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/:id/cancel
   * Cancel work order
   */
  async cancelWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const workOrder = await this.workOrderService.cancel(id);
      res.json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Work order not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/breakdown
   * Report breakdown
   */
  async reportBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const { machineId, type, priority, title, description, severity, symptoms } = req.body;

      // Basic validation
      if (!machineId || !isValidUUID(machineId)) {
        res.status(400).json({ error: 'Valid machine ID is required' });
        return;
      }

      if (!severity || !Object.values(BreakdownSeverity).includes(severity)) {
        res.status(400).json({ error: `Severity must be one of: ${Object.values(BreakdownSeverity).join(', ')}` });
        return;
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title is required and must be a non-empty string' });
        return;
      }

      const workOrder = await this.workOrderService.reportBreakdown({
        machineId,
        type: type || WorkOrderType.CORRECTIVE,
        priority: priority || WorkOrderPriority.CRITICAL,
        title,
        description,
        severity,
        symptoms,
      });

      res.status(201).json({ data: workOrder });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to report breakdown', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/work-orders/:id/acknowledge
   * Acknowledge breakdown
   */
  async acknowledgeBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid work order ID format' });
        return;
      }

      const breakdown = await this.workOrderService.acknowledgeBreakdown(id);
      res.json({ data: breakdown });
    } catch (error) {
      if ((error as Error).message === 'Breakdown record not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to acknowledge breakdown', details: (error as Error).message });
    }
  }
}
