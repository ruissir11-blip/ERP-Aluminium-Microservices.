import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Machine } from '../../models/maintenance/Machine';
import { WorkOrder, WorkOrderType, WorkOrderStatus } from '../../models/maintenance/WorkOrder';
import { BreakdownRecord } from '../../models/maintenance/BreakdownRecord';

export interface TRSMetrics {
  machineId: string;
  machineName: string;
  availability: number;
  performance: number;
  quality: number;
  trs: number;
  period: string;
  plannedProductionTime: number;
  operatingTime: number;
  downtime: number;
  idealCycleTime?: number;
  totalPieces?: number;
  goodPieces?: number;
}

export interface MTBFMetrics {
  machineId: string;
  machineName: string;
  mtbf: number;
  totalOperatingTime: number;
  numberOfBreakdowns: number;
  period: string;
}

export interface MTTRMetrics {
  machineId: string;
  machineName: string;
  mttr: number;
  totalRepairTime: number;
  numberOfRepairs: number;
  period: string;
}

export interface MaintenanceKPIs {
  machineId: string;
  machineName: string;
  trs: TRSMetrics | null;
  mtbf: MTBFMetrics | null;
  mttr: MTTRMetrics | null;
  totalWorkOrders: number;
  preventiveWorkOrders: number;
  correctiveWorkOrders: number;
  totalMaintenanceCost: number;
  averageResolutionTime: number;
  period: string;
}

export interface MaintenanceCostReport {
  machineId: string;
  machineName: string;
  totalLaborCost: number;
  totalPartsCost: number;
  totalCost: number;
  laborHours: number;
  costPerOperatingHour: number;
  period: string;
}

export interface PreventiveCorrectiveRatio {
  preventive: number;
  corrective: number;
  improvement: number;
  inspection: number;
  total: number;
  ratio: string;
}

export class MetricsService {
  private machineRepository: Repository<Machine>;
  private workOrderRepository: Repository<WorkOrder>;
  private breakdownRepository: Repository<BreakdownRecord>;

  constructor() {
    this.machineRepository = AppDataSource.getRepository(Machine);
    this.workOrderRepository = AppDataSource.getRepository(WorkOrder);
    this.breakdownRepository = AppDataSource.getRepository(BreakdownRecord);
  }

