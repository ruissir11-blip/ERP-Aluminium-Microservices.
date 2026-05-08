import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { WorkOrder, WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '../../models/maintenance/WorkOrder';
import { WorkOrderPart } from '../../models/maintenance/WorkOrderPart';
import { BreakdownRecord, BreakdownSeverity } from '../../models/maintenance/BreakdownRecord';
import { Machine, MachineStatus } from '../../models/maintenance/Machine';

export interface CreateWorkOrderInput {
  machineId: string;
  type: WorkOrderType;
  priority?: WorkOrderPriority;
  title: string;
  description?: string;
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  assignedTo?: string;
  createdBy?: string;
}                         

export interface UpdateWorkOrderInput {
  priority?: WorkOrderPriority;
  title?: string;
  description?: string;
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  assignedTo?: string;
  status?: WorkOrderStatus;
}

export interface CompleteWorkOrderInput {
  laborHours?: number;
  laborRate?: number;
  parts?: {
    partId?: string;
    partReference: string;
    partName: string;
    quantity: number;
    unitCost?: number;
  }[];
  completionNotes?: string;
}

export interface ReportBreakdownInput {
  machineId: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  title: string;
  description?: string;
  severity: BreakdownSeverity;
  symptoms?: string;
}

export interface WorkOrderFilters {
  machineId?: string;
  status?: WorkOrderStatus;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  assignedTo?: string;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
}

export class WorkOrderService {
  private workOrderRepository: Repository<WorkOrder>;
  private workOrderPartRepository: Repository<WorkOrderPart>;
  private breakdownRepository: Repository<BreakdownRecord>;
  private machineRepository: Repository<Machine>;

  constructor() {
    this.workOrderRepository = AppDataSource.getRepository(WorkOrder);
    this.workOrderPartRepository = AppDataSource.getRepository(WorkOrderPart);
    this.breakdownRepository = AppDataSource.getRepository(BreakdownRecord);
    this.machineRepository = AppDataSource.getRepository(Machine);
  }

  /**
   * Get all work orders with optional filtering
   */
  async findAll(filters: WorkOrderFilters = {}): Promise<WorkOrder[]> {
    const query = this.workOrderRepository.createQueryBuilder('wo')
      .leftJoinAndSelect('wo.machine', 'machine')
      .leftJoinAndSelect('wo.parts', 'parts');

    if (filters.machineId) {
      query.andWhere('wo.machineId = :machineId', { machineId: filters.machineId });
    }

    if (filters.status) {
      query.andWhere('wo.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query.andWhere('wo.type = :type', { type: filters.type });
    }

    if (filters.priority) {
      query.andWhere('wo.priority = :priority', { priority: filters.priority });
    }

    if (filters.assignedTo) {
      query.andWhere('wo.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    if (filters.scheduledDateFrom) {
      query.andWhere('wo.scheduledDate >= :dateFrom', { dateFrom: filters.scheduledDateFrom });
    }

    if (filters.scheduledDateTo) {
      query.andWhere('wo.scheduledDate <= :dateTo', { dateTo: filters.scheduledDateTo });
    }

    return query.orderBy('wo.scheduledDate', 'ASC').getMany();
  }

  /**
   * Get work order by ID
   */
  async findById(id: string): Promise<WorkOrder | null> {
    return this.workOrderRepository.findOne({
      where: { id },
      relations: ['machine', 'parts', 'breakdownRecords'],
    });
  }

  /**
   * Get work order by number
   */
  async findByNumber(workOrderNumber: string): Promise<WorkOrder | null> {
    return this.workOrderRepository.findOneBy({ workOrderNumber });
  }

  /**
   * Create new work order
   */
  async create(input: CreateWorkOrderInput): Promise<WorkOrder> {
    // Verify machine exists
    const machine = await this.machineRepository.findOneBy({ id: input.machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Generate work order number
    const woNumber = await this.generateWorkOrderNumber();

    const workOrder = this.workOrderRepository.create({
      workOrderNumber: woNumber,
      machineId: input.machineId,
      type: input.type,
      priority: input.priority || WorkOrderPriority.ROUTINE,
      title: input.title,
      description: input.description,
      scheduledDate: input.scheduledDate,
      scheduledStartTime: input.scheduledStartTime,
      scheduledEndTime: input.scheduledEndTime,
      assignedTo: input.assignedTo,
      createdBy: input.createdBy,
      status: WorkOrderStatus.CREATED,
    });

    return this.workOrderRepository.save(workOrder);
  }

  /**
   * Update existing work order
   */
  async update(id: string, input: UpdateWorkOrderInput): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    Object.assign(workOrder, input);
    return this.workOrderRepository.save(workOrder);
  }

  /**
   * Assign work order to technician
   */
  async assign(id: string, assignedTo: string): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    workOrder.assignedTo = assignedTo;
    workOrder.status = WorkOrderStatus.ASSIGNED;
    return this.workOrderRepository.save(workOrder);
  }

  /**
   * Start work on work order
   */
  async startWork(id: string): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== WorkOrderStatus.ASSIGNED && workOrder.status !== WorkOrderStatus.CREATED) {
      throw new Error('Work order must be in ASSIGNED or CREATED status to start');
    }

    workOrder.status = WorkOrderStatus.IN_PROGRESS;
    workOrder.actualStartDatetime = new Date();
    return this.workOrderRepository.save(workOrder);
  }

  /**
   * Complete work order
   */
  async complete(id: string, input: CompleteWorkOrderInput): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Work order must be IN_PROGRESS to complete');
    }

    // Calculate labor cost
    let laborCost = 0;
    if (input.laborHours && input.laborRate) {
      laborCost = input.laborHours * input.laborRate;
      workOrder.laborHours = input.laborHours;
      workOrder.laborRate = input.laborRate;
      workOrder.laborCost = laborCost;
    }

    // Add parts
    let partsCost = 0;
    if (input.parts && input.parts.length > 0) {
      for (const part of input.parts) {
        const partCost = part.quantity * (part.unitCost || 0);
        partsCost += partCost;

        const workOrderPart = this.workOrderPartRepository.create({
          workOrderId: id,
          partId: part.partId,
          partReference: part.partReference,
          partName: part.partName,
          quantity: part.quantity,
          unitCost: part.unitCost,
          totalCost: partCost,
        });
        await this.workOrderPartRepository.save(workOrderPart);
      }
    }

    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.actualEndDatetime = new Date();
    workOrder.partsCost = partsCost;
    workOrder.totalCost = laborCost + partsCost;
    workOrder.completionNotes = input.completionNotes;
    workOrder.closedAt = new Date();

    const savedWorkOrder = await this.workOrderRepository.save(workOrder);

    // Update machine status if it was broken down
    if (workOrder.type === WorkOrderType.CORRECTIVE) {
      const machine = await this.machineRepository.findOneBy({ id: workOrder.machineId });
      if (machine && machine.status === MachineStatus.BROKEN_DOWN) {
        machine.status = MachineStatus.ACTIVE;
        await this.machineRepository.save(machine);
      }
    }

    return savedWorkOrder;
  }

  /**
   * Close work order (after completion)
   */
  async close(id: string): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== WorkOrderStatus.COMPLETED) {
      throw new Error('Work order must be COMPLETED to close');
    }

    workOrder.status = WorkOrderStatus.CLOSED;
    workOrder.closedAt = new Date();
    return this.workOrderRepository.save(workOrder);
  }

  /**
   * Cancel work order
   */
  async cancel(id: string): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CLOSED) {
      throw new Error('Cannot cancel a completed or closed work order');
    }

    workOrder.status = WorkOrderStatus.CANCELLED;
    workOrder.closedAt = new Date();
    return this.workOrderRepository.save(workOrder);
  }

  /**
   * Report breakdown (creates corrective work order + breakdown record)
   */
  async reportBreakdown(input: ReportBreakdownInput): Promise<WorkOrder> {
    // Update machine status
    const machine = await this.machineRepository.findOneBy({ id: input.machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    machine.status = MachineStatus.BROKEN_DOWN;
    await this.machineRepository.save(machine);

    // Create work order
    const workOrder = await this.create({
      machineId: input.machineId,
      type: input.type,
      priority: input.priority,
      title: input.title,
      description: input.description,
    });

    // Create breakdown record
    const breakdown = this.breakdownRepository.create({
      workOrderId: workOrder.id,
      machineId: input.machineId,
      reportedAt: new Date(),
      severity: input.severity,
      symptoms: input.symptoms,
    });
    await this.breakdownRepository.save(breakdown);

    return workOrder;
  }

  /**
   * Acknowledge breakdown
   */
  async acknowledgeBreakdown(workOrderId: string): Promise<BreakdownRecord> {
    const breakdown = await this.breakdownRepository.findOne({
      where: { workOrderId },
    });

    if (!breakdown) {
      throw new Error('Breakdown record not found');
    }

    breakdown.acknowledgedAt = new Date();
    const responseTime = Math.round(
      (breakdown.acknowledgedAt.getTime() - breakdown.reportedAt.getTime()) / (1000 * 60)
    );
    breakdown.responseTimeMinutes = responseTime;

    return this.breakdownRepository.save(breakdown);
  }

  /**
   * Get work orders by status
   */
  async findByStatus(status: WorkOrderStatus): Promise<WorkOrder[]> {
    return this.workOrderRepository.find({
      where: { status },
      relations: ['machine'],
      order: { priority: 'ASC', scheduledDate: 'ASC' },
    });
  }

  /**
   * Get overdue work orders
   */
  async findOverdue(): Promise<WorkOrder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.machine', 'machine')
      .where('wo.scheduledDate < :today', { today })
      .andWhere('wo.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED],
      })
      .orderBy('wo.scheduledDate', 'ASC')
      .getMany();
  }

  /**
   * Get work orders for a specific technician
   */
  async findByTechnician(userId: string): Promise<WorkOrder[]> {
    return this.workOrderRepository.find({
      where: { assignedTo: userId },
      relations: ['machine'],
      order: { priority: 'ASC', scheduledDate: 'ASC' },
    });
  }

  /**
   * Generate unique work order number
   */
  private async generateWorkOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WO-${year}`;

    const lastWO = await this.workOrderRepository
      .createQueryBuilder('wo')
      .where('wo.workOrderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('wo.workOrderNumber', 'DESC')
      .getOne();

    let nextNum = 1;
    if (lastWO) {
      const parts = lastWO.workOrderNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
  }
}
