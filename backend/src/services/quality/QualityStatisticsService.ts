import { AppDataSource } from '../../config/database';
import { NonConformity, NCSeverity, NCStatus } from '../../models/quality/NonConformity';
import { InspectionRecord, InspectionResult, InspectionStatus } from '../../models/quality/InspectionRecord';
import { CorrectiveAction, CorrectiveActionStatus } from '../../models/quality/CorrectiveAction';
import { QualityDecision, DecisionType, DecisionStatus } from '../../models/quality/QualityDecision';
import { Between, In } from 'typeorm';
import { cacheGet, cacheSet, CACHE_TTL } from '../../config/redis';

// Cache helper function
async function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number = CACHE_TTL.MEDIUM): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached) {
    return cached;
  }
  const data = await fetchFn();
  await cacheSet(key, data, ttl);
  return data;
}

export interface NCRateResult {
  totalInspections: number;
  totalNCs: number;
  ncRate: number;
  bySeverity: Record<NCSeverity, number>;
  trend: { date: string; rate: number }[];
}

export interface ParetoItem {
  category: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface QualityKPIs {
  ncRate: number;
  closureRate: number;
  averageClosureTime: number;
  inspectionCompletionRate: number;
  correctiveActionCompletionRate: number;
  decisionApprovalRate: number;
}

export class QualityStatisticsService {
  private ncRepository = AppDataSource.getRepository(NonConformity);
  private inspectionRepository = AppDataSource.getRepository(InspectionRecord);
  private correctiveActionRepository = AppDataSource.getRepository(CorrectiveAction);
  private qualityDecisionRepository = AppDataSource.getRepository(QualityDecision);