  /**
   * Calculate TRS (Taux de Rendement Synthétique / Overall Equipment Effectiveness)
   * TRS = Availability × Performance × Quality
   * - Availability = Operating Time / Planned Production Time
   * - Performance = (Ideal Cycle Time × Total Pieces) / Operating Time
   * - Quality = Good Pieces / Total Pieces
   */
  async calculateTRS(
    machineId: string,
    startDate: Date,
    endDate: Date,
    plannedProductionTime: number = 480, // Default 8 hours in minutes
    idealCycleTime?: number,
    totalPieces?: number,
    goodPieces?: number
  ): Promise<TRSMetrics | null> {
    const machine = await this.machineRepository.findOneBy({ id: machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Calculate downtime from corrective work orders
    const correctiveWOs = await this.workOrderRepository.find({
      where: {
        machineId,
        type: WorkOrderType.CORRECTIVE,
        status: WorkOrderStatus.COMPLETED,
      },
    });

    let totalDowntime = 0;
    for (const wo of correctiveWOs) {
      if (wo.actualStartDatetime && wo.actualEndDatetime) {
        const start = new Date(wo.actualStartDatetime);
        const end = new Date(wo.actualEndDatetime);
        if (start >= startDate && end <= endDate) {
          totalDowntime += (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
        }
      }
    }

    const operatingTime = plannedProductionTime - totalDowntime;
    const availability = operatingTime / plannedProductionTime;

    // Performance calculation (if data provided)
    let performance = 1;
    if (idealCycleTime && totalPieces && operatingTime > 0) {
      performance = (idealCycleTime * totalPieces) / operatingTime;
    }

    // Quality calculation (if data provided)
    let quality = 1;
    if (totalPieces && goodPieces) {
      quality = goodPieces / totalPieces;
    }

    const trs = availability * performance * quality;

    return {
      machineId,
      machineName: machine.designation,
      availability: Math.round(availability * 10000) / 100,
      performance: Math.round(performance * 10000) / 100,
      quality: Math.round(quality * 10000) / 100,
      trs: Math.round(trs * 10000) / 100,
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      plannedProductionTime,
      operatingTime: Math.round(operatingTime),
      downtime: Math.round(totalDowntime),
      idealCycleTime,
      totalPieces,
      goodPieces,
    };
  }

  /**
   * Calculate MTBF (Mean Time Between Failures)
   * MTBF = Total Operating Time / Number of Breakdowns
   */
  async calculateMTBF(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MTBFMetrics | null> {
    const machine = await this.machineRepository.findOneBy({ id: machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    const breakdowns = await this.breakdownRepository
      .createQueryBuilder('br')
      .where('br.machineId = :machineId', { machineId })
      .andWhere('br.reportedAt >= :startDate', { startDate })
      .andWhere('br.reportedAt <= :endDate', { endDate })
      .getMany();

    const numberOfBreakdowns = breakdowns.length;

    if (numberOfBreakdowns === 0) {
      return {
        machineId,
        machineName: machine.designation,
        mtbf: 0,
        totalOperatingTime: 0,
        numberOfBreakdowns: 0,
        period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      };
    }

    // Calculate total operating time (simplified - in real scenario, would use machine operational hours)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const operatingHoursPerDay = 8; // Assuming 8-hour shifts
    const totalOperatingTime = days * operatingHoursPerDay * 60; // Convert to minutes

    const mtbf = totalOperatingTime / numberOfBreakdowns;

    return {
      machineId,
      machineName: machine.designation,
      mtbf: Math.round(mtbf),
      totalOperatingTime,
      numberOfBreakdowns,
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Calculate MTTR (Mean Time To Repair)
   * MTTR = Total Repair Time / Number of Repairs
   */
  async calculateMTTR(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MTTRMetrics | null> {
    const machine = await this.machineRepository.findOneBy({ id: machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    const breakdowns = await this.breakdownRepository
      .createQueryBuilder('br')
      .where('br.machineId = :machineId', { machineId })
      .andWhere('br.reportedAt >= :startDate', { startDate })
      .andWhere('br.reportedAt <= :endDate', { endDate })
      .getMany();

    let totalRepairTime = 0;
    let numberOfRepairs = 0;

    for (const br of breakdowns) {
      if (br.repairTimeMinutes) {
        totalRepairTime += br.repairTimeMinutes;
        numberOfRepairs++;
      }
    }

    if (numberOfRepairs === 0) {
      return {
        machineId,
        machineName: machine.designation,
        mttr: 0,
        totalRepairTime: 0,
        numberOfRepairs: 0,
        period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      };
    }

    const mttr = totalRepairTime / numberOfRepairs;

    return {
      machineId,
      machineName: machine.designation,
      mttr: Math.round(mttr),
      totalRepairTime,
      numberOfRepairs,
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Get comprehensive maintenance KPIs for a machine
   */
  async getMaintenanceKPIs(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MaintenanceKPIs | null> {
    const machine = await this.machineRepository.findOneBy({ id: machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Get work orders in period
    const workOrders = await this.workOrderRepository.find({
      where: {
        machineId,
      },
    });

    const completedWOs = workOrders.filter(
      (wo) => wo.status === WorkOrderStatus.COMPLETED && 
              wo.actualEndDatetime && 
              wo.actualEndDatetime >= startDate && 
              wo.actualEndDatetime <= endDate
    );

    const preventiveWOs = completedWOs.filter((wo) => wo.type === WorkOrderType.PREVENTIVE);
    const correctiveWOs = completedWOs.filter((wo) => wo.type === WorkOrderType.CORRECTIVE);

    // Calculate total cost
    let totalLaborCost = 0;
    let totalPartsCost = 0;
    let totalResolutionTime = 0;

    for (const wo of completedWOs) {
      if (wo.laborCost) totalLaborCost += Number(wo.laborCost);
      if (wo.partsCost) totalPartsCost += Number(wo.partsCost);
      
      if (wo.actualStartDatetime && wo.actualEndDatetime) {
        totalResolutionTime += (new Date(wo.actualEndDatetime).getTime() - new Date(wo.actualStartDatetime).getTime()) / (1000 * 60);
      }
    }

    const totalMaintenanceCost = totalLaborCost + totalPartsCost;
    const averageResolutionTime = completedWOs.length > 0 
      ? totalResolutionTime / completedWOs.length 
      : 0;

    // Get metrics
    const trs = await this.calculateTRS(machineId, startDate, endDate);
    const mtbf = await this.calculateMTBF(machineId, startDate, endDate);
    const mttr = await this.calculateMTTR(machineId, startDate, endDate);

    return {
      machineId,
      machineName: machine.designation,
      trs,
      mtbf,
      mttr,
      totalWorkOrders: completedWOs.length,
      preventiveWorkOrders: preventiveWOs.length,
      correctiveWorkOrders: correctiveWOs.length,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      averageResolutionTime: Math.round(averageResolutionTime),
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Get maintenance cost report
   */
  async getMaintenanceCostReport(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MaintenanceCostReport | null> {
    const machine = await this.machineRepository.findOneBy({ id: machineId });
    if (!machine) {
      throw new Error('Machine not found');
    }

    const completedWOs = await this.workOrderRepository
      .createQueryBuilder('wo')
      .where('wo.machineId = :machineId', { machineId })
      .andWhere('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
      .andWhere('wo.closedAt >= :startDate', { startDate })
      .andWhere('wo.closedAt <= :endDate', { endDate })
      .getMany();

    let totalLaborCost = 0;
    let totalPartsCost = 0;
    let totalLaborHours = 0;

    for (const wo of completedWOs) {
      if (wo.laborCost) totalLaborCost += Number(wo.laborCost);
      if (wo.partsCost) totalPartsCost += Number(wo.partsCost);
      if (wo.laborHours) totalLaborHours += Number(wo.laborHours);
    }

    const totalCost = totalLaborCost + totalPartsCost;
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const operatingHours = days * 8; // Assuming 8 hours per day
    const costPerOperatingHour = operatingHours > 0 ? totalCost / operatingHours : 0;

    return {
      machineId,
      machineName: machine.designation,
      totalLaborCost: Math.round(totalLaborCost * 100) / 100,
      totalPartsCost: Math.round(totalPartsCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      laborHours: Math.round(totalLaborHours * 100) / 100,
      costPerOperatingHour: Math.round(costPerOperatingHour * 100) / 100,
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * Get preventive vs corrective ratio
   */
  async getPreventiveCorrectiveRatio(startDate: Date, endDate: Date): Promise<PreventiveCorrectiveRatio> {
    const completedWOs = await this.workOrderRepository
      .createQueryBuilder('wo')
      .where('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
      .andWhere('wo.closedAt >= :startDate', { startDate })
      .andWhere('wo.closedAt <= :endDate', { endDate })
      .getMany();

    const preventive = completedWOs.filter((wo) => wo.type === WorkOrderType.PREVENTIVE).length;
    const corrective = completedWOs.filter((wo) => wo.type === WorkOrderType.CORRECTIVE).length;
    const improvement = completedWOs.filter((wo) => wo.type === WorkOrderType.IMPROVEMENT).length;
    const inspection = completedWOs.filter((wo) => wo.type === WorkOrderType.INSPECTION).length;
    const total = completedWOs.length;

    const ratio = corrective > 0 ? `${(preventive / corrective).toFixed(2)}:1` : 'N/A';

    return {
      preventive,
      corrective,
      improvement,
      inspection,
      total,
      ratio,
    };
  }

  /**
   * Get all machine metrics summary
   */
  async getAllMachineMetrics(startDate: Date, endDate: Date): Promise<MaintenanceKPIs[]> {
    const machines = await this.machineRepository.find({
      where: { status: 'ACTIVE' as any }, // Using string since enum might not be imported
    });

    const metrics: MaintenanceKPIs[] = [];

    for (const machine of machines) {
      const kpis = await this.getMaintenanceKPIs(machine.id, startDate, endDate);
      if (kpis) {
        metrics.push(kpis);
      }
    }

    return metrics;
  }
}
