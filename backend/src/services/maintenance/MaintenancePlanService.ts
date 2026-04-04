import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { MaintenancePlan, MaintenanceFrequency } from '../../models/maintenance/MaintenancePlan';
import { WorkOrder, WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '../../models/maintenance/WorkOrder';
import { Machine } from '../../models/maintenance/Machine';

export interface CreateMaintenancePlanInput {
  machineId: string;
  description: string;
  taskType: string;
  frequency: MaintenanceFrequency;
  frequencyDays?: number;
  estimatedDurationHours?: number;
  nextDueDate?: Date;
  assignedTechnicianId?: string;
}

export interface UpdateMaintenancePlanInput extends Partial<CreateMaintenancePlanInput> {
  isActive?: boolean;
}

export interface MaintenancePlanFilters {
  machineId?: string;
  isActive?: boolean;
  upcoming?: boolean;
}

export class MaintenancePlanService {
  private planRepository: Repository<MaintenancePlan>;
  private workOrderRepository: Repository<WorkOrder>;
  private machineRepository: Repository<Machine>;

  constructor() {
    this.planRepository = AppDataSource.getRepository(MaintenancePlan);
    this.workOrderRepository = AppDataSource.getRepository(WorkOrder);
    this.machineRepository = AppDataSource.getRepository(Machine);
  }

  /**
   * Get all maintenance plans with optional filtering
   */
  async findAll(filters: MaintenancePlanFilters = {}): Promise<MaintenancePlan[]> {
    const query = this.planRepository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.machine', 'machine');

    if (filters.machineId) {
      query.andWhere('plan.machineId = :machineId', { machineId: filters.machineId });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('plan.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.upcoming) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      query.andWhere('plan.nextDueDate <= :futureDate', { futureDate });
      query.andWhere('plan.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('plan.nextDueDate', 'ASC').getMany();
  }

  /**
   * Get maintenance plan by ID
   */
  async findById(id: string): Promise<MaintenancePlan | null> {
    return this.planRepository.findOne({
      where: { id },
      relations: ['machine'],
    });
  }

  /**
   * Create new maintenance plan
   */
  async create(input: CreateMaintenancePlanInput): Promise<MaintenancePlan> {
    // Verify machine exists
    const machine = await this.machineRepository.findOneBy({ id: input.machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Calculate next due date if not provided
    let nextDueDate = input.nextDueDate;
    if (!nextDueDate) {
      nextDueDate = this.calculateNextDueDate(input.frequency, input.frequencyDays);
    }

    const plan = this.planRepository.create({
      ...input,
      nextDueDate,
      isActive: true,
    });

    return this.planRepository.save(plan);
  }

  /**
   * Update existing maintenance plan
   */
  async update(id: string, input: UpdateMaintenancePlanInput): Promise<MaintenancePlan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new Error('Maintenance plan not found');
    }

    Object.assign(plan, input);
    return this.planRepository.save(plan);
  }

  /**
   * Deactivate maintenance plan
   */
  async deactivate(id: string): Promise<MaintenancePlan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new Error('Maintenance plan not found');
    }

    plan.isActive = false;
    return this.planRepository.save(plan);
  }

  /**
   * Reactivate maintenance plan
   */
  async reactivate(id: string): Promise<MaintenancePlan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new Error('Maintenance plan not found');
    }

    plan.isActive = true;
    if (!plan.nextDueDate) {
      plan.nextDueDate = this.calculateNextDueDate(plan.frequency, plan.frequencyDays);
    }

    return this.planRepository.save(plan);
  }

  /**
   * Complete a maintenance task and schedule next occurrence
   */
  async completeAndScheduleNext(planId: string, completedDate: Date): Promise<MaintenancePlan> {
    const plan = await this.findById(planId);
    if (!plan) {
      throw new Error('Maintenance plan not found');
    }

    plan.lastCompletedDate = completedDate;
    plan.nextDueDate = this.calculateNextDueDate(plan.frequency, plan.frequencyDays, completedDate);

    return this.planRepository.save(plan);
  }

  /**
   * Generate work orders for all due maintenance plans
   */
  async generateDueWorkOrders(): Promise<WorkOrder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const duePlans = await this.planRepository.find({
      where: {
        isActive: true,
      },
      relations: ['machine'],
    });

    const createdWorkOrders: WorkOrder[] = [];

    for (const plan of duePlans) {
      if (plan.nextDueDate && plan.nextDueDate <= today) {
        // Check if a work order already exists for this plan on this due date
        const existingWO = await this.workOrderRepository.findOne({
          where: {
            maintenancePlanId: plan.id,
            scheduledDate: plan.nextDueDate,
          },
        });

        if (!existingWO) {
          // Generate work order number
          const woNumber = await this.generateWorkOrderNumber();

          const workOrder = this.workOrderRepository.create({
            workOrderNumber: woNumber,
            machineId: plan.machineId,
            maintenancePlanId: plan.id,
            type: WorkOrderType.PREVENTIVE,
            status: WorkOrderStatus.CREATED,
            priority: WorkOrderPriority.ROUTINE,
            title: `Preventive: ${plan.taskType}`,
            description: plan.description,
            scheduledDate: plan.nextDueDate,
          });

          const savedWO = await this.workOrderRepository.save(workOrder);
          createdWorkOrders.push(savedWO);

          // Update plan with next due date
          await this.completeAndScheduleNext(plan.id, today);
        }
      }
    }

    return createdWorkOrders;
  }

  /**
   * Get plans due within a number of days
   */
  async findDueWithinDays(days: number): Promise<MaintenancePlan[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.planRepository.find({
      where: {
        isActive: true,
      },
      relations: ['machine'],
    });
  }

  /**
   * Calculate next due date based on frequency
   */
  private calculateNextDueDate(
    frequency: MaintenanceFrequency,
    frequencyDays?: number,
    startDate: Date = new Date()
  ): Date {
    const nextDate = new Date(startDate);

    switch (frequency) {
      case MaintenanceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case MaintenanceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case MaintenanceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case MaintenanceFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case MaintenanceFrequency.SEMI_ANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case MaintenanceFrequency.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        if (frequencyDays) {
          nextDate.setDate(nextDate.getDate() + frequencyDays);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
    }

    return nextDate;
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
      const lastNum = parseInt(lastWO.workOrderNumber.split('-')[2] || '0', 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
  }
}