  /**
   * Calculate NC rate (number of non-conformities per number of inspections)
   */
  async calculateNCRate(startDate: Date, endDate: Date): Promise<NCRateResult> {
    const [totalInspections, ncRecords] = await Promise.all([
      this.inspectionRepository.count({
        where: {
          created_at: Between(startDate, endDate),
        },
      }),
      this.ncRepository.find({
        where: {
          detected_at: Between(startDate, endDate),
        },
      }),
    ]);

    const totalNCs = ncRecords.length;
    const ncRate = totalInspections > 0 ? (totalNCs / totalInspections) * 100 : 0;

    const bySeverity = {
      [NCSeverity.CRITIQUE]: ncRecords.filter(nc => nc.severity === NCSeverity.CRITIQUE).length,
      [NCSeverity.MAJEUR]: ncRecords.filter(nc => nc.severity === NCSeverity.MAJEUR).length,
      [NCSeverity.MINEUR]: ncRecords.filter(nc => nc.severity === NCSeverity.MINEUR).length,
    };

    // Calculate trend by day
    const trendMap = new Map<string, { inspections: number; ncs: number }>();
    
    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      trendMap.set(dateKey, { inspections: 0, ncs: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count inspections per day
    const inspections = await this.inspectionRepository
      .createQueryBuilder('ir')
      .select('DATE(ir.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('ir.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(ir.created_at)')
      .getRawMany();

    inspections.forEach(insp => {
      const dateKey = insp.date;
      if (trendMap.has(dateKey)) {
        const current = trendMap.get(dateKey)!;
        current.inspections = parseInt(insp.count, 10);
      }
    });

    // Count NCs per day
    const ncByDay = await this.ncRepository
      .createQueryBuilder('nc')
      .select('DATE(nc.detected_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('nc.detected_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(nc.detected_at)')
      .getRawMany();

    ncByDay.forEach(nc => {
      const dateKey = nc.date;
      if (trendMap.has(dateKey)) {
        const current = trendMap.get(dateKey)!;
        current.ncs = parseInt(nc.count, 10);
      }
    });

    const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      rate: data.inspections > 0 ? (data.ncs / data.inspections) * 100 : 0,
    }));

    return {
      totalInspections,
      totalNCs,
      ncRate,
      bySeverity,
      trend,
    };
  }

  /**
   * Pareto analysis by defect type (severity)
   */
  async getParetoByDefectType(startDate: Date, endDate: Date): Promise<ParetoItem[]> {
    const ncRecords = await this.ncRepository.find({
      where: {
        detected_at: Between(startDate, endDate),
      },
    });

    const total = ncRecords.length;
    if (total === 0) return [];

    const severityCounts = {
      [NCSeverity.CRITIQUE]: ncRecords.filter(nc => nc.severity === NCSeverity.CRITIQUE).length,
      [NCSeverity.MAJEUR]: ncRecords.filter(nc => nc.severity === NCSeverity.MAJEUR).length,
      [NCSeverity.MINEUR]: ncRecords.filter(nc => nc.severity === NCSeverity.MINEUR).length,
    };

    const items: ParetoItem[] = [
      { category: 'Critique', count: severityCounts[NCSeverity.CRITIQUE], percentage: 0, cumulativePercentage: 0 },
      { category: 'Majeur', count: severityCounts[NCSeverity.MAJEUR], percentage: 0, cumulativePercentage: 0 },
      { category: 'Mineur', count: severityCounts[NCSeverity.MINEUR], percentage: 0, cumulativePercentage: 0 },
    ].filter(item => item.count > 0);

    // Sort by count descending
    items.sort((a, b) => b.count - a.count);

    // Calculate percentages
    let cumulative = 0;
    items.forEach(item => {
      item.percentage = (item.count / total) * 100;
      cumulative += item.percentage;
      item.cumulativePercentage = cumulative;
    });

    return items;
  }

  /**
   * Pareto analysis by production order
   */
  async getParetoByProductionOrder(startDate: Date, endDate: Date): Promise<ParetoItem[]> {
    const ncRecords = await this.ncRepository
      .createQueryBuilder('nc')
      .select('nc.production_order_id', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('nc.detected_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('nc.production_order_id IS NOT NULL')
      .groupBy('nc.production_order_id')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const total = ncRecords.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
    if (total === 0) return [];

    let cumulative = 0;
    return ncRecords.map(item => {
      const count = parseInt(item.count, 10);
      const percentage = (count / total) * 100;
      cumulative += percentage;
      return {
        category: item.category,
        count,
        percentage,
        cumulativePercentage: cumulative,
      };
    });
  }

  /**
   * Pareto analysis by lot number
   */
  async getParetoByLot(startDate: Date, endDate: Date): Promise<ParetoItem[]> {
    const ncRecords = await this.ncRepository
      .createQueryBuilder('nc')
      .select('nc.lot_number', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('nc.detected_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('nc.lot_number IS NOT NULL')
      .groupBy('nc.lot_number')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const total = ncRecords.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
    if (total === 0) return [];

    let cumulative = 0;
    return ncRecords.map(item => {
      const count = parseInt(item.count, 10);
      const percentage = (count / total) * 100;
      cumulative += percentage;
      return {
        category: item.category,
        count,
        percentage,
        cumulativePercentage: cumulative,
      };
    });
  }

  /**
   * Get comprehensive quality KPIs
   */
  async getQualityKPIs(startDate: Date, endDate: Date): Promise<QualityKPIs> {
    // Create cache key based on date range
    const cacheKey = `quality:kpis:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return getCachedOrFetch(cacheKey, async () => {
      return this.calculateQualityKPIs(startDate, endDate);
    }, CACHE_TTL.SHORT);
  }

  /**
   * Internal method to calculate KPIs without caching
   */
  private async calculateQualityKPIs(startDate: Date, endDate: Date): Promise<QualityKPIs> {
    const [
      totalInspections,
      completedInspections,
      totalNCs,
      closedNCs,
      ncRecords,
      totalCorrectiveActions,
      completedCorrectiveActions,
      totalDecisions,
      approvedDecisions,
    ] = await Promise.all([
      this.inspectionRepository.count({
        where: { created_at: Between(startDate, endDate) },
      }),
      this.inspectionRepository.count({
        where: {
          created_at: Between(startDate, endDate),
          status: In([InspectionStatus.COMPLETED]),
        },
      }),
      this.ncRepository.count({
        where: { detected_at: Between(startDate, endDate) },
      }),
      this.ncRepository.count({
        where: {
          detected_at: Between(startDate, endDate),
          status: NCStatus.CLOTUREE,
        },
      }),
      this.ncRepository.find({
        where: { detected_at: Between(startDate, endDate) },
      }),
      this.correctiveActionRepository.count(),
      this.correctiveActionRepository.count({
        where: { status: In([CorrectiveActionStatus.TERMINE, CorrectiveActionStatus.VERIFIE]) },
      }),
      this.qualityDecisionRepository.count(),
      this.qualityDecisionRepository.count({
        where: { status: DecisionStatus.APPROUVE },
      }),
    ]);

    // NC Rate
    const ncRate = totalInspections > 0 ? (totalNCs / totalInspections) * 100 : 0;

    // Closure Rate
    const closureRate = totalNCs > 0 ? (closedNCs / totalNCs) * 100 : 0;

    // Average Closure Time
    const closedWithTime = ncRecords.filter(nc => nc.closed_at);
    const averageClosureTime = closedWithTime.length > 0
      ? closedWithTime.reduce((acc, nc) => {
          const diff = new Date(nc.closed_at).getTime() - new Date(nc.detected_at).getTime();
          return acc + diff;
        }, 0) / closedWithTime.length / (1000 * 60 * 60 * 24)
      : 0;

    // Inspection Completion Rate
    const inspectionCompletionRate = totalInspections > 0 
      ? (completedInspections / totalInspections) * 100 
      : 0;

    // Corrective Action Completion Rate
    const correctiveActionCompletionRate = totalCorrectiveActions > 0
      ? (completedCorrectiveActions / totalCorrectiveActions) * 100
      : 0;

    // Decision Approval Rate
    const decisionApprovalRate = totalDecisions > 0
      ? (approvedDecisions / totalDecisions) * 100
      : 0;

    return {
      ncRate,
      closureRate,
      averageClosureTime,
      inspectionCompletionRate,
      correctiveActionCompletionRate,
      decisionApprovalRate,
    };
  }

  /**
   * Get inspection statistics
   */
  async getInspectionStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    byResult: Record<InspectionResult, number>;
    completionRate: number;
  }> {
    const inspections = await this.inspectionRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    const total = inspections.length;
    const completed = inspections.filter(i => i.status === InspectionStatus.COMPLETED).length;
    const cancelled = inspections.filter(i => i.status === InspectionStatus.CANCELLED).length;

    const byResult = {
      [InspectionResult.CONFORME]: inspections.filter(i => i.result === InspectionResult.CONFORME).length,
      [InspectionResult.NON_CONFORME]: inspections.filter(i => i.result === InspectionResult.NON_CONFORME).length,
      [InspectionResult.EN_ATTENTE]: inspections.filter(i => i.result === InspectionResult.EN_ATTENTE).length,
    };

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, cancelled, byResult, completionRate };
  }

  /**
   * Get corrective action statistics
   */
  async getCorrectiveActionStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    verified: number;
    pending: number;
    completionRate: number;
    averageCompletionTime: number;
  }> {
    const actions = await this.correctiveActionRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    const total = actions.length;
    const completed = actions.filter(a => a.status === CorrectiveActionStatus.TERMINE).length;
    const verified = actions.filter(a => a.status === CorrectiveActionStatus.VERIFIE).length;
    const pending = actions.filter(a => a.status === CorrectiveActionStatus.A_FAIRE).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Average completion time
    const completedWithTime = actions.filter(a => a.completed_at);
    const averageCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((acc, a) => {
          const diff = new Date(a.completed_at).getTime() - new Date(a.created_at).getTime();
          return acc + diff;
        }, 0) / completedWithTime.length / (1000 * 60 * 60 * 24)
      : 0;

    return { total, completed, verified, pending, completionRate, averageCompletionTime };
  }

  /**
   * Get quality decision statistics
   */
  async getQualityDecisionStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    byDecisionType: Record<DecisionType, number>;
    approvalRate: number;
  }> {
    const decisions = await this.qualityDecisionRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    const total = decisions.length;
    const approved = decisions.filter(d => d.status === DecisionStatus.APPROUVE).length;
    const rejected = decisions.filter(d => d.status === DecisionStatus.REJETE).length;
    const pending = decisions.filter(d => d.status === DecisionStatus.EN_ATTENTE).length;

    const byDecisionType = {
      [DecisionType.CONFORME]: decisions.filter(d => d.decision_type === DecisionType.CONFORME).length,
      [DecisionType.NON_CONFORME]: decisions.filter(d => d.decision_type === DecisionType.NON_CONFORME).length,
      [DecisionType.A_RETRAVAILLER]: decisions.filter(d => d.decision_type === DecisionType.A_RETRAVAILLER).length,
      [DecisionType.REBUT]: decisions.filter(d => d.decision_type === DecisionType.REBUT).length,
      [DecisionType.DEROGATION]: decisions.filter(d => d.decision_type === DecisionType.DEROGATION).length,
    };

    const approvalRate = total > 0 ? (approved / total) * 100 : 0;

    return { total, approved, rejected, pending, byDecisionType, approvalRate };
  }
}

export const qualityStatisticsService = new QualityStatisticsService();
